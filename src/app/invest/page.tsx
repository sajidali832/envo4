
'use client';
import Link from "next/link";
import { PaymentForm } from "@/components/invest/payment-form";
import { ArrowLeft, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

function ReferralBanner({ referrerId }: { referrerId: string | null }) {
  const [referrerName, setReferrerName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchReferrer = async () => {
      if (!referrerId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', referrerId)
        .single();
      
      if (data) {
        setReferrerName(data.username);
      }
      setLoading(false);
    };

    fetchReferrer();
  }, [referrerId, supabase]);

  if (loading) {
    return <Skeleton className="h-20 w-full max-w-md mb-6" />;
  }

  if (!referrerName) {
    return null; // Don't show banner if referrer not found or no ID
  }

  return (
    <Alert className="mb-6 bg-green-50 border-green-200 text-green-800 w-full max-w-md">
      <Gift className="h-4 w-4 !text-green-600" />
      <AlertTitle className="font-bold text-green-900">
        You have been referred by {referrerName}!
      </AlertTitle>
      <AlertDescription className="text-green-700">
        You will get a 200 PKR bonus if you invest.
      </AlertDescription>
    </Alert>
  );
}

function InvestPageContent() {
  const searchParams = useSearchParams();
  const referrerId = searchParams.get('ref');
  const planId = searchParams.get('plan');
  const amount = searchParams.get('amount');
  const dailyReturn = searchParams.get('daily_return');

  if (!planId || !amount) {
    return (
      <Card className="w-full max-w-md text-center p-8">
          <CardTitle>Invalid Plan</CardTitle>
          <CardDescription className="mt-2">The plan you selected is not valid. Please go back and select a plan.</CardDescription>
          <Button asChild className="mt-4">
            <Link href="/">Back to Plans</Link>
          </Button>
      </Card>
    )
  }

  return (
    <div className="w-full max-w-md flex flex-col items-center">
      <ReferralBanner referrerId={referrerId} />
      <PaymentForm 
        referrerId={referrerId} 
        planId={planId}
        amount={Number(amount)}
        dailyReturn={Number(dailyReturn)}
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
      <Button variant="ghost" asChild className="absolute top-4 left-4 h-auto p-2 sm:p-4">
          <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4"/> 
              <span className="hidden sm:inline">Back to Home</span>
          </Link>
      </Button>
      <Suspense fallback={<InvestPageFallback />}>
        <InvestPageContent />
      </Suspense>
    </div>
  );
}
