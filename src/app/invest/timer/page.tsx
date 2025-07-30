import { Timer } from "@/components/invest/timer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function TimerPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Payment Submitted</CardTitle>
          <CardDescription>Your payment is under review. Please wait for admin approval.</CardDescription>
        </CardHeader>
        <CardContent>
          <Timer />
        </CardContent>
      </Card>
    </div>
  );
}
