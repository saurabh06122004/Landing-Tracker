'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { type VerifyOtpParams } from '@supabase/ssr';

export async function signUpWithPassword(formData: FormData) {
  const supabase = createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  // First, sign up the user
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`,
    },
  });

  if (signUpError) {
    return { success: false, message: signUpError.message };
  }

  // If sign up is successful, then send the OTP.
  // We will now handle potential OTP rate-limit errors gracefully.
  const { error: otpError } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false, // The user has already been created.
    },
  });

  if (otpError) {
    // Even if OTP fails to send (e.g. rate-limited), the user exists.
    // We should let the user proceed to the OTP screen where they can
    // potentially request a new code later or enter the one they received.
    if (signUpData.user) {
        return { success: true, message: 'User created. Proceed to OTP verification.' };
    }
    return { success: false, message: otpError.message };
  }

  // Both signUp and signInWithOtp were successful.
  return { success: true, message: 'Confirmation code sent to your email.' };
}

export async function verifyOtpAndCreateProfile(formData: FormData) {
    const supabase = createClient();
    
    const email = formData.get('email') as string;
    const token = formData.get('token') as string;
    const name = formData.get('name') as string;
    const mobile = formData.get('mobile') as string;
    const role = formData.get('role') as string;

    if (!email || !token) {
        return { success: false, message: 'Email and OTP token are required.' };
    }

    const otpData: VerifyOtpParams = {
        email,
        token,
        type: 'email',
    };
    
    // Verify the OTP
    const { data: { session }, error: verificationError } = await supabase.auth.verifyOtp(otpData);

    if (verificationError || !session?.user) {
        return { success: false, message: verificationError?.message || 'Invalid OTP. Please try again.' };
    }

    // OTP is valid, user is now authenticated.
    // Now, create their profile.
    const { error: profileError } = await supabase.from('profiles').upsert({
        id: session.user.id,
        name,
        email,
        mobile_number: mobile,
        role,
        updated_at: new Date().toISOString(),
    });

    if (profileError) {
        // This is a tricky state. The user exists in auth but not in the DB.
        // For now, we'll sign them out and show an error.
        await supabase.auth.signOut();
        return { success: false, message: `Failed to create profile: ${profileError.message}` };
    }

    // Profile created, redirect to the correct dashboard
    if (role === 'lender') {
        redirect('/lender/dashboard');
    } else {
        redirect('/borrower/dashboard');
    }
}


export async function signInWithPassword(formData: FormData) {
    const supabase = createClient();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error || !data.user) {
        redirect(`/?message=${error?.message || 'Could not authenticate user'}`);
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();
    
    if (profile?.role === 'lender') {
        redirect('/lender/dashboard');
    } else {
        redirect('/borrower/dashboard');
    }
}


export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/');
}
