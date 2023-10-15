import { supabase } from "$lib/supabaseClient";
import { json } from "@sveltejs/kit";

export async function POST({ request, cookies }) {
    const { username } = await request.json();

    // Check if username does not exist
    const { data: userData, error: userError } = await supabase.from("users").select()
                                                .eq('username', username)
                                                .limit(1);
    if (userError) {
        return json({ error: userError }, { status: 500 });
    }
    if (userData.length > 0) {
        cookies.set('userID', userData[0].id, { path: '/', sameSite: 'strict' });
        return json({ message: 'Username already exists' }, { status: 200 });
    }

    // Create a user
    const { error: insertError } = await supabase.from("users")
                                    .insert([{ username: username }]);

    if (insertError) {
        return json({ error: insertError }, { status: 500 });
    }

    // Get the user
    const { data: selectData, error: selectError } = await supabase.from("users").select()
                                                    .eq('username', username)
                                                    .limit(1);
    if (selectError) {
        return json({ error: selectError }, { status: 500 });
    }
    if (selectData.length === 0) {
        return json({ error: 'User not found' }, { status: 404 });
    }
    const user = selectData?.[0];

    cookies.set('userID', user.id, { path: '/', sameSite: 'strict' });

    return json({ message: 'Successfully created user' });
}
