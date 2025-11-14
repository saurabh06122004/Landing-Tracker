'use server';
/**
 * @fileOverview Extracts information from a receipt image.
 *
 * This file defines the Genkit flow for extracting information from a receipt.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractReceiptInfoInputSchema = z.object({
    photoDataUri: z
    .string()
    .describe(
      "A photo of a receipt, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  description: z.string().describe('The description of the receipt item.'),
});
export type ExtractReceiptInfoInput = z.infer<typeof ExtractReceiptInfoInputSchema>;

const ExtractReceiptInfoOutputSchema = z.object({
  description: z.string().optional().describe('A brief description of the items purchased.'),
  amount: z.number().optional().describe('The total amount of the transaction.'),
});
export type ExtractReceiptInfoOutput = z.infer<typeof ExtractReceiptInfoOutputSchema>;

const prompt = ai.definePrompt({
    name: 'extractReceiptPrompt',
    input: {schema: ExtractReceiptInfoInputSchema},
    output: {schema: ExtractReceiptInfoOutputSchema},
    prompt: `You are an expert at extracting information from receipts.
Analyze the following receipt image and extract a brief, one-line description of the purchase and the total amount.

Receipt: {{media url=photoDataUri}}`,
  });


export const extractReceiptInfoFlow = ai.defineFlow(
  {
    name: 'extractReceiptInfoFlow',
    inputSchema: ExtractReceiptInfoInputSchema,
    outputSchema: ExtractReceiptInfoOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
