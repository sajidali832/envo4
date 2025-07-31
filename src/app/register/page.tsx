
import { Suspense } from 'react';
import { RegisterForm } from '@/components/auth/register-form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { EnvoEarnLogo } from '@/components/logo';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader } from '@/components/ui/loader';
import Link from 'next/link';

function RegisterPageFallback() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4">
          <EnvoEarnLogo />
        </div>
        <Skeleton className="h-7 w-48 mx-auto" />
        <Skeleton className="h-4 w-64 mx-auto mt-2" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-10 w-full mt-4" />
      </CardContent>
    </Card>
  )
}

function RegisterPageContent() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4">
          <EnvoEarnLogo />
        </div>
        <CardTitle className="font-headline text-2xl">Create Your Account</CardTitle>
        <CardDescription>First, let's create your account. You will submit payment after this step.</CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<Loader className="mx-auto" />}>
            <RegisterForm />
        </Suspense>
      </CardContent>
       <CardFooter className="flex flex-col gap-4">
          <p className="text-xs text-muted-foreground">
            Already have an account?{' '}
            <Link href="/signin" className="font-semibold text-primary hover:underline">
              Sign In
            </Link>
            .
          </p>
        </CardFooter>
    </Card>
  )
}


export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
      <Suspense fallback={<RegisterPageFallback />}>
        <RegisterPageContent />
      </Suspense>
    </div>
  );
}
