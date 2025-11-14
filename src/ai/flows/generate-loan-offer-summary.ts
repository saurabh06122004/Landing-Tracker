'use server';

/**
 * @fileOverview Generates a summary of a loan offer for lenders and borrowers.
 *
 * - generateLoanOfferSummary - A function that generates the loan offer summary.
 * - LoanOfferSummaryInput - The input type for the generateLoanOfferSummary function.
 * - LoanOfferSummaryOutput - The return type for the generateLoanOfferSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const LoanOfferSummaryInputSchema = z.object({
  loanAmount: z.number().describe('The total amount of the loan.'),
  interestRate: z.number().describe('The annual interest rate of the loan.'),
  loanTermMonths: z.number().describe('The term of the loan in months.'),
  purpose: z.string().describe('The purpose of the loan.'),
  borrowerName: z.string().describe('The name of the borrower.'),
  lenderName: z.string().describe('The name of the lender.'),
  additionalTerms: z.string().optional().describe('Any additional terms or conditions of the loan.'),
});
export type LoanOfferSummaryInput = z.infer<typeof LoanOfferSummaryInputSchema>;

const LoanOfferSummaryOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the loan offer.'),
});
export type LoanOfferSummaryOutput = z.infer<typeof LoanOfferSummaryOutputSchema>;

export async function generateLoanOfferSummary(input: LoanOfferSummaryInput): Promise<LoanOfferSummaryOutput> {
  return generateLoanOfferSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'loanOfferSummaryPrompt',
  input: {schema: LoanOfferSummaryInputSchema},
  output: {schema: LoanOfferSummaryOutputSchema},
  prompt: `You are a financial expert summarizing loan offers for borrowers and lenders.
  Summarize the following loan offer details in a clear and concise manner, highlighting key terms and benefits for both parties.

  Loan Amount: {{{loanAmount}}}
  Interest Rate: {{{interestRate}}}%
  Loan Term: {{{loanTermMonths}}} months
  Purpose: {{{purpose}}}
  Borrower: {{{borrowerName}}}
  Lender: {{{lenderName}}}
  Additional Terms: {{{additionalTerms}}}

  Summary:`,
});

const generateLoanOfferSummaryFlow = ai.defineFlow(
  {
    name: 'generateLoanOfferSummaryFlow',
    inputSchema: LoanOfferSummaryInputSchema,
    outputSchema: LoanOfferSummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
