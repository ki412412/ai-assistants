import { Passkey } from '$lib/auth/passkey';
import { json } from '@sveltejs/kit';

// TODO: Replace with request's logged-in user ID
const userID = '1c2213fb-0e6c-490a-a861-898c67b5b3f4';

export async function POST({ request, cookies }) {
    const passkey = new Passkey();

    const registrationResponse = await passkey.getRegistrationResponse(request);
    const expectedChallenge = cookies.get('challenge') ?? '';

    let verification;
    try {
        verification = await passkey.verifyRegistrationResponse(registrationResponse, expectedChallenge);
    } catch (error) {
        console.error(error);
        return json({ message: "Failed to verify the Registration Response." }, { status: 400 });
    }
    
    const { verified, registrationInfo } = verification;
    if (verified && registrationInfo) {
        try {
            const user = await passkey.getUserFromDB(userID);
            await passkey.registerNewDeviceToDBIfNotExists(user, verification, registrationResponse)
        } catch (error) {
            console.error(error);
            return json({ message: 'Failed to register new device.' }, { status: 500 });
        }
    }

    // Remove the challenge from the cookie
    cookies.set('currentChallenge', '');

    return json({ verified });
}