
'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters.').max(20, 'Username must be less than 20 characters.'),
  email: z.string().email('Please enter a valid email.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  planId: z.string(),
  amount: z.string(),
  dailyReturn: z.string(),
});

export async function registerUser(prevState: any, formData: FormData) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const validatedFields = registerSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      type: 'error',
      message: 'Invalid form data. Please check your inputs.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  
  const { username, email, password, planId, amount, dailyReturn } = validatedFields.data;

  // Check for existing username or email in profiles table
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('username, email')
    .or(`username.eq.${username},email.eq.${email}`)
    .maybeSingle();

  if (existingProfile) {
    if (existingProfile.username === username) {
      return { type: 'error', message: 'Username already exists.' };
    }
    if (existingProfile.email === email) {
      return { type: 'error', message: 'An account with this email already exists.' };
    }
  }

  // Create the user in Auth
  const { data: { user }, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
        data: {
            username: username,
        }
    }
  });

  if (signUpError) {
    return { type: 'error', message: signUpError.message };
  }
  if (!user) {
    return { type: 'error', message: 'Could not create user account. Please try again.' };
  }

  // Create the user profile with pending investment
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      username: username,
      email: email,
      investment_plan_id: planId,
      investment_amount: Number(amount),
      daily_return_amount: Number(dailyReturn),
      invested: false, // User has not paid yet
      balance: 0,
    });

  if (profileError) {
    // Attempt to clean up the auth user if profile creation fails
    await supabase.auth.admin.deleteUser(user.id);
    return { type: 'error', message: `Could not create user profile: ${profileError.message}` };
  }
  
  // Return success. The form will handle the redirect.
  return { 
    type: 'success', 
    message: 'Registration successful! Redirecting to payment...',
    user: { id: user.id, email: user.email, username }
  };
}
