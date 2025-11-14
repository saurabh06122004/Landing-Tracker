import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ProfileForm from '@/components/dashboard/profile-form';
import { UserProfile, UserMetrics } from '@/lib/types';
import ConfidenceScoreCard from '@/components/dashboard/confidence-score-card';

export default async function ProfilePage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    // Handle case where profile is not found, though it should exist for logged-in users.
    return <div>Profile not found.</div>;
  }
  
  const { data: metrics } = await supabase
    .from('user_metrics')
    .select('*')
    .eq('user_id', user.id)
    .single();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground">
          View and manage your personal information and confidence score.
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
            <ProfileForm profile={profile as UserProfile} />
        </div>
        <div>
            <ConfidenceScoreCard metrics={metrics as UserMetrics | null} />
        </div>
      </div>
    </div>
  );
}
