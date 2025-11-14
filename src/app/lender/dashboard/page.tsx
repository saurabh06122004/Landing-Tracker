'use server';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreateLoanForm } from '@/components/lender/create-loan-form';
import { createClient } from '@/lib/supabase/server';
import { getUtilizedAmount, type Loan, type Proof, type UserProfile } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';


const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);

const getLoanStatus = (loan: Loan & { proofs: Proof[]}) => {
    const utilized = getUtilizedAmount(loan);
    const utilizationRate = loan.amount > 0 ? utilized / loan.amount : 0;
    if (utilizationRate > 0.95) return { text: 'Fully Utilized', variant: 'default' as const, className: 'bg-blue-500/20 text-blue-700' };
    if (loan.proofs.some(p => p.status === 'pending')) return { text: 'Verification Pending', variant: 'secondary' as const };
    if (utilizationRate < 0.1) return { text: 'Under Utilized', variant: 'destructive' as const };
    return { text: 'On Track', variant: 'default' as const, className: 'bg-green-500/20 text-green-700' };
}

export default async function LenderDashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <div>User not found.</div>;
  }

  const { data: loansData, error } = await supabase
    .from('loans')
    .select('*, borrower:profiles!loans_borrower_id_fkey(*), proofs(*)')
    .eq('lender_id', user.id);

  const loans = (loansData || []) as (Loan & {borrower: UserProfile, proofs: Proof[]})[];
  
  const avatar = PlaceHolderImages.find((img) => img.id === 'avatar-1');


  return (
    <div className="flex flex-col gap-6">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Lender Dashboard</h1>
            <p className="text-muted-foreground">
                Monitor all disbursed loans and create new loan records in real-time.
            </p>
        </div>

      <CreateLoanForm />

      <Card>
        <CardHeader>
          <CardTitle>All Loans</CardTitle>
          <CardDescription>A list of all active loans being tracked.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Borrower</TableHead>
                  <TableHead>Loan Purpose</TableHead>
                  <TableHead>Loan Amount</TableHead>
                  <TableHead>Amount Utilized</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loans.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                            No loans found. Create one above to get started.
                        </TableCell>
                    </TableRow>
                ) : (
                    loans.map((loan) => {
                    const utilizedAmount = getUtilizedAmount(loan);
                    const status = getLoanStatus(loan);
                    return (
                        <TableRow key={loan.id} className="hover:bg-muted/50">
                        <TableCell>
                            <Link href={`/lender/loans/${loan.id}`} className="flex items-center gap-3 group">
                            <Avatar>
                                {avatar && <AvatarImage src={avatar.imageUrl} data-ai-hint={avatar.imageHint} />}
                                <AvatarFallback>
                                {loan.borrower.name.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <span className="font-medium group-hover:text-primary whitespace-nowrap">{loan.borrower.name}</span>
                            </Link>
                        </TableCell>
                        <TableCell>{loan.purpose}</TableCell>
                        <TableCell>{formatCurrency(loan.amount)}</TableCell>
                        <TableCell>{formatCurrency(utilizedAmount)}</TableCell>
                        <TableCell>
                            <Badge variant={status.variant} className={status.className}>
                            {status.text}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                            <Button variant="ghost" size="icon" asChild>
                            <Link href={`/lender/loans/${loan.id}`}>
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                            </Button>
                        </TableCell>
                        </TableRow>
                    );
                    })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
