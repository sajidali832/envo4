
'use client';

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, XCircle, Hourglass } from "lucide-react";

type ApprovalStatus = "pending" | "approved" | "rejected";

function Timer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get('phone');
  
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [status, setStatus] = useState<ApprovalStatus>("pending");

  const supabase = createClient();

  useEffect(() => {
    if (!phone) {
        router.push('/');
        return;
    }
    // Poll for status changes
    const interval = setInterval(async () => {
        const { data, error } = await supabase
            .from('payment_submissions')
            .select('status')
            .eq('account_number', phone)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
        
        if (data && data.status !== 'pending') {
            setStatus(data.status as ApprovalStatus);
            clearInterval(interval);
        }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [phone, supabase, router]);

  useEffect(() => {
    if (status !== "pending") return;

    if (timeLeft <= 0) {
      return;
    }

    const intervalId = setInterval(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [timeLeft, status]);


  useEffect(() => {
    if (status === "approved") {
      const redirectTimer = setTimeout(() => {
        router.push(`/register?phone=${phone}`);
      }, 3000);
      return () => clearTimeout(redirectTimer);
    } else if (status === "rejected") {
       const redirectTimer = setTimeout(() => {
        router.push(`/signin?status=rejected`);
      }, 3000);
      return () => clearTimeout(redirectTimer);
    }
  }, [status, router, phone]);


  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  
  const progress = ((600 - timeLeft) / 600) * 360;

  const renderStatus = () => {
    switch (status) {
      case "approved":
        return (
          <div className="flex flex-col items-center gap-4 text-green-500">
            <CheckCircle className="h-16 w-16" />
            <p className="text-xl font-semibold">Approved!</p>
            <p className="text-muted-foreground">Redirecting you to create your account...</p>
          </div>
        );
      case "rejected":
        return (
          <div className="flex flex-col items-center gap-4 text-red-500">
            <XCircle className="h-16 w-16" />
            <p className="text-xl font-semibold">Rejected</p>
            <p className="text-muted-foreground">Your payment could not be verified. Redirecting...</p>
          </div>
        );
      case "pending":
      default:
        return (
          <div className="flex flex-col items-center gap-6">
            <div
                className="relative h-40 w-40 rounded-full flex items-center justify-center text-center"
                style={{ background: `conic-gradient(hsl(var(--accent)) ${progress}deg, hsl(var(--muted)) 0deg)`}}
            >
                <div className="absolute h-[calc(100%-1rem)] w-[calc(100%-1rem)] bg-background rounded-full flex items-center justify-center">
                    <span className="text-3xl font-bold font-mono text-foreground">
                        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                    </span>
                </div>
            </div>
            <p className="text-muted-foreground animate-pulse flex items-center gap-2">
              <Hourglass className="h-4 w-4" />
              Awaiting confirmation...
            </p>
          </div>
        );
    }
  };

  return <div className="p-4">{renderStatus()}</div>;
}


function TimerPageContent() {
  return (
    <Card className="w-full max-w-md text-center">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Payment Submitted</CardTitle>
        <CardDescription>Your payment is under review. Please wait for admin approval.</CardDescription>
      </CardHeader>
      <CardContent>
        <Timer />
      </CardContent>
    </Card>
  )
}

function TimerPageFallback() {
  return (
     <Card className="w-full max-w-md text-center">
        <CardHeader>
          <Skeleton className="h-7 w-3/5 mx-auto" />
          <Skeleton className="h-4 w-4/5 mx-auto mt-2" />
        </CardHeader>
        <CardContent>
           <div className="flex flex-col items-center gap-6 p-4">
              <Skeleton className="h-40 w-40 rounded-full" />
              <Skeleton className="h-5 w-32" />
           </div>
        </CardContent>
      </Card>
  )
}

export default function TimerPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
      <Suspense fallback={<TimerPageFallback />}>
        <TimerPageContent />
      </Suspense>
    </div>
  );
}
