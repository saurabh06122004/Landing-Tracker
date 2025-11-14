'use client';

import { AppLayout } from '@/components/app-layout';
import { createClient } from '@/lib/supabase/client';
import { redirect } from 'next/navigation';
import type { UserProfile } from '@/lib/types';
import * as React from 'react';
import { useLanguage } from '@/context/language-provider';
import { useUser } from '@/hooks/use-user';


const navItems = [
  { href: '/borrower/dashboard', icon: 'LayoutDashboard', label: 'Dashboard' },
  { href: '/borrower/dashboard/upload', icon: 'Upload', label: 'Upload' },
  { href: '/borrower/dashboard/reports', icon: 'FileText', label: 'Reports' },
  { href: '/borrower/dashboard/profile', icon: 'User', label: 'Profile' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading: userLoading } = useUser();
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const { addTexts } = useLanguage();

  React.useEffect(() => {
    addTexts(navItems.map(item => item.label));
  }, [addTexts]);

  React.useEffect(() => {
    if (userLoading) return;
    if (!user) {
      redirect('/');
    }

    async function fetchProfile() {
        const supabase = createClient();
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user!.id)
            .single();
        if (data) {
            setProfile(data as UserProfile);
        }
    }
    fetchProfile();
  }, [user, userLoading]);

  if (userLoading || !profile) {
      return <div>Loading...</div> // Or a proper loading skeleton
  }
  
  const userProfile: UserProfile = profile || {
    id: user!.id,
    name: user!.email || 'User',
    email: user!.email || '',
    mobile_number: '',
    role: 'borrower',
  };

  return (
      <AppLayout navItems={navItems} user={userProfile}>
        {children}
      </AppLayout>
  );
}
