
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
    .select('id, status, referrer_id, investment_amount, investment_plan_id, daily_return_amount')
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
  
  const referralBonusAmount = submission.investment_plan_id === '3' ? 800 : 200;

  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      username: username,
      email: email,
      investment_amount: submission.investment_amount,
      investment_plan_id: submission.investment_plan_id,
      daily_return_amount: submission.daily_return_amount,
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
    // Give bonus to the referrer
    const { data: referrerProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', submission.referrer_id)
        .single();
    
    if (referrerProfile) {
        const newBalance = referrerProfile.balance + referralBonusAmount;
        await supabase
            .from('profiles')
            .update({ balance: newBalance })
            .eq('id', submission.referrer_id);
    }

    // Create a record in the referrals table
    await supabase
        .from('referrals')
        .insert({
            referrer_id: submission.referrer_id,
            referred_user_id: user.id,
            status: 'Invested',
            bonus_amount: referralBonusAmount
        });
  }

  // 6. Return success
  return { 
    type: 'success', 
    message: 'Registration successful!',
  };
}
