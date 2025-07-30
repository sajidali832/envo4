
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, UserX, Edit, Eye, Download, RefreshCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

type UserProfile = {
  id: string;
  username: string;
  email: string;
  created_at: string;
  balance: number;
  invested: boolean;
};

type Earning = { created_at: string; amount: number };
type Withdrawal = { created_at: string; amount: number; status: string };

type UserDetails = {
    profile: UserProfile;
    earnings: Earning[];
    withdrawals: Withdrawal[];
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [viewingUser, setViewingUser] = useState<UserDetails | null>(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [newBalance, setNewBalance] = useState<number | string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);


  const supabase = createClient();

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch users.' });
    } else {
      setUsers(data as UserProfile[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateBalance = async () => {
      if (!editingUser || newBalance === '') return;
      setIsUpdating(true);
      const { error } = await supabase
        .from('profiles')
        .update({ balance: Number(newBalance) })
        .eq('id', editingUser.id);
        
      if (error) {
          toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
      } else {
          toast({ title: 'Success', description: `Balance updated for ${editingUser.username}.` });
          fetchUsers(); // Refresh data
          setEditingUser(null);
          setNewBalance('');
      }
      setIsUpdating(false);
  }

  const handleViewDetails = async (user: UserProfile) => {
    setIsDetailsLoading(true);
    setViewingUser(null);
    setOpenDetailsDialog(true);
    const [earningsRes, withdrawalsRes] = await Promise.all([
        supabase.from('earnings').select('created_at, amount').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('withdrawals').select('created_at, amount, status').eq('user_id', user.id).order('created_at', { ascending: false }),
    ]);
    
    setViewingUser({
        profile: user,
        earnings: earningsRes.data || [],
        withdrawals: withdrawalsRes.data || [],
    });
    setIsDetailsLoading(false);
  }

  const exportUserDetails = () => {
      if (!viewingUser) return;
      const { profile, earnings, withdrawals } = viewingUser;
      
      let csvContent = "data:text/csv;charset=utf-8,";
      
      // Profile details
      csvContent += "Category,Key,Value\n";
      csvContent += `Profile,Username,${profile.username}\n`;
      csvContent += `Profile,Email,${profile.email}\n`;
      csvContent += `Profile,Balance,${profile.balance}\n`;
      csvContent += `Profile,Invested,${profile.invested}\n`;
      csvContent += `Profile,Registration Date,${new Date(profile.created_at).toLocaleString()}\n\n`;

      // Earnings
      csvContent += "Type,Date,Amount\n";
      earnings.forEach(e => {
        csvContent += `Earning,${new Date(e.created_at).toLocaleString()},${e.amount}\n`;
      });
       csvContent += "\n";
      
      // Withdrawals
      csvContent += "Type,Date,Amount,Status\n";
      withdrawals.forEach(w => {
        csvContent += `Withdrawal,${new Date(w.created_at).toLocaleString()},${w.amount},${w.status}\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${profile.username}_details.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  }

  const handleDeleteUser = async (userId: string) => {
    console.log("Attempting to delete user:", userId);
    
    const { error: profileError } = await supabase.from('profiles').delete().eq('id', userId);
     if (profileError) {
        toast({ variant: 'destructive', title: 'Deletion Failed', description: 'Could not delete user profile.' });
        return;
    }
    
    toast({ title: 'User Deleted', description: 'The user has been removed.' });
    fetchUsers();
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const exportUserData = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
        + "Username,Email,Registration Date,Balance,Invested\n"
        + filteredUsers.map(u => `${u.username},${u.email},${new Date(u.created_at).toLocaleDateString()},${u.balance},${u.invested}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "user_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <h1 className="text-3xl font-bold font-headline">User Management</h1>
         <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
            <RefreshCcw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="w-full max-w-sm">
            <Input 
                placeholder="Search users by name, email..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        <Button onClick={exportUserData} variant="outline"><Download className="mr-2"/> Export CSV</Button>
      </div>

      <Card>
          <Dialog open={openDetailsDialog} onOpenChange={setOpenDetailsDialog}>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Reg. Date</TableHead>
                    <TableHead>Balance (PKR)</TableHead>
                    <TableHead>Invested</TableHead>
                    <TableHead><span className="sr-only">Actions</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                      Array.from({length:5}).map((_, i) => (
                          <TableRow key={i}>
                              <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                              <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                              <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                              <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                              <TableCell><Skeleton className="h-6 w-12" /></TableCell>
                              <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                          </TableRow>
                      ))
                  ) : filteredUsers.length === 0 ? (
                     <TableRow>
                        <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">No users found.</TableCell>
                     </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>{user.balance.toLocaleString()}</TableCell>
                        <TableCell>
                            <Badge variant={user.invested ? "default" : "secondary"} className={user.invested ? 'bg-green-500' : ''}>
                                {user.invested ? "Yes" : "No"}
                            </Badge>
                        </TableCell>
                        <TableCell>
                              <AlertDialog>
                                <Dialog>
                                    <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                        <span className="sr-only">Open menu</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DialogTrigger asChild>
                                            <DropdownMenuItem onClick={() => handleViewDetails(user)}><Eye className="mr-2"/> View Details</DropdownMenuItem>
                                        </DialogTrigger>
                                        <DialogTrigger asChild>
                                            <DropdownMenuItem onClick={() => { setEditingUser(user); setNewBalance(user.balance); }}>
                                                <Edit className="mr-2"/> Edit Balance
                                            </DropdownMenuItem>
                                        </DialogTrigger>
                                        <AlertDialogTrigger asChild>
                                        <DropdownMenuItem className="text-red-500 focus:text-red-500 focus:bg-red-500/10">
                                            <UserX className="mr-2"/> Delete User
                                        </DropdownMenuItem>
                                        </AlertDialogTrigger>
                                    </DropdownMenuContent>
                                    </DropdownMenu>

                                    <DialogContent className="max-w-2xl">
                                        <DialogHeader>
                                            {isDetailsLoading || !viewingUser ? (
                                                <DialogTitle>Loading User Details...</DialogTitle>
                                            ) : (
                                                <DialogTitle>Details for {viewingUser.profile.username}</DialogTitle>
                                            )}
                                        </DialogHeader>
                                        {isDetailsLoading || !viewingUser ? (
                                            <div className="p-8 text-center">
                                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary mx-auto"></div>
                                            </div>
                                        ) : (
                                            <ScrollArea className="h-[60vh] pr-6">
                                                <div className="space-y-6">
                                                    <div>
                                                        <h3 className="font-semibold text-lg mb-2">Profile Information</h3>
                                                        <div className="text-sm space-y-1">
                                                            <p><strong>Email:</strong> {viewingUser.profile.email}</p>
                                                            <p><strong>Balance:</strong> {viewingUser.profile.balance.toLocaleString()} PKR</p>
                                                            <p><strong>Invested:</strong> {viewingUser.profile.invested ? 'Yes' : 'No'}</p>
                                                            <p><strong>Registered:</strong> {new Date(viewingUser.profile.created_at).toLocaleString()}</p>
                                                        </div>
                                                    </div>
                                                    <Separator/>
                                                    <div>
                                                        <h3 className="font-semibold text-lg mb-2">Earnings History</h3>
                                                        {viewingUser.earnings.length > 0 ? (
                                                            <Table>
                                                                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                                                                <TableBody>
                                                                    {viewingUser.earnings.map((e, i) => <TableRow key={i}><TableCell>{new Date(e.created_at).toLocaleString()}</TableCell><TableCell className="text-right text-green-600">+{e.amount} PKR</TableCell></TableRow>)}
                                                                </TableBody>
                                                            </Table>
                                                        ) : <p className="text-sm text-muted-foreground">No earnings history.</p>}
                                                    </div>
                                                    <Separator/>
                                                    <div>
                                                        <h3 className="font-semibold text-lg mb-2">Withdrawal History</h3>
                                                        {viewingUser.withdrawals.length > 0 ? (
                                                            <Table>
                                                                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Amount</TableHead><TableHead className="text-right">Status</TableHead></TableRow></TableHeader>
                                                                <TableBody>
                                                                    {viewingUser.withdrawals.map((w, i) => <TableRow key={i}><TableCell>{new Date(w.created_at).toLocaleString()}</TableCell><TableCell>{w.amount} PKR</TableCell><TableCell className="text-right"><Badge variant={w.status === 'approved' ? 'default' : w.status === 'rejected' ? 'destructive' : 'secondary'} className={w.status === 'approved' ? 'bg-green-500' : ''}>{w.status}</Badge></TableCell></TableRow>)}
                                                                </TableBody>
                                                            </Table>
                                                        ) : <p className="text-sm text-muted-foreground">No withdrawal history.</p>}
                                                    </div>
                                                </div>
                                            </ScrollArea>
                                        )}
                                        <DialogFooter>
                                            <Button onClick={exportUserDetails} variant="secondary" disabled={isDetailsLoading || !viewingUser}>
                                            <Download className="mr-2"/> Export Details (CSV)
                                            </Button>
                                            <DialogClose asChild><Button variant="outline">Close</Button></DialogClose>
                                        </DialogFooter>
                                    </DialogContent>
                                    
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Edit Balance for {editingUser?.username}</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <Label htmlFor="balance">New Balance (PKR)</Label>
                                            <Input 
                                                id="balance"
                                                type="number"
                                                value={newBalance}
                                                onChange={(e) => setNewBalance(e.target.value)}
                                                placeholder="Enter new balance"
                                            />
                                        </div>
                                        <DialogFooter>
                                            <DialogClose asChild>
                                                <Button variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button>
                                            </DialogClose>
                                            <Button onClick={handleUpdateBalance} disabled={isUpdating}>
                                                {isUpdating ? 'Updating...' : 'Update Balance'}
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>

                                 <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete the user's account and remove their data from our servers.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteUser(user.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Dialog>
      </Card>
    </div>
  );
}
