
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';

const adminLoginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

export function AdminLoginForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();

  const form = useForm<z.infer<typeof adminLoginSchema>>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: process.env.NEXT_PUBLIC_ADMIN_EMAIL || '',
      password: process.env.NEXT_PUBLIC_ADMIN_PASSWORD || '',
    },
  });

  async function onSubmit(values: z.infer<typeof adminLoginSchema>) {
    setIsSubmitting(true);

    const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
    });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: error.message || 'Incorrect email or password.',
      });
      setIsSubmitting(false);
    } else {
        toast({
            title: 'Access Granted',
            description: 'Redirecting to admin dashboard.',
        });
        router.push('/admin/dashboard');
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-300">Admin Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="admin@example.com" {...field} className="bg-gray-700 border-gray-600 text-white" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-300">Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} className="bg-gray-700 border-gray-600 text-white" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={isSubmitting}>
          {isSubmitting ? 'Verifying...' : 'Enter'}
        </Button>
      </form>
    </Form>
  );
}
