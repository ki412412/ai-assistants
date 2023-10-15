import { redirect, type Handle } from "@sveltejs/kit";
import { supabase } from "$lib/supabaseClient";

export const handle = (async ({ event, resolve }) => {

    // Skip if it is specific route
    if (event.url.pathname.startsWith('/api/auth/passkey')
        || event.url.pathname.startsWith('/api/auth/create-user')// TODO: Remove this
        || event.url.pathname.match('/register')   
        || event.url.pathname.match('/login')
        || event.url.pathname.match('/logout')
    ) {
        return resolve(event);
    }

    // Get sessionID
    const sessionID = event.cookies.get("__session");

    // Find the session from DB
    const { data: sessions, error } = await supabase.from("sessions")
                                        .select()
                                        .eq('id', sessionID)
                                        .limit(1);

    // Redirect to login page if session is invalid
    if (!sessions || sessions.length === 0 || error) {
        event.locals.userID = null;
        throw redirect(303, '/login');
    }

    // Set local variables
    const session = sessions[0];
    event.locals.userID = session.user_id;

    return resolve(event);
}) satisfies Handle;