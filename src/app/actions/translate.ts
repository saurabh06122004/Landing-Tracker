'use server';

import { translateTextFlow } from '@/ai/flows/translate-text';

// This server action is now a simple wrapper around the more powerful Genkit flow.
// The flow itself handles all the caching logic.
export async function getTranslations(lang: string, keys: string[]) {
  if (keys.length === 0) {
    return {};
  }
  
  if (lang === 'en') {
    const englishTranslations: Record<string, string> = {};
    keys.forEach(key => {
      englishTranslations[key] = key;
    });
    return englishTranslations;
  }

  try {
    const result = await translateTextFlow({ texts: keys, targetLang: lang });
    const translations: Record<string, string> = {};
    keys.forEach((key, index) => {
      translations[key] = result.translations[index] || key;
    });
    return translations;
  } catch (aiError) {
    console.error('AI translation failed:', aiError);
    // On failure, return the keys themselves as the translation.
    const fallbackTranslations: Record<string, string> = {};
    keys.forEach(key => fallbackTranslations[key] = key);
    return fallbackTranslations;
  }
}
