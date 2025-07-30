
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
  const phone = searchParams.get('phone');
  const [state, formAction] = useActionState(registerUser, initialState);

  useEffect(() => {
    if (state.type === 'success') {
      toast({
        title: 'Registration Successful',
        description: "Welcome to ENVO-EARN! Redirecting to your dashboard...",
      });
      router.push('/dashboard');
    }
    if (state.type === 'error') {
      toast({
        variant: 'destructive',
        title: 'Registration Failed',
        description: state.message,
      });
    }
  }, [state, router]);

  if (!phone) {
    return (
       <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
           Your payment approval could not be found. Please try investing again or contact support.
          </AlertDescription>
        </Alert>
    )
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="phone" value={phone} />
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
