import { cn } from '@/lib/utils';
import { Handshake } from 'lucide-react';

export const Logo = ({ className }: { className?: string }) => (
  <div className={cn('flex items-center gap-2 text-xl font-bold font-headline text-primary', className)}>
    <Handshake className="h-6 w-6" />
    <span>Rinn Raksha</span>
  </div>
);
