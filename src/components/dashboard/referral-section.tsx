
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Users, Gift, Link as LinkIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "../ui/skeleton";

type Referral = {
    id: number;
    referred_user_id: string;
    status: 'Pending' | 'Invested';
    bonus_amount: number;
    referred_username?: string; // Optional username property
}

export function ReferralSection() {
  const [referralLink, setReferralLink] = useState('');
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  
  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setLoading(false);
            return;
        }

        // Set referral link to point to the invest page
        const link = `${window.location.origin}/invest?ref=${user.id}`;
        setReferralLink(link);

        // Fetch referrals made by the current user
        const { data: referralData, error: referralError } = await supabase
            .from('referrals')
            .select(`id, referred_user_id, status, bonus_amount`)
            .eq('referrer_id', user.id);

        if (referralError) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch your referrals.' });
            console.error(referralError);
            setLoading(false);
            return;
        }

        if (referralData && referralData.length > 0) {
            // Get a list of all referred user IDs that are not null
            const referredUserIds = referralData.map(r => r.referred_user_id).filter(id => id !== null);

            if(referredUserIds.length > 0) {
                // Fetch the profiles for all the referred users
                const { data: profilesData, error: profilesError } = await supabase
                    .from('profiles')
                    .select('id, username')
                    .in('id', referredUserIds);

                if (profilesError) {
                    toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch referred user data.' });
                    setReferrals(referralData.map(r => ({...r, referred_username: 'Unknown'})));
                } else {
                    const profileMap = new Map(profilesData.map(p => [p.id, p.username]));
                    const enrichedReferrals = referralData.map(ref => ({
                        ...ref,
                        referred_username: profileMap.get(ref.referred_user_id) || 'Pending Registration'
                    }));
                    setReferrals(enrichedReferrals);
                }
            } else {
                 setReferrals(referralData.map(r => ({...r, referred_username: 'Pending Registration'})));
            }
        } else {
            setReferrals([]);
        }
        
        setLoading(false);
    };
    fetchData();
  }, [supabase]);


  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    toast({ title: "Copied!", description: "Referral link copied to clipboard." });
  };

  const totalBonus = referrals.reduce((sum, r) => sum + (r.status === 'Invested' ? r.bonus_amount : 0), 0);

  return (
    <div className="space-y-8">
      <Card className="bg-gradient-to-r from-primary to-blue-400 text-primary-foreground">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2"><Gift className="h-6 w-6"/>Earn More with Referrals!</CardTitle>
          <CardDescription className="text-primary-foreground/80">
            Invite friends and earn a 200 PKR bonus for each successful referral. Referrals are also required to unlock unlimited withdrawals.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <LinkIcon className="h-5 w-5" />
            <Input type="text" value={referralLink} readOnly className="bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30 focus-visible:ring-offset-primary" />
            <Button onClick={handleCopy} variant="secondary" size="icon" disabled={!referralLink}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><Users className="h-5 w-5"/>Your Referrals</CardTitle>
            <CardDescription>Total Bonus Earned: <span className="font-bold text-green-600">{totalBonus.toLocaleString()} PKR</span></CardDescription>
          </CardHeader>
          <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Bonus (PKR)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {loading ? (
                    Array.from({length: 3}).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-5 w-24"/></TableCell>
                            <TableCell><Skeleton className="h-6 w-20"/></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-5 w-12 ml-auto"/></TableCell>
                        </TableRow>
                    ))
                ) : referrals.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="h-24 text-center">You haven't referred anyone yet.</TableCell></TableRow>
                ) : (
                    referrals.map((ref) => (
                        <TableRow key={ref.id}>
                            <TableCell className="font-medium">{ref.referred_username}</TableCell>
                            <TableCell>
                                <Badge variant={ref.status === 'Invested' ? 'default' : 'secondary'} className={ref.status === 'Invested' ? 'bg-green-500' : ''}>
                                    {ref.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right font-semibold text-green-600">
                                {ref.status === 'Invested' && ref.bonus_amount > 0 ? `+ ${ref.bonus_amount}` : '-'}
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
          </Table>
          </CardContent>
      </Card>
    </div>
  );
}
