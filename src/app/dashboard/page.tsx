
"use client";

import { useState, useEffect } from "react";
import { BottomNav } from "@/components/dashboard/bottom-nav";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { WithdrawalSection } from "@/components/dashboard/withdrawal-section";
import { ReferralSection } from "@/components/dashboard/referral-section";
import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { EnvoEarnLogo } from "@/components/logo";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader } from "@/components/ui/loader";

type User = {
  username: string;
};

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      const { data: { session }} = await supabase.auth.getSession();
      if (!session) {
        router.push('/signin');
        return;
      }
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', session.user.id)
        .single();
        
      if (error || !profile) {
        console.error("Error fetching profile, logging out.", error);
        await supabase.auth.signOut();
        router.push('/signin');
        return;
      }
      
      setUser(profile);
      setLoading(false);
    };
    fetchUser();
  }, [router, supabase]);


  const renderContent = () => {
    switch (activeTab) {
      case "withdrawal":
        return <WithdrawalSection />;
      case "referrals":
        return <ReferralSection />;
      case "dashboard":
      default:
        return <DashboardSection />;
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  }

  if (loading) {
      return (
          <div className="flex h-screen items-center justify-center bg-background">
              <Loader />
          </div>
      )
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm">
            <div className="container flex h-14 items-center justify-between">
                <EnvoEarnLogo inHeader={true}/>
                <div className="flex items-center space-x-4">
                    {loading ? (
                        <Skeleton className="h-10 w-10 rounded-full" />
                    ) : (
                        <Avatar>
                          <AvatarImage src={`https://placehold.co/40x40/78A2CC/FFFFFF?text=${user?.username?.charAt(0).toUpperCase()}`} />
                          <AvatarFallback>{user?.username?.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                    )}
                    <Button variant="ghost" size="icon" onClick={handleLogout}>
                        <LogOut className="h-5 w-5"/>
                    </Button>
                </div>
            </div>
        </header>

      <main className="flex-1 overflow-y-auto pb-28">
          <div className="container pt-6">
            {renderContent()}
          </div>
      </main>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
