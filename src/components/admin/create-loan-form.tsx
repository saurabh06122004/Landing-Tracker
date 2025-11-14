'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';
import { useToast } from '@/hooks/use-toast';
import { createLoan } from '@/app/actions/loans';
import type { UserProfile } from '@/lib/types';
import { Textarea } from '../ui/textarea';

const loanSchema = z.object({
  borrowerId: z.string().uuid('Please select a valid borrower.'),
  amount: z.coerce.number().positive('Amount must be positive.'),
  interestRate: z.coerce.number().min(0, 'Interest rate cannot be negative.'),
  tenure: z.coerce.number().int().positive('Tenure must be a positive number of months.'),
  purpose: z.string().min(1, 'Purpose is required.'),
});

type LoanFormValues = z.infer<typeof loanSchema>;

export function CreateLoanForm() {
  const { user: lender } = useUser();
  const { toast } = useToast();
  const [borrowers, setBorrowers] = React.useState<UserProfile[]>([]);
  const [loadingBorrowers, setLoadingBorrowers] = React.useState(true);
  const form = useForm<LoanFormValues>({
    resolver: zodResolver(loanSchema),
  });

  React.useEffect(() => {
    async function fetchBorrowers() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'borrower');

      if (data) {
        setBorrowers(data);
      }
      setLoadingBorrowers(false);
    }
    fetchBorrowers();
  }, []);

  async function onSubmit(values: LoanFormValues) {
    if (!lender) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to create a loan.' });
        return;
    }

    const result = await createLoan({ ...values, lenderId: lender.id });

    if (result.success) {
      toast({
        title: 'Loan Created Successfully',
        description: `The loan for ${values.amount} has been assigned.`,
      });
      form.reset();
    } else {
      toast({
        variant: 'destructive',
        title: 'Failed to Create Loan',
        description: result.error,
      });
    }
  }
  
  const isSubmitting = form.formState.isSubmitting;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Loan Record</CardTitle>
        <CardDescription>
          Manually create a loan for a borrower who applied physically. This will appear on their dashboard.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="grid gap-6">
            <FormField
              control={form.control}
              name="borrowerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Borrower</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loadingBorrowers}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={loadingBorrowers ? "Loading borrowers..." : "Select a borrower"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {borrowers.map((borrower) => (
                        <SelectItem key={borrower.id} value={borrower.id}>
                          {borrower.name} ({borrower.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Principal Amount</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="50000" {...field} />
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
                    <FormLabel>Interest Rate (% p.a.)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="8.5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tenure"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tenure (in Months)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="24" {...field} />
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
                      <Textarea placeholder="e.g., Purchase of agricultural equipment" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
          </CardContent>
          <CardFooter>
            <Button type="submit" className="ml-auto" disabled={isSubmitting || loadingBorrowers}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Loan
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
