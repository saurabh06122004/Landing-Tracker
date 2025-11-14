import SignUpForm from '@/components/auth/signup-form';
import { Logo } from '@/components/icons';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function SignUpPage() {
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
    } else if (profile?.role === 'borrower') {
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
          <h1 className="text-4xl font-headline font-bold text-gray-800">Get Started with Rinn Raksha</h1>
          <p className="text-muted-foreground mt-2">Create your account to continue.</p>
        </div>
        <SignUpForm />
        <p className="text-center mt-4 text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/" className="underline text-accent-foreground hover:text-accent">
                Sign in
            </Link>
        </p>
      </main>
    </div>
  );
}
