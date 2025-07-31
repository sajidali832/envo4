
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, RefreshCcw, Landmark, GanttChartSquare } from "lucide-react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

const plans: {[key: string]: string} = {
  "1": "Starter Plan",
  "2": "Growth Plan",
  "3": "Pro Investor"
};

type Approval = {
  id: string;
  account_name: string;
  account_number: string;
  payment_platform: string;
  screenshot_url: string;
  status: string;
  user_email: string;
  referrer_id: string | null;
  user_id: string | null;
  investment_plan_id: string;
  investment_amount: number;
  daily_return_amount: number;
};

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  const fetchApprovals = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('payment_submissions')
      .select('*')
      .eq('status', 'pending');

    if (error) {
      console.error("Error fetching approvals:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch approvals. Check table permissions.' });
    } else {
      setApprovals(data as Approval[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const deleteScreenshot = async (screenshotUrl: string) => {
    try {
      const path = new URL(screenshotUrl).pathname.split('/storage/v1/object/public/payment-proofs/')[1];
      const { error } = await supabase.storage.from('payment-proofs').remove([decodeURIComponent(path)]);
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("Failed to delete screenshot:", error);
      toast({ variant: 'destructive', title: 'Storage Error', description: 'Could not delete screenshot from storage.' });
    }
  };

  const handleDecision = async (approval: Approval, newStatus: 'approved' | 'rejected') => {
    const { error: updateError } = await supabase
      .from('payment_submissions')
      .update({ status: newStatus })
      .eq('id', approval.id);

    if (updateError) {
      toast({ variant: 'destructive', title: 'Error', description: `Failed to ${newStatus} submission.` });
      return;
    }
    
    // The screenshot should be deleted regardless of approval or rejection.
    await deleteScreenshot(approval.screenshot_url);
    
    toast({ title: 'Success', description: `Payment ${newStatus}.` });
    fetchApprovals(); // Refresh the list
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Payment Approvals</h1>
          <p className="text-muted-foreground">
            Review and approve or reject pending payment submissions. Approved users will be able to register.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchApprovals} disabled={loading}>
            <RefreshCcw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>


      {loading ? (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({length: 3}).map((_, i) => (
                <Card key={i}>
                    <CardHeader>
                        <Skeleton className="h-6 w-3/4"/>
                        <Skeleton className="h-4 w-1/2"/>
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="w-full aspect-[2/3] rounded-md"/>
                    </CardContent>
                    <CardFooter className="grid grid-cols-2 gap-2">
                        <Skeleton className="h-10 w-full"/>
                        <Skeleton className="h-10 w-full"/>
                    </CardFooter>
                </Card>
            ))}
         </div>
      ) : approvals.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">No pending approvals at the moment.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {approvals.map((approval) => (
            <Card key={approval.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{approval.account_name}</CardTitle>
                <CardDescription>{approval.account_number} ({approval.payment_platform})</CardDescription>
                {approval.user_email && <CardDescription className="font-semibold pt-1">{approval.user_email}</CardDescription>}
                
                <div className="pt-2 space-y-2 text-sm">
                   <div className="flex items-center gap-2">
                        <GanttChartSquare className="h-4 w-4 text-muted-foreground" />
                        <span>Plan: <Badge variant="secondary">{plans[approval.investment_plan_id] || `Plan ${approval.investment_plan_id}`}</Badge></span>
                   </div>
                   <div className="flex items-center gap-2">
                        <Landmark className="h-4 w-4 text-muted-foreground" />
                        <span>Amount: <span className="font-semibold">{approval.investment_amount?.toLocaleString()} PKR</span></span>
                   </div>
                </div>

              </CardHeader>
              <CardContent className="space-y-4 flex-grow">
                 <div className="w-full aspect-[2/3] relative rounded-md overflow-hidden bg-muted">
                    <Image src={approval.screenshot_url} alt="Payment Screenshot" layout="fill" objectFit="contain" />
                 </div>
              </CardContent>
              <CardFooter className="grid grid-cols-2 gap-2 mt-auto">
                <Button variant="outline" className="w-full border-red-500 text-red-500 hover:bg-red-500 hover:text-white" onClick={() => handleDecision(approval, 'rejected')}>
                  <X className="mr-2 h-4 w-4" /> Reject
                </Button>
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={() => handleDecision(approval, 'approved')}>
                  <Check className="mr-2 h-4 w-4" /> Approve
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
