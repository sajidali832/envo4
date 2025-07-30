
'use client';

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Landmark, Banknote, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format, subDays } from 'date-fns';

type Stats = {
  totalUsers: number;
  totalInvestment: number;
  totalWithdrawals: number;
};

type ChartData = {
  name: string;
  users?: number;
  withdrawals?: number;
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchData = async () => {
    setLoading(true);

    const { count: userCount, error: userError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { data: investedUsers, error: investedError } = await supabase
        .from('profiles')
        .select('id', { count: 'exact' })
        .eq('invested', true);

    const { data: approvedWithdrawals, error: withdrawalError } = await supabase
      .from('withdrawals')
      .select('amount')
      .eq('status', 'approved');

    // Fetch data for charts (last 7 days)
    const today = new Date();
    const dateLabels = Array.from({ length: 7 }).map((_, i) => {
        const date = subDays(today, 6 - i);
        return format(date, 'MMM d');
    }).reverse();

    const dateRanges = Array.from({ length: 7 }).map((_, i) => {
        const date = subDays(today, i);
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        return {
            label: format(startOfDay, 'MMM d'),
            start: startOfDay.toISOString(),
            end: endOfDay.toISOString(),
        };
    }).reverse();


    const userPromises = dateRanges.map(range => 
        supabase.from('profiles').select('id', {count: 'exact'}).gte('created_at', range.start).lte('created_at', range.end)
    );
    const withdrawalPromises = dateRanges.map(range => 
        supabase.from('withdrawals').select('amount').eq('status', 'approved').gte('created_at', range.start).lte('created_at', range.end)
    );

    const userResults = await Promise.all(userPromises);
    const withdrawalResults = await Promise.all(withdrawalPromises);

    const finalChartData = dateRanges.map((range, i) => {
        const userCount = userResults[i].count || 0;
        const totalWithdrawal = withdrawalResults[i].data?.reduce((acc, w) => acc + w.amount, 0) || 0;
        return {
            name: range.label,
            users: userCount,
            withdrawals: totalWithdrawal,
        }
    });

    setChartData(finalChartData);

    setStats({
      totalUsers: userCount ?? 0,
      totalInvestment: (investedUsers?.length ?? 0) * 6000,
      totalWithdrawals: approvedWithdrawals?.reduce((sum, w) => sum + w.amount, 0) ?? 0,
    });

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);
  
  const StatCard = ({ title, value, icon: Icon, loading: isLoading } : {title: string, value: string, icon: React.ElementType, loading: boolean}) => (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            {isLoading ? <Skeleton className="h-8 w-3/4"/> : <div className="text-2xl font-bold">{value}</div>}
        </CardContent>
      </Card>
  );

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold font-headline">Admin Dashboard</h1>
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
                <RefreshCcw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Data
            </Button>
        </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Total Users" value={stats?.totalUsers.toLocaleString() ?? '0'} icon={Users} loading={loading} />
        <StatCard title="Total Investment" value={`${stats?.totalInvestment.toLocaleString() ?? '0'} PKR`} icon={Landmark} loading={loading} />
        <StatCard title="Total Withdrawals" value={`${stats?.totalWithdrawals.toLocaleString() ?? '0'} PKR`} icon={Banknote} loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>New Users (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
             {loading ? <Skeleton className="w-full h-[300px]"/> : (
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="users" fill="hsl(var(--primary))" />
                    </BarChart>
                </ResponsiveContainer>
             )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Withdrawals (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="w-full h-[300px]"/> : (
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `${Number(value).toLocaleString()} PKR`} />
                    <Bar dataKey="withdrawals" fill="hsl(var(--accent))" />
                    </BarChart>
                </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
