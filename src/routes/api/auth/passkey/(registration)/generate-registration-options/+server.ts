import { json } from '@sveltejs/kit';
import { Passkey } from '$lib/auth/passkey';

export async function GET({ request, cookies }) {
    const passkey = new Passkey();

    const userID = cookies.get('userID');
    if (!userID) {
        return json({ error: 'username not found' }, { status: 500 });
    }

    const user = await passkey.getUserByID(userID);
    if (!user) {
        return json({ error: 'user not found' }, { status: 404 });
    }

    const options = await passkey.generateRegistrationOptions(user);

    // Store the challenge in a cookie
    cookies.set('challenge', options.challenge);

    return json(options);
}