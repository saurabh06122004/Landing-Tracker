'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  MapPin,
  Calendar,
  IndianRupee,
  Loader2,
  FileText,
  Sparkles,
  LocateFixed,
  UploadCloud,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { extractReceiptInfo } from '@/app/actions/extract';
import { useUser } from '@/hooks/use-user';
import { createClient } from '@/lib/supabase/client';
import type { Loan } from '@/lib/types';
import { uploadProof } from '@/app/actions/proofs';

export default function UploadProofPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useUser();

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isExtracting, setIsExtracting] = React.useState(false);
  
  const [description, setDescription] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [files, setFiles] = React.useState<File[]>([]);
  
  const [location, setLocation] = React.useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = React.useState<string | null>(null);

  const [activeLoan, setActiveLoan] = React.useState<Loan | null>(null);
  const [loadingLoan, setLoadingLoan] = React.useState(true);

  React.useEffect(() => {
    async function fetchActiveLoan() {
      if (!user) return;
      setLoadingLoan(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from('loans')
        .select('id')
        .eq('borrower_id', user.id)
        .eq('status', 'active')
        .limit(1)
        .single();
      
      if (data) {
        setActiveLoan(data as Loan);
      } else {
        toast({
          variant: 'destructive',
          title: 'No Active Loan Found',
          description: 'You must have an active loan to upload proofs.',
        });
      }
      setLoadingLoan(false);
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLocationError(null);
        },
        (error) => {
          const message = 
            error.code === error.PERMISSION_DENIED ? "Location access denied. Please enable it in your browser settings." :
            error.code === error.POSITION_UNAVAILABLE ? "Location information is unavailable." :
            error.code === error.TIMEOUT ? "The request to get user location timed out." :
            "An unknown error occurred while getting location.";
          setLocationError(message);
        }
      );
    } else {
      setLocationError("Geolocation is not supported by this browser.");
    }

    fetchActiveLoan();
  }, [user, toast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(selectedFiles);
      
      if (selectedFiles.length > 0) {
        handleExtractInfo(selectedFiles[0]);
      }
    }
  };

  const handleExtractInfo = async (file: File) => {
    setIsExtracting(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const dataUri = reader.result as string;
        const result = await extractReceiptInfo({ photoDataUri: dataUri, description: "receipt" });
        if (result.success) {
          setDescription(result.data?.description || '');
          setAmount(result.data?.amount?.toString() || '');
          toast({
            title: 'AI Extraction Complete',
            description: 'Description and amount have been auto-filled from the first document.',
          });
        } else {
          toast({
            variant: 'destructive',
            title: 'AI Extraction Failed',
            description: result.error,
          });
        }
        setIsExtracting(false);
      };
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not process the uploaded bill.',
      });
      setIsExtracting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0 || !activeLoan || !user) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please ensure you have an active loan and have selected at least one file to upload.',
      });
      return;
    }
    if (!location) {
      toast({
        variant: 'destructive',
        title: 'Location Required',
        description: 'Could not submit proof without a valid location. Please enable location services.',
      });
      return;
    }

    setIsSubmitting(true);
    
    const formData = new FormData();
    formData.append('loanId', activeLoan.id);
    formData.append('borrowerId', user.id);
    formData.append('description', description);
    formData.append('amount', amount);
    files.forEach(file => {
      formData.append(`imageFiles`, file);
    });
    formData.append('latitude', location.lat.toString());
    formData.append('longitude', location.lng.toString());
    formData.append('documentCount', files.length.toString());

    const result = await uploadProof(formData);

    if (result.success) {
      toast({
        title: 'Upload Successful',
        description: 'Your proof has been submitted for verification.',
      });
      router.push('/borrower/dashboard');
    } else {
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: result.error || 'An unknown error occurred.',
      });
    }

    setIsSubmitting(false);
  };

  const isFormDisabled = isSubmitting || isExtracting || loadingLoan || !activeLoan;

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Upload Proof</h1>
      <p className="text-muted-foreground mb-6">
        Submit bills, receipts, or photos as proof of loan fund usage.
      </p>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>New Utilization Proof</CardTitle>
            <CardDescription>
              {!activeLoan && !loadingLoan && 'You do not have an active loan to submit proofs against.'}
              {activeLoan && 'Upload your documents. AI will attempt to auto-fill details from the first file.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-8">
            <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  1
                </div>
                <h3 className="text-lg font-semibold">Upload Documents</h3>
              </div>
              <div className="space-y-2">
                <Label htmlFor="file-upload">Proof Documents (Up to 10)</Label>
                <div className="relative flex items-center gap-2">
                  <Input
                    id="file-upload"
                    name="imageFiles"
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    accept="image/*"
                    className="w-full"
                    disabled={isFormDisabled}
                    required
                  />
                   {isExtracting && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
                </div>
                 <p className="text-xs text-muted-foreground flex items-center gap-2 pt-1">
                    <Sparkles className="h-4 w-4 text-primary" />
                    The first document will be scanned by AI to auto-fill details.
                  </p>
              </div>
              {files.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Selected files:</p>
                  <ul className="text-sm text-muted-foreground list-disc pl-5 mt-2 max-h-32 overflow-y-auto">
                      {files.map((file, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <FileText className="h-4 w-4 flex-shrink-0" />
                            <span>{file.name}</span>
                          </li>
                      ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="space-y-4 rounded-lg border p-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    2
                    </div>
                    <h3 className="text-lg font-semibold">Verify Details</h3>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                        id="description"
                        name="description"
                        placeholder="e.g., Cement bags from hardware store"
                        required
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={isFormDisabled}
                    />
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <div className="relative">
                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                        id="amount"
                        name="amount"
                        type="number"
                        placeholder="0.00"
                        className="pl-8"
                        required
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        disabled={isFormDisabled}
                        />
                    </div>
                    </div>
                </div>
             </div>
            
            <div className="grid grid-cols-1 gap-4 text-sm text-muted-foreground sm:grid-cols-2">
              <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3">
                {location ? <MapPin className="h-5 w-5 text-primary" /> : <LocateFixed className="h-5 w-5 text-destructive" />}
                <span>
                    {location ? `Geo-tag: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : locationError || 'Fetching location...'}
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3">
                <Calendar className="h-5 w-5 text-primary" />
                <span>Timestamp will be added automatically</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="ml-auto bg-accent hover:bg-accent/90"
              disabled={isFormDisabled || files.length === 0}
            >
              {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
              ) : 'Submit for Verification'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
