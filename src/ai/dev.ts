import { config } from 'dotenv';
config();

import '@/ai/flows/generate-loan-offer-summary.ts';
import '@/ai/flows/extract-receipt-info.ts';
import '@/ai/flows/translate-text.ts';
