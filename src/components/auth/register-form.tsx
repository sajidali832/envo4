
"use client";

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { sendWelcomeEmail } from '@/app/actions/email';

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters.').max(20, 'Username must be less than 20 characters.'),
  email: z.string().email('Please enter a valid email.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();
  const phone = searchParams.get('phone');

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof registerSchema>) {
    setIsSubmitting(true);

    if (!phone) {
      toast({ variant: 'destructive', title: 'Registration Error', description: 'Your payment approval could not be found. Please try again or contact support.' });
      setIsSubmitting(false);
      return;
    }

    // 1. Check if payment was approved for this phone number
    const { data: submission, error: submissionError } = await supabase
        .from('payment_submissions')
        .select('id, status, referrer_id')
        .eq('account_number', phone)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
        
    if (submissionError || !submission || submission.status !== 'approved') {
        toast({ variant: 'destructive', title: 'Registration Failed', description: 'No approved payment found for your phone number.' });
        setIsSubmitting(false);
        return;
    }

    // 2. Check if username or email already exists
    const { data: existingProfile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('username, email')
        .or(`username.eq.${values.username},email.eq.${values.email}`)
        .maybeSingle();

    if (existingProfile) {
        if (existingProfile.username === values.username) {
            form.setError('username', { type: 'manual', message: 'Username already exists.' });
        }
        if (existingProfile.email === values.email) {
            form.setError('email', { type: 'manual', message: 'An account with this email already exists.' });
        }
        setIsSubmitting(false);
        return;
    }
    
    // 3. Sign up the user
    const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
    });
    
    if (signUpError) {
        toast({ variant: 'destructive', title: 'Registration Failed', description: signUpError.message });
        setIsSubmitting(false);
        return;
    }
    
    if (!user) {
        toast({ variant: 'destructive', title: 'Registration Failed', description: 'Could not create user account.' });
        setIsSubmitting(false);
        return;
    }

    // Determine initial balance
    // If user was referred, they get a 200 PKR bonus.
    const initialBalance = submission.referrer_id ? 200 : 0;

    // 4. Create a profile for the new user
    const { error: profileError } = await supabase
        .from('profiles')
        .insert({
            id: user.id,
            username: values.username,
            email: values.email,
            invested: true,
            investment_date: new Date().toISOString(),
            balance: initialBalance,
        });

    if (profileError) {
         toast({ variant: 'destructive', title: 'Registration Failed', description: 'Could not create user profile.' });
         // Potentially delete the auth user here to allow retry
         setIsSubmitting(false);
         return;
    }
    
    // 5. Link the submission to the new user and update email
    await supabase
        .from('payment_submissions')
        .update({ user_id: user.id, user_email: values.email })
        .eq('id', submission.id);

    // 6. If the user was referred, we need to update the referral record with the new user's ID.
    // The bonus is already given at the approval stage.
     if (submission.referrer_id) {
        await supabase
            .from('referrals')
            .update({ referred_user_id: user.id })
            .eq('referrer_id', submission.referrer_id)
            .is('referred_user_id', null) // Match the record created during approval
            .order('created_at', { ascending: false })
            .limit(1);
    }
    
    // 7. Send welcome email
    await sendWelcomeEmail(values.email, values.username);

    toast({
      title: 'Registration Successful',
      description: "Welcome to ENVO-EARN! A confirmation email has been sent.",
    });
    router.push('/dashboard');
    router.refresh(); 
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="e.g., ayeshak" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
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
          control={form.control}
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
        <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={isSubmitting}>
          {isSubmitting ? 'Creating Account...' : 'Create Account'}
        </Button>
      </form>
    </Form>
  );
}
