import { Passkey } from '$lib/auth/passkey';
import { json } from '@sveltejs/kit';

// TODO: Replace with request's logged-in user ID
const userID = '1c2213fb-0e6c-490a-a861-898c67b5b3f4';

export async function POST({ request, cookies }) {
    const passkey = new Passkey();

    // Verify that the request originated from the expected domain
    let verification;
    try {
        const body = await passkey.getAuthenticationResponse(request);
        const expectedChallenge = cookies.get('challenge') ?? '';
        const user = await passkey.getUserFromDB(userID);
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

    return json({ verified });
}