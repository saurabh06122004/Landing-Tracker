'use client';

import { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { signUpWithPassword, verifyOtpAndCreateProfile } from '@/app/auth/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';

const detailsSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  mobile: z.string().min(10, { message: 'Please enter a valid 10-digit mobile number.' }).max(15),
  role: z.enum(['borrower', 'lender'], { required_error: 'Please select a role.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

const otpSchema = z.object({
    token: z.string().min(6, { message: "Your one-time password must be 6 characters." }),
});

type DetailsFormValues = z.infer<typeof detailsSchema>;
type OtpFormValues = z.infer<typeof otpSchema>;

type FormStep = 'details' | 'otp';

const COOLDOWN_SECONDS = 60;

export default function SignUpForm() {
  const [step, setStep] = useState<FormStep>('details');
  const [formError, setFormError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const detailsForm = useForm<DetailsFormValues>({
    resolver: zodResolver(detailsSchema),
    defaultValues: { name: '', email: '', mobile: '', role: 'borrower', password: '', confirmPassword: '' },
  });

  const otpForm = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { token: '' },
  });

  const isDetailsSubmitting = detailsForm.formState.isSubmitting;
  const isOtpSubmitting = otpForm.formState.isSubmitting;

  async function onDetailsSubmit(data: DetailsFormValues) {
    if (cooldown > 0) return;
    setFormError(null);
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value);
    });

    const result = await signUpWithPassword(formData);

    if (!result.success) {
      setFormError(result.message || 'An unexpected error occurred.');
    } else {
      toast({ title: 'Verification Code Sent', description: 'Check your email for the OTP.' });
      setCooldown(COOLDOWN_SECONDS);
      setStep('otp');
    }
  }
  
  async function onOtpSubmit(data: OtpFormValues) {
    setFormError(null);
    const detailsData = detailsForm.getValues();
    const formData = new FormData();
    
    // Append details and OTP to form data
    Object.entries(detailsData).forEach(([key, value]) => formData.append(key, value));
    formData.append('token', data.token);

    const result = await verifyOtpAndCreateProfile(formData);
    
    if (result && !result.success) {
      setFormError(result.message || 'Failed to verify OTP. Please try again.');
    }
    // On success, the action handles the redirect
  }

  const isButtonDisabled = isDetailsSubmitting || cooldown > 0;

  return (
    <Card className="w-full max-w-md shadow-2xl bg-card/80 backdrop-blur-sm overflow-hidden">
        <AnimatePresence mode="wait">
            {step === 'details' && (
                <motion.div
                    key="details"
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 50 }}
                    transition={{ duration: 0.3 }}
                >
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl">Create Account</CardTitle>
                        <CardDescription>Enter your details to get started.</CardDescription>
                    </CardHeader>
                    <FormProvider {...detailsForm}>
                        <form onSubmit={detailsForm.handleSubmit(onDetailsSubmit)}>
                            <CardContent className="space-y-4">
                                <FormField
                                  control={detailsForm.control}
                                  name="name"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Full Name</FormLabel>
                                      <FormControl>
                                        <Input placeholder="John Doe" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={detailsForm.control}
                                  name="email"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Email</FormLabel>
                                      <FormControl>
                                        <Input type="email" placeholder="you@example.com" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={detailsForm.control}
                                  name="mobile"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Mobile Number</FormLabel>
                                      <FormControl>
                                        <Input type="tel" placeholder="+1 123 456 7890" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={detailsForm.control}
                                  name="password"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Password</FormLabel>
                                      <FormControl>
                                        <Input type="password" placeholder="••••••••" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={detailsForm.control}
                                  name="confirmPassword"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Confirm Password</FormLabel>
                                      <FormControl>
                                        <Input type="password" placeholder="••••••••" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={detailsForm.control}
                                  name="role"
                                  render={({ field }) => (
                                    <FormItem className="space-y-3">
                                      <FormLabel>I am a...</FormLabel>
                                        <RadioGroup
                                          onValueChange={field.onChange}
                                          defaultValue={field.value}
                                          className="flex flex-col space-y-1"
                                          {...field}
                                        >
                                          <FormItem className="flex items-center space-x-3 space-y-0">
                                            <FormControl>
                                              <RadioGroupItem value="borrower" />
                                            </FormControl>
                                            <FormLabel className="font-normal">Borrower</FormLabel>
                                          </FormItem>
                                          <FormItem className="flex items-center space-x-3 space-y-0">
                                            <FormControl>
                                              <RadioGroupItem value="lender" />
                                            </FormControl>
                                            <FormLabel className="font-normal">Lender</FormLabel>
                                          </FormItem>
                                        </RadioGroup>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                            </CardContent>
                            <CardFooter className="flex-col items-stretch">
                                {formError && <p className="text-sm text-destructive mb-4">{formError}</p>}
                                <Button type="submit" className="w-full bg-accent hover:bg-accent/90" disabled={isButtonDisabled}>
                                    {isDetailsSubmitting ? (
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                      'Get Verification Code'
                                    )}
                                    {cooldown > 0 && ` (${cooldown}s)`}
                                </Button>
                            </CardFooter>
                        </form>
                    </FormProvider>
                </motion.div>
            )}

            {step === 'otp' && (
                <motion.div
                    key="otp"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                >
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl">Verify Your Email</CardTitle>
                        <CardDescription>Enter the 6-digit code sent to {detailsForm.getValues('email')}.</CardDescription>
                    </CardHeader>
                     <FormProvider {...otpForm}>
                        <form onSubmit={otpForm.handleSubmit(onOtpSubmit)}>
                            <CardContent>
                                <FormField
                                    control={otpForm.control}
                                    name="token"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>One-Time Password</FormLabel>
                                            <FormControl>
                                                <Input placeholder="123456" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                            <CardFooter className="flex-col items-stretch">
                                {formError && <p className="text-sm text-destructive mb-4">{formError}</p>}
                                <Button type="submit" className="w-full bg-accent hover:bg-accent/90" disabled={isOtpSubmitting}>
                                    {isOtpSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Verify & Create Account
                                </Button>
                                <Button variant="link" size="sm" className="mt-2 text-muted-foreground" onClick={() => { setStep('details'); setFormError(null); }}>
                                    Back to details
                                </Button>
                            </CardFooter>
                        </form>
                    </FormProvider>
                </motion.div>
            )}
        </AnimatePresence>
    </Card>
  );
}
