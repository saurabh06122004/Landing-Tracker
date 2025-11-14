'use server';

import { extractReceiptInfoFlow } from '@/ai/flows/extract-receipt-info';
import type { ExtractReceiptInfoInput, ExtractReceiptInfoOutput } from '@/ai/flows/extract-receipt-info';

export async function extractReceiptInfo(input: ExtractReceiptInfoInput): Promise<{ success: boolean; data?: ExtractReceiptInfoOutput; error?: string }> {
  try {
    const result = await extractReceiptInfoFlow(input);
    return { success: true, data: result };
  } catch (e: any) {
    console.error(e);
    return { success: false, error: e.message || 'An unknown error occurred.' };
  }
}
