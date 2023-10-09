import { Passkey } from '$lib/auth/passkey';
import { json } from '@sveltejs/kit';

export async function POST({ request, cookies }) {
    const passkey = new Passkey();

    const { username } = await request.json();
    if (!username) {
        return json({ message: 'Username is required' }, { status: 400 });
    }

    const user = await passkey.getUserByUsername(username);
    if (!user) {
        return json({ message: 'User not found' }, { status: 404 });
    }
    
    const options = await passkey.generateAuthenticationOptions(user);

    cookies.set('challenge', options.challenge);
    cookies.set('userID', user.id);

    return json(options);
};