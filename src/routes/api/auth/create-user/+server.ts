import { supabase } from "$lib/supabaseClient";
import { json } from "@sveltejs/kit";

export async function POST({ request, cookies }) {
    const { username } = await request.json();

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

    cookies.set('userID', user.id);

    return json({ message: 'Successfully created user' });
}
