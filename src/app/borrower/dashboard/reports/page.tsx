'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Download,
  Calendar as CalendarIcon,
  IndianRupee,
  BadgePercent,
  TrendingUp,
  Wallet,
  Clock,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { getUtilizedAmount, type Proof, type Loan } from '@/lib/types';
import { DateRange } from 'react-day-picker';
import { addDays, format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';

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

export default function ReportsPage() {
  const { user } = useUser();
  const [loan, setLoan] = React.useState<Loan | null>(null);
  const [loading, setLoading] = React.useState(true);

  const [date, setDate] = React.useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });

  React.useEffect(() => {
    async function fetchLoanData() {
      if (!user) return;
      const supabase = createClient();
      const { data, error } = await supabase
        .from('loans')
        .select(`
          *,
          proofs ( * )
        `)
        .eq('borrower_id', user.id)
        .eq('status', 'active')
        .order('created_at', { foreignTable: 'proofs', ascending: false })
        .limit(1)
        .single();
      
      if (data) {
        setLoan(data as Loan);
      }
      setLoading(false);
    }
    fetchLoanData();
  }, [user]);

  const utilizedAmount = loan ? getUtilizedAmount(loan) : 0;
  const utilizationPercentage =
    loan && loan.amount > 0 ? (utilizedAmount / loan.amount) * 100 : 0;

  const calculateEMI = (principal: number, annualRate: number, tenureMonths: number) => {
    if (principal <= 0 || tenureMonths <= 0) return 0;
    if (annualRate <= 0) return principal / tenureMonths;
    const monthlyRate = annualRate / 12 / 100;
    if (monthlyRate === 0) return principal / tenureMonths;
    const emi =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
      (Math.pow(1 + monthlyRate, tenureMonths) - 1);
    return emi;
  };
  
  const emi = loan ? calculateEMI(loan.amount, loan.interest_rate, loan.tenure) : 0;

  const filteredProofs = loan ? loan.proofs.filter((proof) => {
    const proofDate = new Date(proof.created_at);
    const from = date?.from ? new Date(date.from) : null;
    const to = date?.to ? new Date(date.to) : null;

    if (from && to) {
        from.setHours(0,0,0,0);
        to.setHours(23,59,59,999);
      return proofDate >= from && proofDate <= to;
    }
    return true;
  }) : [];
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!loan) {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Utilization Report</h1>
                <p className="text-muted-foreground">
                    You do not have an active loan to report on.
                </p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>No Loan Data</CardTitle>
                    <CardDescription>No loan data is available to generate a report.</CardDescription>
                </CardHeader>
            </Card>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Utilization Report</h1>
          <p className="text-muted-foreground">
            A detailed summary of your loan fund usage.
          </p>
        </div>
        <div className="flex w-full items-center gap-2 md:w-auto">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={'outline'}
                className={cn(
                  'w-full justify-start text-left font-normal md:w-[260px]',
                  !date && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, 'LLL dd, y')} -{' '}
                      {format(date.to, 'LLL dd, y')}
                    </>
                  ) : (
                    format(date.from, 'LLL dd, y')
                  )
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Loan Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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
              value={`${loan.interest_rate}% p.a.`}
            />
            <LoanDetailCard
              icon={Clock}
              title="Loan Tenure"
              value={`${loan.tenure} months`}
            />
             <LoanDetailCard
              icon={Wallet}
              title="Monthly EMI"
              value={formatCurrency(emi)}
            />
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Utilization Progress</span>
            <div className="flex items-center gap-4 mt-1">
              <Progress value={utilizationPercentage} className="h-3 flex-1" />
              <span className="font-semibold">{utilizationPercentage.toFixed(1)}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detailed Proofs</CardTitle>
          <CardDescription>
            A complete list of all proofs submitted within the selected date range.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proof</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProofs.length > 0 ? (
                  filteredProofs.map((proof) => (
                    <TableRow key={proof.id}>
                      <TableCell>
                         {proof.image_urls && proof.image_urls[0] && (
                            <a href={proof.image_urls[0]} target="_blank" rel="noopener noreferrer">
                                <Image
                                    src={proof.image_urls[0]}
                                    alt={proof.description}
                                    width={40}
                                    height={40}
                                    className="rounded-md object-cover"
                                />
                            </a>
                         )}
                      </TableCell>
                      <TableCell className="font-medium">{proof.description}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(proof.amount)}
                      </TableCell>
                      <TableCell>{new Date(proof.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            proof.status === 'approved'
                              ? 'default'
                              : proof.status === 'pending'
                              ? 'secondary'
                              : 'destructive'
                          }
                           className={proof.status === 'approved' ? 'bg-green-500/20 text-green-700 border-green-500/20' : ''}
                        >
                          {proof.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No proofs found for the selected date range.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
