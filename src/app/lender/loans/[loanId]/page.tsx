'use server';

import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  IndianRupee,
  BadgePercent,
  TrendingUp,
  FileWarning
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { getUtilizedAmount, type Loan, type Proof } from '@/lib/types';
import { ProofVerificationCard } from '@/components/lender/proof-card';
import { SummarizeUtilizationButton } from '@/components/lender/summarize-utilization-button';
import type { UserProfile } from '@/lib/types';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);

function LoanDetailCard({
  icon: Icon,
  title,
  value,
}: {
  icon: React.ElementType;
  title: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 rounded-lg border bg-card p-4">
      <div className="rounded-full bg-primary/10 p-3">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-lg font-semibold">{value}</p>
      </div>
    </div>
  );
}

export default async function LoanVerificationPage({
  params,
}: {
  params: { loanId: string };
}) {
  const supabase = createClient();
  const { data: loanData, error: loanError } = await supabase
    .from('loans')
    .select('*, proofs(*), borrower:profiles!loans_borrower_id_fkey(*)')
    .eq('id', params.loanId)
    .single();

  if (loanError || !loanData) {
    notFound();
  }
  
  const loan: Loan & {borrower: UserProfile, proofs: Proof[]} = {
      ...loanData,
      borrower: loanData.borrower as UserProfile,
      proofs: loanData.proofs as Proof[],
  };

  const utilizedAmount = getUtilizedAmount(loan);
  const utilizationPercentage =
    loan.amount > 0 ? (utilizedAmount / loan.amount) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Loan Verification</h1>
        <p className="text-muted-foreground">
          Review and verify proofs for {loan.borrower.name}'s {loan.purpose} Loan ({loan.id}).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Loan Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <LoanDetailCard
              icon={IndianRupee}
              title="Total Amount"
              value={formatCurrency(loan.amount)}
            />
            <LoanDetailCard
              icon={TrendingUp}
              title="Amount Utilized"
              value={formatCurrency(utilizedAmount)}
            />
             <LoanDetailCard
              icon={BadgePercent}
              title="Interest Rate"
              value={`${loan.interest_rate}%`}
            />
            <LoanDetailCard
              icon={FileWarning}
              title="Pending Proofs"
              value={loan.proofs.filter(p => p.status === 'pending').length}
            />
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Utilization Progress</Label>
            <div className="flex items-center gap-4">
              <Progress value={utilizationPercentage} className="h-3" />
              <span className="font-semibold">{utilizationPercentage.toFixed(1)}%</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div>
        <div className="mb-4 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">Submitted Proofs</h2>
          <SummarizeUtilizationButton loan={loan} />
        </div>
        {loan.proofs.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-12 text-center">
            <FileWarning className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No Proofs Submitted</h3>
            <p className="mt-1 text-sm text-muted-foreground">The borrower has not uploaded any proofs of utilization yet.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {loan.proofs.map((proof) => (
              <ProofVerificationCard key={proof.id} proof={proof} loanId={loan.id} borrowerId={loan.borrower_id} loanPurpose={loan.purpose} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
