'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getUtilizedAmount, type Loan } from '@/lib/types';
import {
  PlusCircle,
  Megaphone,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);

function LoanOverviewChart({ loan }: { loan: Loan }) {
    const utilizedAmount = getUtilizedAmount(loan);
    const remainingAmount = loan.amount - utilizedAmount;

    const data = [
        { name: 'Amount Utilized', value: utilizedAmount, fill: 'hsl(var(--primary))' },
        { name: 'Amount Remaining', value: remainingAmount, fill: 'hsl(var(--primary) / 0.2)' },
    ];

    const total = loan.amount;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Loan Overview</CardTitle>
                <CardDescription>
                    Summary of your {loan.purpose} loan of {formatCurrency(total)}.
                </CardDescription>
            </CardHeader>
            <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Tooltip
                            cursor={{ fill: 'hsl(var(--muted))' }}
                            contentStyle={{
                                background: 'hsl(var(--background))',
                                borderRadius: 'var(--radius)',
                                border: '1px solid hsl(var(--border))',
                            }}
                            formatter={(value) => formatCurrency(Number(value))}
                        />
                        <Pie
                            data={data}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius="60%"
                            outerRadius="80%"
                            paddingAngle={5}
                            labelLine={false}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Pie>
                        <foreignObject x="50%" y="50%" width={200} height={100} style={{ transform: 'translate(-100px, -40px)', textAlign: 'center' }}>
                            <div className="text-2xl font-bold">{formatCurrency(utilizedAmount)}</div>
                            <div className="text-xs text-muted-foreground">Utilized of {formatCurrency(total)}</div>
                        </foreignObject>
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}

function RecentUploads({ loan }: { loan: Loan }) {
  if (!loan || !loan.proofs || loan.proofs.length === 0) {
    return (
       <Card className="col-span-1 lg:col-span-2">
         <CardHeader>
           <CardTitle>Recent Uploads</CardTitle>
           <CardDescription>No uploads found for this loan.</CardDescription>
         </CardHeader>
         <CardContent>
           <Button asChild size="sm">
             <Link href="/borrower/dashboard/upload">
               <PlusCircle className="mr-2 h-4 w-4" /> Upload First Proof
             </Link>
           </Button>
         </CardContent>
       </Card>
     );
  }
  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Uploads</CardTitle>
          <CardDescription>
            Proofs of utilization you&apos;ve recently submitted.
          </CardDescription>
        </div>
        <Button asChild size="sm">
          <Link href="/borrower/dashboard/upload">
            <PlusCircle className="mr-2 h-4 w-4" /> Upload New
          </Link>
        </Button>
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
              {loan.proofs.slice(0, 3).map((proof) => (
                <TableRow key={proof.id}>
                  <TableCell>
                    {proof.image_urls && proof.image_urls[0] && (
                        <Image
                        src={proof.image_urls[0]}
                        alt={proof.description}
                        width={40}
                        height={40}
                        className="rounded-md object-cover"
                        />
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
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function Announcements() {
  const announcements = [
    {
      title: 'New Loan Schemes Available!',
      description: "We're excited to announce lower interest rates for agricultural loans starting next month.",
      buttonText: 'Learn More',
    },
    {
      title: 'Digital Gold Loans',
      description: 'Get instant cash against your digital gold holdings with zero processing fees.',
      buttonText: 'Explore Now',
    },
    {
      title: 'Holiday Loan Offer',
      description: 'Planning a vacation? Get special holiday loan packages with flexible repayment options.',
      buttonText: 'Get a Quote',
    },
  ];

  return (
    <Carousel
      opts={{
        align: 'start',
        loop: true,
      }}
      className="w-full"
    >
      <CarouselContent>
        {announcements.map((announcement, index) => (
          <CarouselItem key={index}>
            <Card className="bg-primary/10 border-primary/20">
              <CardHeader className="flex flex-row items-start gap-4">
                <div className="p-3 rounded-full bg-primary/20 text-primary">
                  <Megaphone className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-primary">{announcement.title}</CardTitle>
                  <CardDescription className="text-primary/80">
                    {announcement.description}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="bg-transparent border-primary/50 text-primary hover:bg-primary/20 hover:text-primary">
                  {announcement.buttonText}
                </Button>
              </CardContent>
            </Card>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="absolute left-[-5px] top-1/2 -translate-y-1/2 hidden sm:flex" />
      <CarouselNext className="absolute right-[-5px] top-1/2 -translate-y-1/2 hidden sm:flex" />
    </Carousel>
  );
}

export default function BorrowerDashboardPage() {
  const { user } = useUser();
  const [loan, setLoan] = useState<Loan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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


  if (loading) {
     return <div>Loading...</div>;
  }

  if (!loan) {
    return (
      <div className="flex flex-col gap-6">
         <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
              You don&apos;t have any active loans.
          </p>
        </div>
        <Announcements />
        <Card>
          <CardHeader>
            <CardTitle>No Loan Data</CardTitle>
            <CardDescription>Apply for a loan to get started.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button>Apply for New Loan</Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col gap-6">
       <div>
        <h1 className="text-3xl font-bold tracking-tight">
            Dashboard
        </h1>
        <p className="text-muted-foreground">
            Here&apos;s an overview of your loan utilization.
        </p>
      </div>
      
      <Announcements />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <LoanOverviewChart loan={loan} />
        <RecentUploads loan={loan} />
      </div>
    </div>
  );
}
