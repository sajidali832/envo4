
'use client';
import Link from 'next/link';
import { SignInForm } from '@/components/auth/sign-in-form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { EnvoEarnLogo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function AuthStatus() {
  const searchParams = useSearchParams();
  const status = searchParams.get('status');
  const action = searchParams.get('action');

  if (action === 'approve') {
    return (
      <div className="mb-4 flex flex-col items-center gap-3 p-3 rounded-md bg-green-100 text-green-800 border border-green-200">
        <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            <p className="text-sm font-medium">Your payment was approved!</p>
        </div>
        <Button asChild variant="default" size="sm" className="bg-green-600 hover:bg-green-700">
            <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    )
  }

  if (status === 'rejected') {
     return (
      <div className="mb-4 flex flex-col items-center gap-3 p-3 rounded-md bg-red-100 text-red-800 border border-red-200">
        <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5" />
            <p className="text-sm font-medium">Your payment was rejected.</p>
        </div>
        <Button asChild variant="destructive" size="sm">
            <Link href="/">Choose a Plan Again</Link>
        </Button>
      </div>
    )
  }

  return null;
}

function SignInPageContent() {
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
          <CardDescription>Sign in to access your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <AuthStatus />
          <SignInForm />
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <p className="text-xs text-muted-foreground">
            Don't have an account?{' '}
            <Link href="/" className="font-semibold text-primary hover:underline">
              Start by choosing a plan
            </Link>
            .
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}


export default function SignInPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInPageContent />
    </Suspense>
  );
}
