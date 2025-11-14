'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Loader2, Sparkles } from 'lucide-react';
import * as React from 'react';
import type { Loan, Proof, UserProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

type SummarizeLoan = Loan & { borrower: UserProfile; proofs: Proof[] };

export function SummarizeUtilizationButton({ loan }: { loan: SummarizeLoan }) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [summary, setSummary] = React.useState('');

  const handleSummarize = async () => {
    setIsLoading(true);
    // In a real app, this would be a server action calling a GenAI model
    setTimeout(() => {
      const approvedProofs = loan.proofs.filter(p => p.status === 'approved');
      const pendingProofs = loan.proofs.filter(p => p.status === 'pending');
      const rejectedProofs = loan.proofs.filter(p => p.status === 'rejected');

      let generatedSummary = `${loan.borrower.name} has utilized ${approvedProofs.reduce((acc, p) => acc + p.amount, 0)} out of ${loan.amount} for their ${loan.purpose} loan.\n\n`;
      generatedSummary += `There are ${pendingProofs.length} proofs pending verification and ${rejectedProofs.length} have been rejected.\n\n`;
      if (approvedProofs.length > 0) {
        generatedSummary += 'Approved spending includes:\n';
        approvedProofs.forEach(p => {
            generatedSummary += `- ${p.description} (${p.amount})\n`;
        })
      }
       if (pendingProofs.length > 0) {
        generatedSummary += '\nPending verification for:\n';
        pendingProofs.forEach(p => {
            generatedSummary += `- ${p.description} (${p.amount})\n`;
        })
      }

      setSummary(generatedSummary);
      setIsLoading(false);
      toast({
        title: 'Summary Generated',
        description: 'The AI-powered summary is ready.',
      });
    }, 1500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Sparkles className="mr-2 h-4 w-4" />
          Summarize Utilization
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>AI-Powered Utilization Summary</DialogTitle>
          <DialogDescription>
            A quick overview of {loan.borrower.name}'s fund usage.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {isLoading ? (
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : summary ? (
            <div className="prose prose-sm max-w-none rounded-md border bg-muted/50 p-4 whitespace-pre-wrap">
                {summary}
            </div>
          ) : (
             <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">Click the button below to generate the summary.</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setIsOpen(false)}>Close</Button>
          <Button onClick={handleSummarize} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Generate Summary
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
