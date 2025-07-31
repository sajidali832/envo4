
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
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [status, setStatus] = useState<ApprovalStatus>("pending");
  const supabase = createClient();

  useEffect(() => {
    const checkStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/signin');
        return;
      }
      
      const { data, error } = await supabase
        .from('payment_submissions')
        .select('status, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error || !data) {
          // If no submission found, maybe user completed payment and is back
          const { data: profile } = await supabase.from('profiles').select('invested').eq('id', user.id).single();
          if (profile?.invested) {
              router.push('/dashboard');
          } else {
              // No submission and not invested, go back to invest page
              router.push('/invest');
          }
          return;
      }

      if (data.status !== 'pending') {
        setStatus(data.status as ApprovalStatus);
      } else {
        // Calculate remaining time
        const submissionTime = new Date(data.created_at).getTime();
        const now = new Date().getTime();
        const elapsed = Math.floor((now - submissionTime) / 1000);
        const remaining = 600 - elapsed;
        setTimeLeft(remaining > 0 ? remaining : 0);
      }
    };
    
    checkStatus();

    const interval = setInterval(checkStatus, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [supabase, router]);

  useEffect(() => {
    if (status !== "pending") return;

    if (timeLeft <= 0) {
      return;
    }

    const timerInterval = setInterval(() => {
      setTimeLeft(prevTime => prevTime - 1);
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [timeLeft, status]);


  useEffect(() => {
    if (status === "approved") {
      const redirectTimer = setTimeout(() => {
        router.push(`/signin?action=approve`);
      }, 3000);
      return () => clearTimeout(redirectTimer);
    } else if (status === "rejected") {
       const redirectTimer = setTimeout(() => {
        router.push(`/signin?status=rejected`);
      }, 3000);
      return () => clearTimeout(redirectTimer);
    }
  }, [status, router]);


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
            <p className="text-muted-foreground">Redirecting you...</p>
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
                        {timeLeft > 0 ? `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}` : '00:00'}
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
