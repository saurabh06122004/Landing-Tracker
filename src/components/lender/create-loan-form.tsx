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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Search } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';
import { useToast } from '@/hooks/use-toast';
import { createLoan } from '@/app/actions/loans';
import type { UserProfile } from '@/lib/types';
import { Textarea } from '../ui/textarea';

const loanSchema = z.object({
  borrowerId: z.string().uuid('Please select a valid borrower from the list.'),
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
  const [filteredBorrowers, setFilteredBorrowers] = React.useState<UserProfile[]>([]);
  const [loadingBorrowers, setLoadingBorrowers] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedBorrower, setSelectedBorrower] = React.useState<UserProfile | null>(null);

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
        setFilteredBorrowers(data);
      }
      setLoadingBorrowers(false);
    }
    fetchBorrowers();
  }, []);

  React.useEffect(() => {
    const results = borrowers.filter(b => 
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredBorrowers(results);
  }, [searchTerm, borrowers]);

  const handleSelectBorrower = (borrower: UserProfile) => {
    setSelectedBorrower(borrower);
    form.setValue('borrowerId', borrower.id);
  };

  async function onSubmit(values: LoanFormValues) {
    if (!lender) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to create a loan.' });
        return;
    }

    const result = await createLoan({ ...values, lenderId: lender.id });

    if (result.success) {
      toast({
        title: 'Loan Created Successfully',
        description: `The loan for ${values.amount} has been assigned to ${selectedBorrower?.name}.`,
      });
      form.reset();
      setSelectedBorrower(null);
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
          Search for a borrower and enter their loan details. This will appear on their dashboard.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="grid gap-6">
            <div>
              <FormLabel>Select Borrower</FormLabel>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by name or email..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="mt-2 h-48 space-y-2 overflow-auto rounded-md border p-2">
                {loadingBorrowers ? (
                  <p className="text-center text-sm text-muted-foreground p-4">Loading borrowers...</p>
                ) : filteredBorrowers.length > 0 ? (
                  filteredBorrowers.map((borrower) => (
                    <div
                      key={borrower.id}
                      onClick={() => handleSelectBorrower(borrower)}
                      className={`cursor-pointer rounded-lg border p-3 text-sm transition-colors ${
                        selectedBorrower?.id === borrower.id
                          ? 'bg-primary/10 border-primary/50'
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <p className="font-semibold">{borrower.name}</p>
                      <p className="text-muted-foreground">{borrower.email}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-sm text-muted-foreground p-4">No borrowers found.</p>
                )}
              </div>
               <FormField
                control={form.control}
                name="borrowerId"
                render={({ field }) => (
                  <FormItem>
                    <FormMessage className="mt-2"/>
                  </FormItem>
                )}
              />
            </div>

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
            <Button type="submit" className="ml-auto" disabled={isSubmitting || loadingBorrowers || !selectedBorrower}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Loan
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
