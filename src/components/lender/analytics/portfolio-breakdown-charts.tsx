'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  PieChart,
  Pie,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend
} from 'recharts';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', '#8884d8', '#ffc658', '#a4de6c'];

interface BreakdownChartsProps {
  statusData: { name: string; value: number }[];
  purposeData: { name: string; value: number }[];
}

const CustomTooltip = ({ active, payload, label, formatter }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col space-y-1">
            <span className="text-[0.70rem] uppercase text-muted-foreground">
              {payload[0].name}
            </span>
            <span className="font-bold text-muted-foreground">
              {formatter ? formatter(payload[0].value) : payload[0].value}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};


export function PortfolioBreakdownCharts({ statusData, purposeData }: BreakdownChartsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Breakdown</CardTitle>
        <CardDescription>Loan status and utilization by purpose.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-6 sm:grid-cols-2 h-[300px]">
        <div className="flex flex-col items-center">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">By Status</h3>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Tooltip content={<CustomTooltip />} />
                    <Pie data={statusData} dataKey="value" nameKey="name" innerRadius="50%" outerRadius="70%">
                        {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                     <Legend iconSize={10} />
                </PieChart>
            </ResponsiveContainer>
        </div>
         <div className="flex flex-col items-center">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">By Purpose</h3>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Tooltip content={<CustomTooltip formatter={formatCurrency} />} />
                    <Pie data={purposeData} dataKey="value" nameKey="name" innerRadius="50%" outerRadius="70%">
                        {purposeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Legend iconSize={10} />
                </PieChart>
            </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
