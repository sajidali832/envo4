
'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, RefreshCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

type UserProfile = {
  id: string;
  username: string;
};

type WithdrawalRequest = {
  id: string;
  user_id: string;
  amount: number;
  created_at: string;
  method: string;
  status: string;
  account_name: string;
  account_number: string;
  username?: string; // Add optional username
};

export default function WithdrawalsPage() {
    const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const supabase = createClient();

    const fetchRequests = async () => {
        setLoading(true);
        // Step 1: Fetch all withdrawal requests
        const { data: withdrawals, error: withdrawalsError } = await supabase
            .from('withdrawals')
            .select('*')
            .order('created_at', { ascending: false });

        if (withdrawalsError) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch withdrawal requests.' });
            console.error(withdrawalsError);
            setLoading(false);
            return;
        }

        if (withdrawals.length === 0) {
            setRequests([]);
            setLoading(false);
            return;
        }

        const userIds = withdrawals.map(w => w.user_id);

        // Step 2: Fetch corresponding user profiles
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, username')
            .in('id', userIds);

        if (profilesError) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch user data.' });
            console.error(profilesError);
             // still try to show withdrawals without usernames
            setRequests(withdrawals);
            setLoading(false);
            return;
        }

        // Step 3: Map usernames to withdrawal requests
        const profilesMap = new Map(profiles.map(p => [p.id, p.username]));
        const enrichedRequests = withdrawals.map(req => ({
            ...req,
            username: profilesMap.get(req.user_id) || 'N/A'
        }));

        setRequests(enrichedRequests);
        setLoading(false);
    }

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleDecision = async (request: WithdrawalRequest, newStatus: 'approved' | 'rejected') => {
        // Step 1: Update the withdrawal request status
        const { error: updateError } = await supabase
            .from('withdrawals')
            .update({ status: newStatus })
            .eq('id', request.id);
        
        if (updateError) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update withdrawal status.' });
            return;
        }

        // Step 2: If approved, deduct the balance from the user's profile
        if (newStatus === 'approved') {
            const { data: profile, error: fetchError } = await supabase
                .from('profiles')
                .select('balance')
                .eq('id', request.user_id)
                .single();

            if (fetchError || !profile) {
                 toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch user profile to update balance.' });
                 // Optionally revert status
                 return;
            }

            const newBalance = profile.balance - request.amount;
            const { error: balanceError } = await supabase
                .from('profiles')
                .update({ balance: newBalance })
                .eq('id', request.user_id);
            
            if (balanceError) {
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to update user balance.' });
                // Optionally revert status
                return;
            }
        }
        
        toast({ title: 'Success', description: `Request has been ${newStatus}.` });
        fetchRequests(); // Refresh the list
    };
    
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved': return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Approved</Badge>;
            case 'processing': return <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600 text-white">Processing</Badge>;
            case 'rejected': return <Badge variant="destructive">Rejected</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    }
    
    const filteredRequests = requests.filter(req => 
        req.username?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold font-headline">Withdrawal Management</h1>
                <p className="text-muted-foreground">Approve or reject user withdrawal requests.</p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchRequests} disabled={loading}>
                <RefreshCcw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
        </div>
      <div className="flex items-center justify-end">
        <div className="w-full max-w-sm">
            <Input 
                placeholder="Search by username..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Account Name</TableHead>
                <TableHead>Account Number</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({length: 5}).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell colSpan={8}><Skeleton className="h-8 w-full"/></TableCell>
                    </TableRow>
                ))
              ) : filteredRequests.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">No withdrawal requests found.</TableCell>
                </TableRow>
              ) : (
                filteredRequests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">{req.username}</TableCell>
                    <TableCell>{req.account_name}</TableCell>
                    <TableCell>{req.account_number}</TableCell>
                    <TableCell>{req.amount} PKR</TableCell>
                    <TableCell>{new Date(req.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>{req.method}</TableCell>
                    <TableCell>{getStatusBadge(req.status)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      {req.status === 'processing' && (
                          <>
                              <Button variant="outline" size="icon" className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white" onClick={() => handleDecision(req, 'rejected')}>
                                  <X className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="icon" className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white" onClick={() => handleDecision(req, 'approved')}>
                                  <Check className="h-4 w-4" />
                              </Button>
                          </>
                      )}
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
