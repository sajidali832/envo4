
'use client';
import Link from "next/link";
import { PaymentForm } from "@/components/invest/payment-form";
import { ArrowLeft, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

function ReferralBanner({ referrerId }: { referrerId: string }) {
  const [referrerName, setReferrerName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchReferrer = async () => {
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

    if (referrerId) {
        fetchReferrer();
    }
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


export default function InvestPage() {
  const searchParams = useSearchParams();
  const referrerId = searchParams.get('ref');

  return (
    <div className="flex min-h-screen items-start sm:items-center justify-center bg-secondary p-4 relative">
      <Button variant="ghost" asChild className="absolute top-4 left-4 h-auto p-2 sm:p-4">
          <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4"/> 
              <span className="hidden sm:inline">Back to Home</span>
          </Link>
      </Button>
      <div className="w-full max-w-md flex flex-col items-center pt-16 sm:pt-0">
        {referrerId && <ReferralBanner referrerId={referrerId} />}
        <PaymentForm referrerId={referrerId} />
      </div>
    </div>
  );
}
