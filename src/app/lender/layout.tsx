'use client';

import { AppLayout } from '@/components/app-layout';
import { createClient } from '@/lib/supabase/client';
import { redirect } from 'next/navigation';
import type { UserProfile } from '@/lib/types';
import * as React from 'react';
import { useLanguage } from '@/context/language-provider';
import { useUser } from '@/hooks/use-user';


const navItems = [
  { href: '/lender/dashboard', icon: 'LayoutDashboard', label: 'Dashboard' },
  { href: '/lender/analytics', icon: 'BarChart3', label: 'Analytics' },
  { href: '/lender/borrowers', icon: 'Users', label: 'Borrowers' },
];

export default function LenderLayout({
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
      return;
    }

    async function fetchProfile() {
      const supabase = createClient();
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single();

      if (data) {
        if (data.role !== 'lender') {
          redirect('/borrower/dashboard');
        } else {
          setProfile(data as UserProfile);
        }
      } else {
        // Profile not found, maybe sign out and redirect
        redirect('/');
      }
    }

    fetchProfile();
  }, [user, userLoading]);

  if (userLoading || !profile) {
    return <div>Loading...</div>; // Or a proper loading skeleton
  }

  return <AppLayout navItems={navItems} user={profile}>{children}</AppLayout>;
}
