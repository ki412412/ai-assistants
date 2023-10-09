import { json } from '@sveltejs/kit';
import { Passkey } from '$lib/auth/passkey';

// TODO: Replace with request's logged-in user ID
const userID = '1c2213fb-0e6c-490a-a861-898c67b5b3f4';

export async function GET({ request, cookies }) {
    const passkey = new Passkey();

    const user = await passkey.getUserFromDB(userID);

    const options = await passkey.generateRegistrationOptions(user);

    // Store the challenge in a cookie
    cookies.set('challenge', options.challenge);

    return json(options);
}