
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 });
    }
    
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    // 1. Get all invested users
    const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, balance')
        .eq('invested', true);

    if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
    }

    if (!profiles || profiles.length === 0) {
        return NextResponse.json({ message: 'No invested users to process.' });
    }
    
    // 2. Get users who have already received earnings today
    const { data: todaysEarnings, error: earningsCheckError } = await supabase
        .from('earnings')
        .select('user_id')
        .gte('created_at', today.toISOString());

    if (earningsCheckError) {
        console.error('Error checking for today\'s earnings:', earningsCheckError);
        return NextResponse.json({ error: 'Failed to check earnings' }, { status: 500 });
    }

    const usersWithEarningsToday = new Set(todaysEarnings?.map(e => e.user_id));
    
    // 3. Filter to find users who need to be paid
    const usersToPay = profiles.filter(p => !usersWithEarningsToday.has(p.id));

    if (usersToPay.length === 0) {
        return NextResponse.json({ message: 'All invested users have already received their earnings for today.' });
    }
    
    // 4. Prepare data for batch inserts and updates
    const earningsToInsert = usersToPay.map(user => ({
        user_id: user.id,
        amount: 200,
    }));
    
    // 5. Insert new earnings records
    const { error: earningsInsertError } = await supabase
        .from('earnings')
        .insert(earningsToInsert);

    if (earningsInsertError) {
        console.error('Error inserting earnings:', earningsInsertError);
        return NextResponse.json({ error: 'Failed to insert earnings' }, { status: 500 });
    }

    // 6. Update user balances
    // Supabase JS library doesn't support batch updates, so we do it one by one.
    // For large scale, a Postgres function would be much more performant.
    let updatedCount = 0;
    for (const user of usersToPay) {
        const newBalance = user.balance + 200;
        const { error: balanceUpdateError } = await supabase
            .from('profiles')
            .update({ balance: newBalance })
            .eq('id', user.id);

        if (balanceUpdateError) {
            console.error(`Failed to update balance for user ${user.id}:`, balanceUpdateError);
            // Continue to next user, but log the error
        } else {
            updatedCount++;
        }
    }
    
    return NextResponse.json({
        message: `Successfully processed daily earnings.`,
        users_paid: updatedCount,
        users_skipped: profiles.length - updatedCount,
    });
}
