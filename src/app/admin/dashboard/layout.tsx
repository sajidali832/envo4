import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { ReactNode } from "react";

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-secondary">
      <AdminSidebar />
      <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
