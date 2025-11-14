import Link from 'next/link';
import { Logo } from './icons';
import { Button } from './ui/button';

export function Header({ userName }: { userName?: string | null }) {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-card">
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <Link href="/" className="flex items-center space-x-2">
          <Logo />
        </Link>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-1">
            {userName && <span className="hidden sm:inline-block text-sm text-muted-foreground mr-4">Welcome, {userName}</span>}
            <Button variant="outline" onClick={() => alert('Signed Out!')}>
                Sign Out
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
