
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, RefreshCcw } from "lucide-react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

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

  const processReferral = async (referrerId: string, newUserId: string | null) => {
      // 1. Give 200 PKR bonus to the referrer
      const { data: referrerProfile, error: fetchError } = await supabase
          .from('profiles')
          .select('balance')
          .eq('id', referrerId)
          .single();
      
      if (fetchError || !referrerProfile) {
          console.error(`Could not find referrer profile ${referrerId}`, fetchError);
          // Don't block approval, but log the error
          toast({ variant: 'destructive', title: 'Referral Error', description: 'Could not find referrer profile.' });
          return;
      }

      const newBalance = referrerProfile.balance + 200;
      const { error: balanceError } = await supabase
          .from('profiles')
          .update({ balance: newBalance })
          .eq('id', referrerId);

      if (balanceError) {
          console.error(`Failed to update balance for referrer ${referrerId}`, balanceError);
          toast({ variant: 'destructive', title: 'Referral Error', description: 'Failed to update referrer balance.' });
          return;
      }

      // 2. Create a record in the referrals table
      // The newUserId will be null at this stage, but we can update it later if needed.
      const { error: referralError } = await supabase
          .from('referrals')
          .insert({
              referrer_id: referrerId,
              referred_user_id: newUserId, // This might be updated later
              status: 'Invested',
              bonus_amount: 200
          });

      if (referralError) {
          console.error(`Failed to create referral record for ${referrerId}`, referralError);
          toast({ variant: 'destructive', title: 'Referral Error', description: 'Failed to create referral record.' });
      } else {
          toast({ title: 'Referral Bonus!', description: '200 PKR bonus awarded to referrer.' });
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

    // If approved and there's a referrer, process the bonus
    if (newStatus === 'approved' && approval.referrer_id) {
        await processReferral(approval.referrer_id, approval.user_id);
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
            <Card key={approval.id}>
              <CardHeader>
                <CardTitle>{approval.account_name}</CardTitle>
                <CardDescription>{approval.account_number} ({approval.payment_platform})</CardDescription>
                {approval.user_email && <CardDescription className="font-semibold pt-1">{approval.user_email}</CardDescription>}
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="w-full aspect-[2/3] relative rounded-md overflow-hidden bg-muted">
                    <Image src={approval.screenshot_url} alt="Payment Screenshot" layout="fill" objectFit="contain" />
                 </div>
              </CardContent>
              <CardFooter className="grid grid-cols-2 gap-2">
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
