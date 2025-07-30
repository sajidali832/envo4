'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters.').max(20, 'Username must be less than 20 characters.'),
  email: z.string().email('Please enter a valid email.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  phone: z.string().min(11, 'Valid phone number is required for verification.'),
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
  
  const { username, email, password, phone } = validatedFields.data;

  // 1. Check if payment is approved for the given phone number
  const { data: submission, error: submissionError } = await supabase
    .from('payment_submissions')
    .select('id, status, referrer_id')
    .eq('account_number', phone)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (submissionError || !submission || submission.status !== 'approved') {
    return { type: 'error', message: 'No approved payment found for your phone number.' };
  }

  // 2. Check for existing username or email
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

  // 3. Create the user in Auth
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

  // 4. Create the user profile with initial balance if referred
  const initialBalance = submission.referrer_id ? 200 : 0;

  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      username: username,
      email: email,
      invested: true,
      investment_date: new Date().toISOString(),
      balance: initialBalance,
    });

  if (profileError) {
    // Attempt to clean up the auth user if profile creation fails
    await supabase.auth.admin.deleteUser(user.id);
    return { type: 'error', message: `Could not create user profile: ${profileError.message}` };
  }

  // 5. Update related records
  await supabase
    .from('payment_submissions')
    .update({ user_id: user.id, user_email: email })
    .eq('id', submission.id);

  if (submission.referrer_id) {
    await supabase
      .from('referrals')
      .update({ referred_user_id: user.id })
      .eq('referrer_id', submission.referrer_id)
      .is('referred_user_id', null)
      .order('created_at', { ascending: true }) // Update oldest pending referral
      .limit(1);
  }

  // 6. Return success with user details for email sending
  return { 
    type: 'success', 
    message: 'Registration successful!',
    user: { email, username } 
  };
}
