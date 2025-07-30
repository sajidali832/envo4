
import Link from 'next/link';
import { SignInForm } from '@/components/auth/sign-in-form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { EnvoEarnLogo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-4 relative">
       <Button variant="ghost" asChild className="absolute top-4 left-4 h-auto p-2 sm:p-4">
          <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4"/> 
              <span className="hidden sm:inline">Back to Home</span>
          </Link>
      </Button>
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <EnvoEarnLogo />
          </div>
          <CardTitle className="font-headline text-2xl">Welcome Back</CardTitle>
          <CardDescription>Sign in to access your dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <SignInForm />
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <p className="text-xs text-muted-foreground">
            Don't have an account?{' '}
            <Link href="/invest" className="font-semibold text-primary hover:underline">
              Start by investing
            </Link>
            .
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
