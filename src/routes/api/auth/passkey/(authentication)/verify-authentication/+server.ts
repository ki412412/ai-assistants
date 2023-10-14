import { Passkey } from '$lib/auth/passkey';
import { json } from '@sveltejs/kit';
import { supabase } from "$lib/supabaseClient";

export async function POST({ request, cookies }) {
    const passkey = new Passkey();

    const expectedChallenge = cookies.get('challenge') ?? '';
    if (!expectedChallenge) {
        return json({ error: 'Challenge not found' }, { status: 404 });
    }
    const userID = cookies.get('userID') ?? '';
    if (!userID) {
        return json({ error: 'User ID not found' }, { status: 404 });
    }
    
    // get the user from the DB
    const user = await passkey.getUserByID(userID);
    if (!user) {
        return json({ error: 'User not found' }, { status: 404 });
    }

    // Verify that the request originated from the expected domain
    let verification;
    try {
        const body = await passkey.getAuthenticationResponse(request);
        verification = await passkey.verifyAuthenticationResponse(body, expectedChallenge, user);
    } catch (error) {
        const _error = error as Error;
        console.error(_error);
        return json({ error: _error.message }, { status: 400 });
    }

    // Update the authenticator's counter in the DB
    const { verified } = verification;
    if (verified) {
        await passkey.updateAuthenticatorConterInDB(verification);
    }

    // Clear the challenge from the cookie
    cookies.set('challenge', '');

    // Start session
    const sessionID = crypto.randomUUID();
    const { error: insertError } = await supabase.from("sessions")
                                    .insert([{ 
                                        id: sessionID,
                                        user_id: user.id,
                                        user_agent: request.headers.get('user-agent'),
                                    }]);
    if (insertError) {
        return json({ error: insertError }, { status: 500 });
    }
    cookies.set('__session', sessionID, { secure: true, path: '/' });

    return json({ verified });
}