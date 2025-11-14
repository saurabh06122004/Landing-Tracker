'use client';
import { AppLayout } from '@/components/app-layout';
import { useLanguage } from '@/context/language-provider';
import * as React from 'react';

const navItems = [
  { href: '/admin', icon: 'LayoutDashboard', label: 'Dashboard', tooltip: 'Dashboard' },
  { href: '/admin/analytics', icon: 'BarChart3', label: 'Analytics', tooltip: 'Analytics' },
  { href: '/admin/borrowers', icon: 'Users', label: 'Borrowers', tooltip: 'Borrowers' },
];

const user = {
    name: 'Catherine L.',
    email: 'catherine.l@loanwise.com',
    avatarId: 'avatar-2'
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { addTexts } = useLanguage();
    React.useEffect(() => {
    const textsToRegister = navItems.flatMap(item => [item.label, item.tooltip]);
    addTexts(textsToRegister);
  }, [addTexts]);

  return <AppLayout navItems={navItems} user={user}>{children}</AppLayout>;
}
