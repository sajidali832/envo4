"use client";

import { LayoutDashboard, ArrowDownUp, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: "dashboard" | "withdrawal" | "referrals") => void;
}

export function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  const navItems = [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { id: "withdrawal", icon: ArrowDownUp, label: "Withdraw" },
    { id: "referrals", icon: Users, label: "Referrals" },
  ] as const;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t shadow-lg lg:hidden">
      <div className="flex h-full items-center justify-around">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full transition-colors duration-200",
                isActive ? "text-primary" : "text-muted-foreground hover:text-primary"
              )}
              aria-label={item.label}
            >
              <item.icon className="h-6 w-6" />
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
