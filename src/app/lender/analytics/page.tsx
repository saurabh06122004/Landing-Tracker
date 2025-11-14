'use server';

import { createClient } from '@/lib/supabase/server';
import type { Loan, Proof, UserProfile, UserMetrics } from '@/lib/types';
import { getUtilizedAmount } from '@/lib/types';
import { KpiCards } from '@/components/lender/analytics/kpi-cards';
import { UtilizationChart } from '@/components/lender/analytics/utilization-chart';
import { PortfolioBreakdownCharts } from '@/components/lender/analytics/portfolio-breakdown-charts';
import { BorrowerRiskTable } from '@/components/lender/analytics/borrower-risk-table';
import { Download, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generateReport } from '@/app/actions/reports';
import { DownloadReportButton } from '@/components/lender/analytics/download-report-button';

export default async function AnalyticsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <div>User not found. Please log in.</div>;
  }

  const { data: loansData, error } = await supabase
    .from('loans')
    .select('*, borrower:profiles!loans_borrower_id_fkey(*, user_metrics(*)), proofs(*)')
    .eq('lender_id', user.id);

  if (error) {
    console.error('Error fetching loans:', error);
    return <div>Error fetching loan data.</div>;
  }

  type LoanWithBorrowerMetrics = Loan & {
    borrower: UserProfile & { user_metrics: UserMetrics[] | null };
    proofs: Proof[];
  };

  const loans = (loansData || []) as LoanWithBorrowerMetrics[];

  // 1. KPI Calculations
  const totalDisbursed = loans.reduce((acc, loan) => acc + loan.amount, 0);
  const totalUtilized = loans.reduce((acc, loan) => acc + getUtilizedAmount(loan), 0);
  const portfolioUtilization = totalDisbursed > 0 ? (totalUtilized / totalDisbursed) * 100 : 0;
  
  const borrowers = loans.map(l => l.borrower).filter((b, index, self) => self.findIndex(t => t.id === b.id) === index);
  
  const totalConfidenceScore = borrowers.reduce((acc, b) => {
      const metrics = b.user_metrics && Array.isArray(b.user_metrics) ? b.user_metrics[0] : null;
      return acc + (metrics?.confidence_score ?? 50);
  }, 0);
  const averageConfidence = borrowers.length > 0 ? totalConfidenceScore / borrowers.length : 0;

  // 2. Data for Utilization Chart
  const monthlyUtilization: { [key: string]: number } = {};
  const allProofs = loans.flatMap(l => l.proofs);
  
  allProofs.forEach(proof => {
    if (proof.status === 'approved') {
      const month = new Date(proof.created_at).toLocaleString('default', { month: 'short', year: '2-digit' });
      if (!monthlyUtilization[month]) {
        monthlyUtilization[month] = 0;
      }
      monthlyUtilization[month] += proof.amount;
    }
  });

  const chartData = Object.entries(monthlyUtilization)
    .map(([date, amount]) => ({ date, amount }))
    .sort((a,b) => new Date(`1 ${a.date}`).getTime() - new Date(`1 ${b.date}`).getTime());


  // 3. Data for Portfolio Breakdown Charts
  const getLoanStatus = (loan: Loan & { proofs: Proof[] }) => {
      const utilized = getUtilizedAmount(loan);
      const utilizationRate = loan.amount > 0 ? utilized / loan.amount : 0;
      if (utilizationRate > 0.95) return 'Fully Utilized';
      if (loan.proofs.some(p => p.status === 'pending')) return 'Verification Pending';
      if (utilizationRate < 0.1 && loan.proofs.length === 0) return 'New';
      if (utilizationRate < 0.2) return 'Under Utilized';
      return 'On Track';
  }

  const statusCounts = loans.reduce((acc, loan) => {
    const status = getLoanStatus(loan);
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const purposeUtilization = loans.reduce((acc, loan) => {
    const purpose = loan.purpose || 'Uncategorized';
    acc[purpose] = (acc[purpose] || 0) + getUtilizedAmount(loan);
    return acc;
  }, {} as Record<string, number>);


  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Get real-time insights into your loan portfolio.
          </p>
        </div>
        <DownloadReportButton loans={loans} />
      </div>

      <KpiCards 
        totalDisbursed={totalDisbursed}
        totalUtilized={totalUtilized}
        portfolioUtilization={portfolioUtilization}
        averageConfidence={averageConfidence}
      />
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <UtilizationChart data={chartData} />
        </div>
        <div className="lg:col-span-2">
          <PortfolioBreakdownCharts 
            statusData={Object.entries(statusCounts).map(([name, value]) => ({name, value}))}
            purposeData={Object.entries(purposeUtilization).map(([name, value]) => ({name, value}))}
          />
        </div>
      </div>

      <BorrowerRiskTable borrowers={borrowers} loans={loans} />
    </div>
  );
}
