import { Passkey } from '$lib/auth/passkey';
import { json } from '@sveltejs/kit';

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
            const userID = cookies.get('userID') ?? '';
            const user = await passkey.getUserByID(userID);
            await passkey.registerNewDeviceToDBIfNotExists(user, verification, registrationResponse)
        } catch (error) {
            console.error(error);
            return json({ message: 'Failed to register new device.' }, { status: 500 });
        }
    }

    // Remove the challenge from the cookie
    cookies.set('currentChallenge', '');

    // TODO: Should we remove the userID cookie here?

    return json({ verified });
}