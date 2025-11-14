'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Banknote, TrendingUp, HandCoins, ShieldCheck } from "lucide-react";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);

interface KpiCardsProps {
    totalDisbursed: number;
    totalUtilized: number;
    portfolioUtilization: number;
    averageConfidence: number;
}

export function KpiCards({
    totalDisbursed,
    totalUtilized,
    portfolioUtilization,
    averageConfidence,
}: KpiCardsProps) {
  const kpis = [
    {
      title: "Total Disbursed",
      value: formatCurrency(totalDisbursed),
      icon: Banknote,
      description: "Total capital deployed."
    },
    {
      title: "Total Utilized",
      value: formatCurrency(totalUtilized),
      icon: HandCoins,
      description: "Verified capital spent by borrowers."
    },
    {
      title: "Portfolio Utilization",
      value: `${portfolioUtilization.toFixed(1)}%`,
      icon: TrendingUp,
      description: "Percentage of disbursed funds used."
    },
    {
      title: "Avg. Borrower Confidence",
      value: averageConfidence.toFixed(0),
      icon: ShieldCheck,
      description: "Average trust score of borrowers."
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => (
        <Card key={kpi.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
            <kpi.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpi.value}</div>
            <p className="text-xs text-muted-foreground">{kpi.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
