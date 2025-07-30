
import { RegisterForm } from '@/components/auth/register-form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { EnvoEarnLogo } from '@/components/logo';

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <EnvoEarnLogo />
          </div>
          <CardTitle className="font-headline text-2xl">Create Your Account</CardTitle>
          <CardDescription>Your payment is approved! Let's get you set up.</CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm />
        </CardContent>
      </Card>
    </div>
  );
}
