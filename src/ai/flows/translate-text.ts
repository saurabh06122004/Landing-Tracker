'use server';
/**
 * @fileOverview A flow for translating text using an AI model, with database caching.
 *
 * - translateTextFlow - A function that handles the translation process.
 * - TranslateTextInput - The input type for the translateText function.
 * - TranslateTextOutput - The return type for the translateText function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { createClient } from '@/lib/supabase/server';

const TranslateTextInputSchema = z.object({
  texts: z.array(z.string()).describe('An array of text strings to translate.'),
  targetLang: z.string().describe('The target language code (e.g., "hi" for Hindi).'),
});
export type TranslateTextInput = z.infer<typeof TranslateTextInputSchema>;

const TranslateTextOutputSchema = z.object({
  translations: z.array(z.string()).describe('An array of translated text strings.'),
});
export type TranslateTextOutput = z.infer<typeof TranslateTextOutputSchema>;


const prompt = ai.definePrompt({
    name: 'translateTextPrompt',
    input: { schema: TranslateTextInputSchema },
    output: { schema: TranslateTextOutputSchema },
    prompt: `Translate the following array of texts into the language with code "{{targetLang}}".
Return the translated texts in a JSON array under the key "translations", in the same order as the input. Do not provide any extra commentary or preamble.

Texts to translate:
{{{json texts}}}
`,
});

export const translateTextFlow = ai.defineFlow(
  {
    name: 'translateTextFlow',
    inputSchema: TranslateTextInputSchema,
    outputSchema: TranslateTextOutputSchema,
  },
  async ({ texts, targetLang }) => {
    // For "en", we don't need to translate.
    if (targetLang === 'en') {
      return { translations: texts };
    }

    const supabase = createClient();
    const finalTranslations: string[] = [];
    const keysToTranslate: string[] = [];
    const originalTextsMap = new Map<string, string>();

    // 1. Check cache first
    const { data: cachedTranslations, error: fetchError } = await supabase
      .from('translations')
      .select('key, value')
      .eq('lang', targetLang)
      .in('key', texts);

    if (fetchError) {
      console.error('Error fetching from cache:', fetchError);
      // On error, proceed to translate all
      keysToTranslate.push(...texts);
    } else {
      const cachedMap = new Map(cachedTranslations.map(t => [t.key, t.value]));
      for (const text of texts) {
        if (cachedMap.has(text)) {
          finalTranslations.push(cachedMap.get(text)!);
        } else {
          finalTranslations.push(''); // Placeholder
          keysToTranslate.push(text);
          originalTextsMap.set(text, text);
        }
      }
    }

    // 2. If some texts are not in cache, translate them
    if (keysToTranslate.length > 0) {
      const { output } = await prompt({ texts: keysToTranslate, targetLang });
      const newTranslations = output?.translations || [];
      
      const recordsToInsert = [];
      let translationIndex = 0;
      for (let i = 0; i < finalTranslations.length; i++) {
        if (finalTranslations[i] === '') {
          const originalText = texts[i];
          const translatedText = newTranslations[translationIndex] || originalText;
          finalTranslations[i] = translatedText;
          recordsToInsert.push({ lang: targetLang, key: originalText, value: translatedText });
          translationIndex++;
        }
      }

      // 3. Save to cache
      if (recordsToInsert.length > 0) {
        const { error: insertError } = await supabase.from('translations').insert(recordsToInsert);
        if (insertError) {
          console.error('Error saving new translations:', insertError);
        }
      }
    }

    // Ensure final list is in the same order as input `texts`
    const orderedTranslations = texts.map(originalText => {
        const cached = cachedTranslations?.find(c => c.key === originalText);
        if (cached) return cached.value;

        const translationIndex = keysToTranslate.indexOf(originalText);
        if (translationIndex !== -1) {
            return newTranslations[translationIndex] || originalText;
        }
        return originalText; // Should not happen
    })
    
    // The logic above is a bit complex, let's simplify the final mapping.
    const resultTranslations = new Map<string, string>();
    texts.forEach(text => resultTranslations.set(text, text)); // Default to original
    cachedTranslations?.forEach(t => resultTranslations.set(t.key, t.value));
    
    if (keysToTranslate.length > 0) {
      const newTranslationsResult = (await prompt({ texts: keysToTranslate, targetLang })).output?.translations || [];
      const recordsToInsert = [];
      for (let i = 0; i < keysToTranslate.length; i++) {
          const key = keysToTranslate[i];
          const value = newTranslationsResult[i] || key;
          resultTranslations.set(key, value);
          recordsToInsert.push({lang: targetLang, key, value});
      }
      if (recordsToInsert.length > 0) {
          await supabase.from('translations').insert(recordsToInsert);
      }
    }

    return { translations: texts.map(key => resultTranslations.get(key)!) };
  }
);
