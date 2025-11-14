'use server';

import { createClient } from '@/lib/supabase/server';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import type { UserProfile, UserMetrics } from '@/lib/types';
import Link from 'next/link';

const getScoreColor = (score: number) => {
    if (score > 75) return 'bg-green-500';
    if (score > 40) return 'bg-yellow-500';
    return 'bg-red-500';
};

export default async function BorrowersPage() {
  const supabase = createClient();

  const { data: borrowersData, error } = await supabase
    .from('profiles')
    .select('*, user_metrics(*)')
    .eq('role', 'borrower');

  if (error) {
    return <div>Error loading borrowers: {error.message}</div>;
  }

  const borrowers = (borrowersData || []) as (UserProfile & { user_metrics: UserMetrics | UserMetrics[] | null })[];
  const avatarImage = PlaceHolderImages.find((img) => img.id === 'avatar-1');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">All Borrowers</h1>
        <p className="text-muted-foreground">
          A list of all borrowers and their current confidence scores.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Borrower Directory</CardTitle>
          <CardDescription>
            Click on a borrower to view their detailed profile and loan history.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Borrower</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="w-[250px]">Confidence Score</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {borrowers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      No borrowers found.
                    </TableCell>
                  </TableRow>
                ) : (
                  borrowers.map((borrower) => {
                    const metrics = Array.isArray(borrower.user_metrics) ? borrower.user_metrics[0] : borrower.user_metrics;
                    const score = metrics?.confidence_score ?? 50;

                    return (
                      <TableRow key={borrower.id}>
                        <TableCell>
                           {/* This link is a placeholder, you can build out borrower detail pages later */}
                           <div className="flex items-center gap-3 group">
                            <Avatar>
                                {avatarImage && <AvatarImage src={avatarImage.imageUrl} data-ai-hint={avatarImage.imageHint} />}
                                <AvatarFallback>
                                    {borrower.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <span className="font-medium whitespace-nowrap">{borrower.name}</span>
                           </div>
                        </TableCell>
                        <TableCell>{borrower.email}</TableCell>
                        <TableCell>
                          <Progress value={score} className="h-2" indicatorClassName={getScoreColor(score)} />
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {score}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
