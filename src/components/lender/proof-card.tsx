'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  IndianRupee,
  MapPin,
  Calendar,
  ShieldCheck,
  ShieldAlert,
  HelpCircle,
  CheckCircle,
  XCircle,
  Sparkles,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Proof } from '@/lib/types';
import { Button } from '../ui/button';
import { performReceiptVerification } from '@/app/actions/verify';
import { useToast } from '@/hooks/use-toast';
import { updateProofStatus } from '@/app/actions/proofs';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);

const statusIcons = {
  approved: <CheckCircle className="h-5 w-5 text-green-600" />,
  pending: <HelpCircle className="h-5 w-5 text-yellow-600" />,
  rejected: <XCircle className="h-5 w-5 text-red-600" />,
};

const statusColors = {
  approved: 'border-green-200 bg-green-50/50',
  pending: 'border-yellow-200 bg-yellow-50/50',
  rejected: 'border-red-200 bg-red-50/50',
};

const relevanceColors = {
    high: { icon: <ShieldCheck className="h-5 w-5 flex-shrink-0 text-green-600" />, text: 'text-green-800', bg: 'bg-green-50', border: 'border-green-200', title: 'Highly Relevant' },
    medium: { icon: <ShieldCheck className="h-5 w-5 flex-shrink-0 text-blue-600" />, text: 'text-blue-800', bg: 'bg-blue-50', border: 'border-blue-200', title: 'Moderately Relevant' },
    low: { icon: <AlertTriangle className="h-5 w-5 flex-shrink-0 text-yellow-600" />, text: 'text-yellow-800', bg: 'bg-yellow-50', border: 'border-yellow-200', title: 'Low Relevance' },
    irrelevant: { icon: <ShieldAlert className="h-5 w-5 flex-shrink-0 text-red-600" />, text: 'text-red-800', bg: 'bg-red-50', border: 'border-red-200', title: 'Irrelevant' },
};


export function ProofVerificationCard({ proof, loanId, borrowerId, loanPurpose }: { proof: Proof, loanId: string, borrowerId: string, loanPurpose: string }) {
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [verificationResult, setVerificationResult] = React.useState<{
    isAuthentic: boolean;
    reason: string;
    relevance: 'high' | 'medium' | 'low' | 'irrelevant';
  } | null>(null);

  const handleVerify = async () => {
     if (!proof.image_urls || proof.image_urls.length === 0) {
        toast({ variant: 'destructive', title: 'Verification Error', description: 'No image found for this proof.' });
        return;
    }
    setIsVerifying(true);
    setVerificationResult(null);
    const result = await performReceiptVerification(proof.image_urls[0], loanPurpose);
    setVerificationResult(result);
    setIsVerifying(false);
  };
  
  const handleUpdateStatus = async (newStatus: 'approved' | 'rejected') => {
    setIsUpdating(true);
    const relevance = verificationResult?.relevance || 'low'; // Default to low if not verified
    const documentCount = proof.image_urls?.length || 1;
    const result = await updateProofStatus(proof.id, borrowerId, newStatus, relevance, documentCount);
    if (result.success) {
      toast({
        title: `Proof ${newStatus}`,
        description: 'The proof status and borrower confidence score have been updated.',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: result.error,
      });
    }
    setIsUpdating(false);
  }

  const primaryImageUrl = proof.image_urls && proof.image_urls[0] ? proof.image_urls[0] : 'https://placehold.co/600x400?text=No+Image';

  return (
    <Card className={`flex flex-col ${statusColors[proof.status]}`}>
      <CardHeader>
        <a href={primaryImageUrl} target="_blank" rel="noopener noreferrer" className="block relative h-48 w-full overflow-hidden rounded-lg">
          <Image
            src={primaryImageUrl}
            alt={proof.description}
            fill={true}
            style={{objectFit: 'cover'}}
            className="transition-transform duration-300 hover:scale-110"
          />
        </a>
        <CardTitle className="pt-4">{proof.description}</CardTitle>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            {statusIcons[proof.status]}
            <Badge variant={proof.status === 'approved' ? 'default' : proof.status === 'rejected' ? 'destructive' : 'secondary'} className="capitalize">{proof.status}</Badge>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{new Date(proof.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <div className="flex items-center justify-between font-semibold">
          <span className="flex items-center gap-2">
            <IndianRupee className="h-5 w-5" /> Amount
          </span>
          <span>{formatCurrency(proof.amount)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-5 w-5" /> Location
          </span>
          <span className="text-right">
            {proof.latitude.toFixed(4)}, {proof.longitude.toFixed(4)}
          </span>
        </div>
        {verificationResult && (
           <div className={`mt-4 flex items-start gap-3 rounded-lg border p-3 text-sm ${verificationResult.isAuthentic ? relevanceColors[verificationResult.relevance].bg : 'bg-red-50'} ${verificationResult.isAuthentic ? relevanceColors[verificationResult.relevance].border : 'border-red-200'}`}>
             {verificationResult.isAuthentic ? relevanceColors[verificationResult.relevance].icon : <ShieldAlert className="h-5 w-5 flex-shrink-0 text-red-600" />}
             <div>
                <p className={`font-semibold ${verificationResult.isAuthentic ? relevanceColors[verificationResult.relevance].text : 'text-red-800'}`}>
                    {verificationResult.isAuthentic ? relevanceColors[verificationResult.relevance].title : 'Possible forgery detected'}
                </p>
                <p className={`text-xs ${verificationResult.isAuthentic ? relevanceColors[verificationResult.relevance].text.replace('800','700') : 'text-red-700'}`}>{verificationResult.reason}</p>
             </div>
           </div>
        )}
      </CardContent>
      <CardFooter className="mt-auto flex flex-col gap-2">
         <Button onClick={handleVerify} disabled={isVerifying || isUpdating} className="w-full">
          {isVerifying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" /> AI Check
            </>
          )}
        </Button>
        {proof.status === 'pending' && (
            <div className="w-full grid grid-cols-2 gap-2">
                <Button variant="outline" className="w-full border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700" onClick={() => handleUpdateStatus('approved')} disabled={isUpdating}>
                    {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                    Approve
                </Button>
                <Button variant="outline" className="w-full border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => handleUpdateStatus('rejected')} disabled={isUpdating}>
                    {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                    Reject
                </Button>
            </div>
        )}
      </CardFooter>
    </Card>
  );
}
