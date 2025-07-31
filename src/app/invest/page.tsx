
'use client';
import Link from "next/link";
import { PaymentForm } from "@/components/invest/payment-form";
import { ArrowLeft, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Suspense, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { Loader } from "@/components/ui/loader";

type UserProfile = {
  investment_plan_id: string;
  investment_amount: number;
  daily_return_amount: number;
}

const plans: {[key: string]: string} = {
  "1": "Starter Plan",
  "2": "Growth Plan",
  "3": "Pro Investor"
};


function InvestPageContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const supabase = createClient();
  
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session }} = await supabase.auth.getSession();
      if (!session) {
        router.push('/signin');
        return;
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .select('investment_plan_id, investment_amount, daily_return_amount, invested')
        .eq('id', session.user.id)
        .single();
        
      if(error || !data) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch your profile. Please try logging in again.' });
        router.push('/signin');
        return;
      }

      if (data.invested) {
          router.push('/dashboard');
          return;
      }
      
      setProfile(data);
      setLoading(false);
    }
    
    fetchProfile();
  }, [supabase, router]);
  
  if (loading) {
    return (
        <div className="flex flex-col items-center gap-4 text-center">
            <Loader />
            <p className="text-muted-foreground">Loading your investment plan...</p>
        </div>
    );
  }

  if (!profile) {
    return (
      <Card className="w-full max-w-md text-center p-8">
          <CardTitle>Error</CardTitle>
          <CardDescription className="mt-2">Could not load your investment information.</CardDescription>
          <Button asChild className="mt-4">
            <Link href="/">Back to Plans</Link>
          </Button>
      </Card>
    )
  }

  return (
    <div className="w-full max-w-md flex flex-col items-center">
      <PaymentForm 
        planId={profile.investment_plan_id}
        amount={profile.investment_amount}
        dailyReturn={profile.daily_return_amount}
        planName={plans[profile.investment_plan_id] || `Plan ${profile.investment_plan_id}`}
      />
    </div>
  )
}

function InvestPageFallback() {
    return (
        <Card className="w-full max-w-md">
            <div className="p-6">
                <Skeleton className="h-8 w-3/4 mb-4" />
                <Skeleton className="h-4 w-1/2 mb-8" />
                <div className="space-y-6">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-40 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </div>
        </Card>
    )
}

export default function InvestPage() {
  return (
    <div className="flex min-h-screen items-start sm:items-center justify-center bg-secondary p-4 relative">
      <Suspense fallback={<InvestPageFallback />}>
        <InvestPageContent />
      </Suspense>
    </div>
  );
}
