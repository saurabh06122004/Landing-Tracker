'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { UserMetrics } from '@/lib/types';
import { Activity } from 'lucide-react';

const getScoreColor = (score: number) => {
    if (score > 75) return 'bg-green-500';
    if (score > 40) return 'bg-yellow-500';
    return 'bg-red-500';
};

const getScoreTier = (score: number) => {
    if (score > 90) return 'Excellent';
    if (score > 75) return 'Good';
    if (score > 60) return 'Fair';
    if (score > 40) return 'Needs Improvement';
    return 'Poor';
}

export default function ConfidenceScoreCard({ metrics }: { metrics: UserMetrics | null }) {
  const score = metrics?.confidence_score ?? 50; // Default to 50 if no metrics exist

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center gap-4">
        <Activity className="h-6 w-6 text-primary" />
        <div>
          <CardTitle>Confidence Score</CardTitle>
          <CardDescription>Based on your verification history.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center gap-4 text-center">
        <div className="relative h-28 w-28">
          <svg className="h-full w-full" viewBox="0 0 36 36">
            <path
              className="stroke-current text-gray-200"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              strokeWidth="3"
            />
            <path
              className={`stroke-current ${getScoreColor(score).replace('bg-','text-')}`}
              strokeDasharray={`${score}, 100`}
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              strokeWidth="3"
              strokeLinecap="round"
              transform="rotate(90 18 18)"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold">{score}</span>
            <span className="text-xs text-muted-foreground">/ 100</span>
          </div>
        </div>
        <div className="text-lg font-semibold">{getScoreTier(score)}</div>
        <p className="text-xs text-muted-foreground px-4">
            A higher score indicates a better track record of submitting relevant and authentic proofs.
        </p>
      </CardContent>
    </Card>
  );
}
