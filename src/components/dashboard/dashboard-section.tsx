
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, TrendingUp, Calendar, Landmark, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Earning = {
    created_at: string;
    amount: number;
}

type Referral = {
    bonus_amount: number;
}

export function DashboardSection() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ 
        totalInvestment: 0, 
        totalEarnings: 0, 
        referralBonus: 0,
    });
    const [earningsHistory, setEarningsHistory] = useState<Earning[]>([]);
    const supabase = createClient();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const { data: { session }} = await supabase.auth.getSession();
            if (!session) {
                setLoading(false);
                return;
            }

            const userId = session.user.id;
            
            const [profileRes, earningsRes, referralsRes] = await Promise.all([
                supabase
                    .from('profiles')
                    .select('invested, balance, investment_amount')
                    .eq('id', userId)
                    .single(),
                supabase
                    .from('earnings')
                    .select('amount, created_at')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false }),
                supabase
                    .from('referrals')
                    .select('bonus_amount')
                    .eq('referrer_id', userId)
                    .eq('status', 'Invested')
            ]);

            if (profileRes.error || earningsRes.error || referralsRes.error) {
                console.error("Error fetching dashboard data", profileRes.error || earningsRes.error || referralsRes.error);
            } else {
                const referralBonus = referralsRes.data?.reduce((acc, curr) => acc + curr.bonus_amount, 0) || 0;
                
                setStats({
                    totalInvestment: profileRes.data?.investment_amount || 0,
                    referralBonus: referralBonus,
                    totalEarnings: profileRes.data?.balance || 0,
                });
                setEarningsHistory(earningsRes.data as Earning[]);
            }

            setLoading(false);
        };

        fetchData();
    }, [supabase]);

    const StatCard = ({ title, value, icon: Icon, loading, gradient }: { title: string, value: string, icon: React.ElementType, loading: boolean, gradient: string }) => (
        <Card className={`relative overflow-hidden ${gradient} text-white`}>
            <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10 opacity-50"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 z-10 relative">
                <CardTitle className="text-sm font-medium text-white/90">{title}</CardTitle>
                <div className="p-2 bg-white/20 rounded-full">
                    <Icon className="h-4 w-4" />
                </div>
            </CardHeader>
            <CardContent className="z-10 relative">
                {loading ? <Skeleton className="h-8 w-3/4 bg-white/30" /> : <div className="text-2xl font-bold">{value}</div>}
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
                <StatCard title="Total Earnings" value={`${stats.totalEarnings.toLocaleString()} PKR`} icon={TrendingUp} loading={loading} gradient="bg-gradient-to-br from-blue-500 to-blue-700" />
                <StatCard title="Referral Bonus" value={`${stats.referralBonus.toLocaleString()} PKR`} icon={Users} loading={loading} gradient="bg-gradient-to-br from-orange-500 to-orange-700" />
                <StatCard title="Total Investment" value={`${stats.totalInvestment.toLocaleString()} PKR`} icon={Landmark} loading={loading} gradient="bg-gradient-to-br from-purple-500 to-purple-700"/>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-headline">
                      <Calendar className="h-5 w-5"/>
                      Daily Earnings History
                    </CardTitle>
                    <CardDescription>Your plan's daily returns. Referral bonuses are not shown here.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Amount (PKR)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : earningsHistory.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">No daily earnings recorded yet.</TableCell>
                                </TableRow>
                            ) : (
                                earningsHistory.map((earning, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium">{new Date(earning.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</TableCell>

                                        <TableCell className="text-right text-green-600 font-semibold">+ {earning.amount}</TableCell>
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
