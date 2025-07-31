
"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Lightbulb, Banknote, History, Lock, CheckCircle, Pencil } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";

const setupSchema = z.object({
  method: z.string().min(1, 'Please select a platform.'),
  accountName: z.string().min(2, 'Account name is required.'),
  accountNumber: z.string().min(11, 'A valid account number is required.'),
});

const requestSchema = z.object({
  amount: z.coerce.number().min(600, "Minimum withdrawal is 600 PKR."),
});

type Withdrawal = {
    created_at: string;
    amount: number;
    status: string;
}

type WithdrawalMethod = {
    method: string;
    account_name: string;
    account_number: string;
}

type Profile = {
    balance: number;
    withdrawal_method: any;
    investment_plan_id: string;
}

export function WithdrawalSection() {
  const [withdrawalHistory, setWithdrawalHistory] = useState<Withdrawal[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [successfulWithdrawals, setSuccessfulWithdrawals] = useState(0);
  const [completedReferrals, setCompletedReferrals] = useState(0);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isEditingMethod, setIsEditingMethod] = useState(false);
  const [savedMethod, setSavedMethod] = useState<WithdrawalMethod | null>(null);

  const supabase = createClient();
  
  const isPlan3 = profile?.investment_plan_id === '3';
  const showReferralLock = !isPlan3 && successfulWithdrawals >= 2 && completedReferrals < 2;

  const requestForm = useForm<z.infer<typeof requestSchema>>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      amount: 0,
    }
  });
  
  const setupForm = useForm<z.infer<typeof setupSchema>>({
    resolver: zodResolver(setupSchema),
    defaultValues: { method: 'easypaisa', accountName: '', accountNumber: '' },
  });


  const fetchWithdrawalData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        setLoading(false);
        return;
    }

    // Fetch history, profile, and referrals in parallel
    const [historyRes, profileRes, referralsRes] = await Promise.all([
        supabase
            .from('withdrawals')
            .select('created_at, amount, status')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false }),
        supabase
            .from('profiles')
            .select('balance, withdrawal_method, investment_plan_id')
            .eq('id', user.id)
            .single(),
        supabase
            .from('referrals')
            .select('id', { count: 'exact', head: true })
            .eq('referrer_id', user.id)
            .eq('status', 'Invested')
    ]);

    if (historyRes.error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch withdrawal history.' });
    } else {
        setWithdrawalHistory(historyRes.data as Withdrawal[]);
        setSuccessfulWithdrawals(historyRes.data.filter(w => w.status === 'approved').length);
    }
    
    if (profileRes.error) {
         toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch user profile.' });
         setIsEditingMethod(true);
    } else {
        setProfile(profileRes.data as Profile);
        const methodData = profileRes.data?.withdrawal_method as any;
        
        if (methodData && methodData.accountName) {
            const parsedMethod = {
                method: methodData.method || 'easypaisa',
                accountName: methodData.accountName || '',
                accountNumber: methodData.accountNumber || '',
            };
            setSavedMethod({
                method: parsedMethod.method,
                account_name: parsedMethod.accountName,
                account_number: parsedMethod.accountNumber
            });
            setupForm.reset(parsedMethod);
            setIsEditingMethod(false);
        } else {
            setIsEditingMethod(true);
        }
    }

    if (referralsRes.error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch referral count.' });
    } else {
        setCompletedReferrals(referralsRes.count || 0);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchWithdrawalData();
  }, []);
  
  async function onSaveMethod(values: z.infer<typeof setupSchema>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { error } = await supabase
        .from('profiles')
        .update({ withdrawal_method: values })
        .eq('id', user.id);

    if (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not save your withdrawal method.' });
    } else {
        setSavedMethod({
          method: values.method,
          account_name: values.accountName,
          account_number: values.accountNumber
        });
        setIsEditingMethod(false);
        toast({ title: 'Success!', description: 'Your withdrawal method has been saved.' });
    }
  }

  async function onRequestSubmit(values: z.infer<typeof requestSchema>) {
    setIsSubmitting(true);
    
    if (showReferralLock) {
        toast({variant: 'destructive', title: 'Action Required', description: 'You must refer 2 users to continue withdrawing.'});
        setIsSubmitting(false);
        return;
    }

    if (values.amount > (profile?.balance || 0)) {
        toast({variant: 'destructive', title: 'Insufficient Funds', description: 'Your requested amount exceeds your available balance.'});
        setIsSubmitting(false);
        return;
    }
    
    if (!savedMethod) {
        toast({variant: 'destructive', title: 'Setup Required', description: 'Please set up and save your withdrawal method first.'});
        setIsSubmitting(false);
        return;
    }
    
    const {data: {user}} = await supabase.auth.getUser();
    if(!user) return;

    const { error } = await supabase.from('withdrawals').insert({
        user_id: user.id,
        amount: values.amount,
        method: savedMethod.method,
        account_name: savedMethod.account_name,
        account_number: savedMethod.account_number,
        status: 'processing'
    });

    if (error) {
        toast({ variant: "destructive", title: "Submission Failed", description: error.message });
    } else {
        toast({ title: "Success", description: `Withdrawal request of ${values.amount} PKR submitted.` });
        requestForm.reset({amount: 0});
        await fetchWithdrawalData(); // Refresh history and balance
    }
    
    setIsSubmitting(false);
  }
  
  const getStatusBadge = (status: string) => {
    switch (status) {
        case 'approved': return <Badge variant="default" className="bg-green-500">Approved</Badge>;
        case 'processing': return <Badge variant="secondary" className="bg-yellow-500 text-white">Processing</Badge>;
        case 'rejected': return <Badge variant="destructive">Rejected</Badge>;
        default: return <Badge>{status}</Badge>;
    }
  }

  return (
    <div className="space-y-8">
      {showReferralLock && (
        <Alert variant="destructive" className="border-accent bg-accent/10">
            <Lock className="h-4 w-4 !text-accent" />
            <AlertTitle className="font-headline text-accent">Withdrawals Locked</AlertTitle>
            <AlertDescription>
                You have made 2 withdrawals. To continue withdrawing, you must successfully refer at least 2 users who also complete their investments.
            </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline"><Lightbulb className="h-5 w-5" />Setup Withdrawal Method</CardTitle>
            <CardDescription>Set your preferred method for receiving payments.</CardDescription>
          </CardHeader>
          <CardContent>
            {isEditingMethod ? (
                <Form {...setupForm}>
                    <form onSubmit={setupForm.handleSubmit(onSaveMethod)} className="space-y-4">
                        <FormField control={setupForm.control} name="method" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Platform</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="easypaisa">Easypaisa</SelectItem>
                                <SelectItem value="jazzcash">JazzCash</SelectItem>
                            </SelectContent>
                            </Select>
                            <FormMessage/>
                        </FormItem>
                        )}/>
                    <FormField control={setupForm.control} name="accountName" render={({ field }) => (
                        <FormItem><FormLabel>Account Holder Name</FormLabel><FormControl><Input placeholder="Your Name" {...field} /></FormControl><FormMessage/></FormItem>
                    )}/>
                    <FormField control={setupForm.control} name="accountNumber" render={({ field }) => (
                        <FormItem><FormLabel>Account Number</FormLabel><FormControl><Input placeholder="03001234567" {...field} /></FormControl><FormMessage/></FormItem>
                    )}/>
                    <Button type="submit" className="w-full">Save Method</Button>
                    </form>
                </Form>
            ) : (
                <div className="space-y-4">
                    <div className="bg-green-100 border border-green-300 text-green-800 rounded-lg p-3 flex items-center gap-3">
                        <CheckCircle className="h-5 w-5"/>
                        <p className="text-sm font-medium">Your information has been saved successfully.</p>
                    </div>
                     <dl className="text-sm space-y-2">
                        <div className="flex justify-between">
                            <dt className="text-muted-foreground">Platform:</dt>
                            <dd className="font-semibold capitalize">{savedMethod?.method}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-muted-foreground">Account Name:</dt>
                            <dd className="font-semibold">{savedMethod?.account_name}</dd>
                        </div>
                         <div className="flex justify-between">
                            <dt className="text-muted-foreground">Account Number:</dt>
                            <dd className="font-semibold">{savedMethod?.account_number}</dd>
                        </div>
                    </dl>
                    <Button variant="outline" className="w-full" onClick={() => setIsEditingMethod(true)}>
                        <Pencil className="mr-2 h-4 w-4"/> Edit
                    </Button>
                </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline"><Banknote className="h-5 w-5"/>Request Withdrawal</CardTitle>
            <CardDescription>Min: 600 PKR. Balance: {(profile?.balance || 0).toLocaleString()} PKR</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...requestForm}>
              <form onSubmit={requestForm.handleSubmit(onRequestSubmit)} className="space-y-4">
                <FormField control={requestForm.control} name="amount" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Amount (PKR)</FormLabel>
                        <FormControl>
                            <Input 
                                type="number" 
                                placeholder="e.g., 1000" 
                                {...field}
                                onChange={e => field.onChange(e.target.value === '' ? 0 : +e.target.value)}
                            />
                        </FormControl>
                        <FormMessage/>
                    </FormItem>
                )}/>
                <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={showReferralLock || isSubmitting || !savedMethod}>
                  {showReferralLock && <Lock className="mr-2 h-4 w-4"/>}
                  {isSubmitting ? 'Submitting...' : 'Request Withdrawal'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline"><History className="h-5 w-5"/>Withdrawal History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={3} className="text-center h-24">Loading...</TableCell></TableRow>
              ) : withdrawalHistory.length === 0 ? (
                <TableRow><TableCell colSpan={3} className="text-center h-24">No withdrawal history.</TableCell></TableRow>
              ) : (
                withdrawalHistory.map((w, i) => (
                  <TableRow key={i}>
                    <TableCell>{new Date(w.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>{w.amount} PKR</TableCell>
                    <TableCell className="text-right">{getStatusBadge(w.status)}</TableCell>
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
