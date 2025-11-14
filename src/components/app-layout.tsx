'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as Icons from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Logo } from './icons';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { signOut } from '@/app/auth/actions';
import type { UserProfile } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Globe } from 'lucide-react';
import { useLanguage } from '@/context/language-provider';


type NavItem = {
  href: string;
  icon: keyof typeof Icons;
  label: string;
};

function BottomNav({ navItems }: { navItems: NavItem[] }) {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-card md:hidden">
      <div className="flex h-16 items-center justify-around">
        {navItems.map((item) => {
          const Icon = Icons[item.icon] as React.ElementType;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 p-2 rounded-md transition-colors text-muted-foreground hover:text-primary',
                isActive && 'text-primary bg-primary/10'
              )}
            >
              <Icon className="h-6 w-6" />
              <span className="text-xs font-medium">{t(item.label)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function UserMenu({ user }: { user: UserProfile }) {
    const avatarId = 'avatar-1';
    const avatar = PlaceHolderImages.find((img) => img.id === avatarId);
    const { t } = useLanguage();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                        {avatar && <AvatarImage src={avatar.imageUrl} alt={user.name} data-ai-hint={avatar.imageHint} />}
                        <AvatarFallback>{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t('My Account')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href={user.role === 'lender' ? '/lender/borrowers' : '/borrower/dashboard/profile'}>
                      {user.role === 'lender' ? t('Borrowers') : t('Profile')}
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>{t('Settings')}</DropdownMenuItem>
                <DropdownMenuSeparator />
                 <DropdownMenuItem asChild>
                    <form action={signOut} className="w-full">
                        <button type="submit" className="w-full text-left">{t('Sign out')}</button>
                    </form>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function LanguageSelector() {
    const { setLanguage, t } = useLanguage();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Globe className="h-5 w-5" />
                    <span className="sr-only">{t('Change language')}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setLanguage('en')}>English</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage('hi')}>Hindi</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage('mr')}>Marathi</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}


function DesktopNav({ navItems, user }: { navItems: NavItem[], user: UserProfile }) {
    const pathname = usePathname();
    const { t } = useLanguage();
    return (
    <header className="sticky top-0 z-40 hidden w-full border-b bg-card md:block">
        <div className="container flex h-16 items-center justify-between">
            <div className="flex items-center gap-6">
                <Logo />
                <nav className="flex items-center space-x-2">
                    {navItems.map(item => {
                        const isActive = pathname.startsWith(item.href);
                        return(
                            <Button key={item.href} variant={isActive ? "secondary" : "ghost"} asChild>
                                <Link href={item.href}>{t(item.label)}</Link>
                            </Button>
                        )
                    })}
                </nav>
            </div>
          
            <div className="flex items-center gap-4">
                <LanguageSelector />
                <UserMenu user={user} />
            </div>
        </div>
    </header>
    );
}

function MobileNav({ user }: { user: UserProfile }) {
    return (
        <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b bg-card px-4 md:hidden">
            <Logo />
            <div className="flex items-center gap-2">
                <LanguageSelector />
                <UserMenu user={user} />
            </div>
        </header>
    );
}

export function AppLayout({
  children,
  navItems,
  user,
}: {
  children: React.ReactNode;
  navItems: NavItem[];
  user: UserProfile;
}) {
  const { addTexts } = useLanguage();

  React.useEffect(() => {
    const textsToRegister = navItems.map(item => item.label);
    textsToRegister.push('My Account', 'Borrowers', 'Profile', 'Settings', 'Sign out', 'Change language');
    addTexts(textsToRegister);
  }, [addTexts, navItems]);


  return (
    <div className="min-h-screen bg-background">
      <DesktopNav navItems={navItems} user={user} />
      <MobileNav user={user} />
      <main className="container py-6 md:py-10">{children}</main>
      <BottomNav navItems={navItems} />
      {/* Spacer to prevent content from being hidden by bottom nav */}
      <div className="h-16 md:hidden" />
    </div>
  );
}
