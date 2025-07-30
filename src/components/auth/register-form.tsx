
"use client";

import { useEffect, useState, useActionState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import { registerUser } from '@/app/actions/register';
import { sendWelcomeEmail } from '@/app/actions/email';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Terminal } from 'lucide-react';

const initialState = {
  type: null,
  message: '',
  user: null,
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
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    async function handleRegistrationSuccess() {
      if (state.type === 'success' && state.user && !isRedirecting) {
        setIsRedirecting(true); // Prevent this from running multiple times
        toast({
          title: 'Registration Successful',
          description: "Welcome to ENVO-EARN! Sending welcome email...",
        });
        
        // Now call the email function
        const emailResult = await sendWelcomeEmail(state.user.email, state.user.username);
        
        if (!emailResult.success) {
            console.error("Failed to send welcome email:", emailResult.error);
            toast({
                variant: 'destructive',
                title: 'Email Failed',
                description: "Could not send welcome email, but your account is active."
            })
        }

        // Redirect after attempting to send email
        router.push('/dashboard');
      }
      if (state.type === 'error') {
        toast({
          variant: 'destructive',
          title: 'Registration Failed',
          description: state.message,
        });
      }
    }
    
    handleRegistrationSuccess();

  }, [state, router, isRedirecting]);

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
