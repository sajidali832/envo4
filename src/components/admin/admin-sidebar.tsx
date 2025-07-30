
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Shield, Users, CheckCircle, Banknote, Power, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/dashboard/approvals", label: "Approvals", icon: CheckCircle },
  { href: "/admin/dashboard/users", label: "Users", icon: Users },
  { href: "/admin/dashboard/withdrawals", label: "Withdrawals", icon: Banknote },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex-shrink-0 bg-background text-foreground border-r flex flex-col">
      <div className="h-16 border-b flex items-center px-6">
        <Shield className="h-6 w-6 text-accent" />
        <h1 className="ml-3 text-lg font-bold font-headline">Admin Panel</h1>
      </div>
      <nav className="flex-1 py-6 px-4 space-y-2">
        {navItems.map((item) => (
          <Button
            key={item.href}
            variant={pathname === item.href ? "secondary" : "ghost"}
            className="w-full justify-start"
            asChild
          >
            <Link href={item.href}>
              <item.icon className="mr-3 h-5 w-5" />
              {item.label}
            </Link>
          </Button>
        ))}
      </nav>
      <div className="p-4 border-t">
        <Button variant="outline" className="w-full justify-start" asChild>
          <Link href="/admin">
            <Power className="mr-3 h-5 w-5" />
            Logout
          </Link>
        </Button>
      </div>
    </aside>
  );
}
