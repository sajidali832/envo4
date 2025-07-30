
'use client';

import { Suspense } from "react";
import { Timer } from "@/components/invest/timer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

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
