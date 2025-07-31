
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { Copy, UploadCloud, Phone, User, Building } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const paymentSchema = z.object({
  userPhone: z.string().min(11, { message: "A valid phone number is required." }).regex(/^03\d{9}$/, 'Phone number must be a valid Pakistani mobile number (e.g., 03001234567).'),
  accountName: z.string().min(2, { message: "Account name must be at least 2 characters." }),
  paymentPlatform: z.string({ required_error: "Please select a payment platform." }),
  screenshot: z.any().refine((files) => files?.length == 1, "A screenshot is required."),
});

interface PaymentFormProps {
    planId: string;
    amount: number;
    dailyReturn: number;
    planName: string;
}

export function PaymentForm({ planId, amount, dailyReturn, planName }: PaymentFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();

  const form = useForm<z.infer<typeof paymentSchema>>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      userPhone: "",
      accountName: "",
      paymentPlatform: undefined,
      screenshot: undefined,
    },
  });

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText("03130306344");
    toast({
      title: "Copied!",
      description: "Phone number copied to clipboard.",
    });
  };

  const onSubmit = async (values: z.infer<typeof paymentSchema>) => {
    setIsSubmitting(true);
    
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            toast({ variant: 'destructive', title: 'Not Authenticated', description: 'You must be logged in to submit payment.' });
            router.push('/signin');
            return;
        }

        const screenshotFile = values.screenshot[0];
        const sanitizedFileName = screenshotFile.name.replace(/[^a-zA-Z0-9-._]/g, '');
        const filePath = `${user.id}/${Date.now()}_${sanitizedFileName}`;

        const { error: uploadError } = await supabase.storage.from('payment-proofs').upload(filePath, screenshotFile);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage.from('payment-proofs').getPublicUrl(filePath);

        const submissionData = {
            user_id: user.id,
            user_email: user.email,
            account_name: values.accountName,
            account_number: values.userPhone,
            payment_platform: values.paymentPlatform,
            screenshot_url: publicUrlData.publicUrl,
            status: 'pending',
            investment_plan_id: planId,
            investment_amount: amount,
            daily_return_amount: dailyReturn,
        };

        const { error: dbError } = await supabase.from('payment_submissions').insert(submissionData);

        if (dbError) throw dbError;
        
        // Also update profile to indicate a submission is pending
        await supabase.from('profiles').update({ invested: false, investment_date: new Date().toISOString() }).eq('id', user.id);


        toast({
          title: "Submission Successful!",
          description: "Your payment proof has been submitted for review.",
        });
        router.push(`/invest/timer`);

    } catch (error: any) {
        console.error("Payment submission error:", error);
        toast({
            variant: "destructive",
            title: "Submission Failed",
            description: error.message || "An unexpected error occurred. Please try again.",
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Submit Payment Proof</CardTitle>
        <CardDescription>
            You have selected the <span className="font-bold text-primary">{planName}</span>. Please follow the instructions below.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-4 space-y-2">
            <p className="text-sm font-medium">Send <strong className="text-primary">{amount.toLocaleString()} PKR</strong> to:</p>
            <div className="flex items-center justify-between">
              <span className="font-mono text-lg font-bold">03130306344</span>
              <Button variant="ghost" size="icon" onClick={handleCopyToClipboard}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">Account Name: <span className="font-semibold">Zulekhan</span></p>
            <p className="text-sm text-muted-foreground">Platform: <span className="font-semibold">Easypaisa</span></p>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 rounded-lg border p-4">
                <FormField
                    control={form.control}
                    name="accountName"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Your Account Holder's Name</FormLabel>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                            <FormControl>
                                <Input placeholder="e.g., John Doe" {...field} className="pl-10" />
                            </FormControl>
                        </div>
                        <FormMessage />
                    </FormItem>
                    )}
                />
               <FormField
                control={form.control}
                name="userPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Phone Number (from which payment was sent)</FormLabel>
                     <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                        <FormControl>
                            <Input type="tel" placeholder="03001234567" {...field} className="pl-10" />
                        </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="paymentPlatform"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Platform You Used</FormLabel>
                     <div className="relative">
                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                        <FormControl>
                           <Select onValueChange={field.onChange} defaultValue={field.value}>
                               <SelectTrigger className="pl-10">
                                   <SelectValue placeholder="Select a platform" />
                               </SelectTrigger>
                               <SelectContent>
                                   <SelectItem value="easypaisa">Easypaisa</SelectItem>
                                   <SelectItem value="jazzcash">JazzCash</SelectItem>
                                   <SelectItem value="bank">Bank Transfer</SelectItem>
                               </SelectContent>
                           </Select>
                        </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="screenshot"
                render={({ field: { onChange, value, ...rest } }) => (
                    <FormItem>
                      <FormLabel>Payment Screenshot</FormLabel>
                      <FormControl>
                         <div className="relative">
                          <UploadCloud className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"/>
                          <Input type="file" className="pl-10 h-auto" accept="image/*"  {...rest} onChange={(e) => onChange(e.target.files)} />
                         </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
              />
              <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit for Approval"}
              </Button>
            </form>
          </Form>
        </div>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground text-center w-full">
            Approval will be granted within 10 minutes after submission.
        </p>
      </CardFooter>
    </Card>
  );
}
