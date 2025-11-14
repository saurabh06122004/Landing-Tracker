'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { generateReport } from '@/app/actions/reports';
import type { Loan, Proof, UserProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

type LoanWithRelations = Loan & { borrower: UserProfile; proofs: Proof[] };

export function DownloadReportButton({ loans }: { loans: LoanWithRelations[] }) {
    const [isLoading, setIsLoading] = React.useState(false);
    const { toast } = useToast();

    const handleDownload = async () => {
        setIsLoading(true);
        try {
            const buffer = await generateReport(loans);
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'Loan_Portfolio_Report.xlsx';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();

             toast({
                title: 'Report Downloaded',
                description: 'Your Excel report has been successfully generated.',
            });
        } catch (error) {
            console.error('Failed to generate report:', error);
            toast({
                variant: 'destructive',
                title: 'Download Failed',
                description: 'Could not generate the report. Please try again.',
            });
        }
        setIsLoading(false);
    }

    return (
        <Button onClick={handleDownload} disabled={isLoading}>
            {isLoading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                </>
            ) : (
                <>
                    <Download className="mr-2 h-4 w-4" />
                    Download Report
                </>
            )}
        </Button>
    )
}
