import AuthForm from '@/components/auth/auth-form';
import { Logo } from '@/components/icons';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function Home() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (profile?.role === 'lender') {
      redirect('/lender/dashboard');
    } else {
      redirect('/borrower/dashboard');
    }
  }

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-background p-4">
       <div className="absolute top-8 left-8">
        <Logo />
      </div>
      <main className="w-full max-w-md mx-auto z-10">
        <div className="text-center mb-8">
            <h1 className="text-4xl font-headline font-bold">Welcome Back to Rinn Raksha</h1>
            <p className="text-muted-foreground mt-2">The trusted platform for loan utilization tracking.</p>
        </div>
        <AuthForm />
        <p className="text-center mt-4 text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="underline text-accent-foreground hover:text-accent">
                Sign up
            </Link>
        </p>
      </main>
    </div>
  );
}
