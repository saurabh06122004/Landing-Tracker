'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Sparkles } from 'lucide-react';

import { generateLoanOfferSummary } from '@/ai/flows/generate-loan-offer-summary';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const loanOfferSchema = z.object({
  loanAmount: z.coerce.number().min(1, 'Loan amount must be positive'),
  interestRate: z.coerce.number().min(0, 'Interest rate cannot be negative').max(100),
  loanTermMonths: z.coerce.number().int().min(1, 'Term must be at least 1 month'),
  purpose: z.string().min(10, 'Please describe the loan purpose (min 10 chars)'),
  additionalTerms: z.string().optional(),
});

type LoanOfferFormValues = z.infer<typeof loanOfferSchema>;

interface LoanOfferGeneratorProps {
  borrowerName: string;
  lenderName: string;
}

export default function LoanOfferGenerator({ borrowerName, lenderName }: LoanOfferGeneratorProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoanOfferFormValues>({
    resolver: zodResolver(loanOfferSchema),
    defaultValues: {
      loanAmount: 10000,
      interestRate: 5,
      loanTermMonths: 36,
      purpose: '',
      additionalTerms: '',
    },
  });

  async function onSubmit(values: LoanOfferFormValues) {
    setIsLoading(true);
    setSummary(null);
    try {
      const result = await generateLoanOfferSummary({
        ...values,
        borrowerName,
        lenderName,
      });
      setSummary(result.summary);
    } catch (error) {
      console.error('Failed to generate summary:', error);
      setSummary('Sorry, we couldn\'t generate a summary at this time. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Loan Offer Generator</CardTitle>
          <CardDescription>Fill in the details to generate a concise loan offer summary.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="loanAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Loan Amount ($)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="10000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="interestRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Interest Rate (%)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder="5.5" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="loanTermMonths"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Term (Months)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="36" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="purpose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loan Purpose</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., Home renovation, debt consolidation..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="additionalTerms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Terms (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., No prepayment penalty..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading} className="bg-accent hover:bg-accent/90">
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Generate Summary
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <Sparkles className="text-accent" />
            AI-Generated Summary
          </CardTitle>
          <CardDescription>A clear and concise summary of the loan offer will appear here.</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : summary ? (
            <div className="prose prose-sm max-w-none text-foreground rounded-lg border bg-muted/30 p-4">
              <p>{summary}</p>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
              <p>Your loan summary is waiting to be created.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
