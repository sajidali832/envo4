import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Shield } from "lucide-react";

export default function AdminLoginPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white p-4">
            <Card className="w-full max-w-sm bg-gray-800 border-gray-700">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex items-center gap-2 text-primary-foreground">
                        <Shield className="h-8 w-8 text-accent"/>
                        <h1 className="text-2xl font-headline">Admin Panel</h1>
                    </div>
                    <CardDescription className="text-gray-400">Enter your admin credentials to access the dashboard.</CardDescription>
                </CardHeader>
                <CardContent>
                    <AdminLoginForm />
                </CardContent>
            </Card>
        </div>
    );
}
