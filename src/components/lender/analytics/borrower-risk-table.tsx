'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Loan, UserProfile, UserMetrics } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface BorrowerRiskTableProps {
    borrowers: (UserProfile & { user_metrics: UserMetrics | UserMetrics[] | null })[];
    loans: Loan[];
}

const ITEMS_PER_PAGE = 5;

const getScoreColor = (score: number) => {
    if (score > 75) return 'bg-green-500';
    if (score > 40) return 'bg-yellow-500';
    return 'bg-red-500';
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
    notation: 'compact',
  }).format(amount);

export function BorrowerRiskTable({ borrowers, loans }: BorrowerRiskTableProps) {
    const avatarImage = PlaceHolderImages.find((img) => img.id === 'avatar-1');
    const [currentPage, setCurrentPage] = React.useState(1);

    const totalPages = Math.ceil(borrowers.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentBorrowers = borrowers.slice(startIndex, endIndex);

    const handlePrevious = () => {
        setCurrentPage((prev) => Math.max(prev - 1, 1));
    };

    const handleNext = () => {
        setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Borrower Risk Tiers</CardTitle>
                <CardDescription>Analysis of borrowers based on their confidence score and loan activity.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="overflow-x-auto">
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Borrower</TableHead>
                        <TableHead>Active Loans</TableHead>
                        <TableHead>Total Disbursed</TableHead>
                        <TableHead className="w-[200px]">Confidence Score</TableHead>
                        <TableHead className="text-right">Score</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {currentBorrowers.map((borrower) => {
                            const metrics = Array.isArray(borrower.user_metrics) ? borrower.user_metrics[0] : borrower.user_metrics;
                            const score = metrics?.confidence_score ?? 50;
                            const borrowerLoans = loans.filter(l => l.borrower_id === borrower.id);
                            const totalLoaned = borrowerLoans.reduce((acc, l) => acc + l.amount, 0);

                            return (
                                <TableRow key={borrower.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                {avatarImage && <AvatarImage src={avatarImage.imageUrl} data-ai-hint={avatarImage.imageHint} />}
                                                <AvatarFallback>{borrower.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="font-medium">{borrower.name}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{borrowerLoans.length}</TableCell>
                                    <TableCell>{formatCurrency(totalLoaned)}</TableCell>
                                    <TableCell>
                                        <Progress value={score} className="h-2" indicatorClassName={getScoreColor(score)} />
                                    </TableCell>
                                    <TableCell className="text-right font-semibold">{score}</TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                    </Table>
                </div>
            </CardContent>
            <CardFooter className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                </span>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrevious}
                        disabled={currentPage === 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNext}
                        disabled={currentPage === totalPages}
                    >
                        Next
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </CardFooter>
        </Card>
    )
}
