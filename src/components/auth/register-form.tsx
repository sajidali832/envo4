
"use client";

import { useEffect, useState, useActionState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import { registerUser } from '@/app/actions/register';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Terminal } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const initialState = {
  type: null,
  message: '',
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={pending}>
      {pending ? 'Creating Account...' : 'Create Account'}
    </Button>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get('plan');
  const amount = searchParams.get('amount');
  const dailyReturn = searchParams.get('daily_return');
  
  const [state, formAction] = useActionState(registerUser, initialState);
  const supabase = createClient();

  useEffect(() => {
    if (state.type === 'success') {
      toast({
        title: 'Registration Successful',
        description: "Let's complete your investment.",
      });
      // After successful Auth user creation, we need to sign in the user
      // so the next page (/invest) has an active session.
      const signInAndRedirect = async () => {
         const email = state.user.email;
         // We can't get the password here, so we have to ask user to sign in.
         // A better flow would use a magic link, but for now we redirect to signin.
         // Let's redirect to invest directly, assuming the session is set by the server action.
         router.push('/invest');
      }
      signInAndRedirect();

    }
    if (state.type === 'error') {
      toast({
        variant: 'destructive',
        title: 'Registration Failed',
        description: state.message,
      });
    }
  }, [state, router]);

  if (!planId || !amount || !dailyReturn) {
    return (
       <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
           No investment plan was selected. Please go back to the homepage and choose a plan.
          </AlertDescription>
        </Alert>
    )
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="planId" value={planId} />
      <input type="hidden" name="amount" value={amount} />
      <input type="hidden" name="dailyReturn" value={dailyReturn} />
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input id="username" name="username" placeholder="e.g., ayeshak" required />
      </div>
       <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" placeholder="you@example.com" required />
      </div>
       <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" placeholder="••••••••" required minLength={8} />
      </div>
      <SubmitButton />
    </form>
  );
}
