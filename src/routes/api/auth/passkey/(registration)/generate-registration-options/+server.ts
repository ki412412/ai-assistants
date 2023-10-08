import { Passkey } from '$lib/auth/passkey';
import { json } from '@sveltejs/kit';
import {
    generateRegistrationOptions,
    verifyRegistrationResponse,
} from '@simplewebauthn/server';
import { supabase } from "$lib/supabaseClient";

import type {
    GenerateAuthenticationOptionsOpts,
    GenerateRegistrationOptionsOpts,
    VerifiedAuthenticationResponse,
    VerifiedRegistrationResponse,
    VerifyAuthenticationResponseOpts,
    VerifyRegistrationResponseOpts,
} from '@simplewebauthn/server';

import type {
    AuthenticationResponseJSON,
    AuthenticatorDevice,
    RegistrationResponseJSON,
} from '@simplewebauthn/typescript-types';
import { isoBase64URL, isoUint8Array } from '@simplewebauthn/server/helpers';
import type { LoggedInUser } from '$lib/auth/passkey/example-server.ts';



// export async function GET() {
//     const passkey = new Passkey();
//     const options = await passkey.generateRegistrationOptions();
//     return json(options);
// };

// Human-readable title for your website
const rpName: string = 'SimpleWebAuthn Example';
// A unique identifier for your website
const rpID: string = 'localhost';
// The URL at which registrations and authentications should occur
const origin: string = `https://${rpID}`;

// TODO: Replace with request's logged-in user ID
const userID = '1c2213fb-0e6c-490a-a861-898c67b5b3f4';

async function getUserFromDB(loggedInUserId: string): Promise<LoggedInUser> {
    const { data, error } = await supabase.from("users")
        .select(`
                                id, username,
                                authenticators (
                                    id,
                                    credentialID,
                                    credentialPublicKey,
                                    counter,
                                    transports
                                )
                            `)
        .eq('id', loggedInUserId)
        .limit(1);
    
    // convert base64url to Uint8Array
    data[0].authenticators.forEach((authenticator) => {
        authenticator.credentialID = isoBase64URL.toBuffer(authenticator.credentialID);
        authenticator.credentialPublicKey = isoBase64URL.toBuffer(authenticator.credentialPublicKey);
    });
    
    const user: LoggedInUser = {
        id: data[0].id,
        username: data[0].username,
        devices: []
    };

    if (error) {
        console.log(error);
    }

    return user;
}

export async function GET({ request, cookies }) {

    // Retrieve the user from the database after they've logged in
    const user: LoggedInUser = await getUserFromDB(userID);

    // Retrieve any of the user's previously-registered authenticators
    // const userAuthenticators: Authenticator[] = getUserAuthenticators(user);

    const opts: GenerateRegistrationOptionsOpts = {
        rpName: 'SimpleWebAuthn Example',
        rpID: rpID,
        userID: user.id,
        userName: user.username,
        timeout: 60000,
        attestationType: 'none',
        /**
         * Passing in a user's list of already-registered authenticator IDs here prevents users from
         * registering the same device multiple times. The authenticator will simply throw an error in
         * the browser if it's asked to perform registration when one of these ID's already resides
         * on it.
         */
        excludeCredentials: user.devices.map((dev) => ({
            id: dev.credentialID,
            type: 'public-key',
            transports: dev.transports,
        })),
        authenticatorSelection: {
            residentKey: 'discouraged',
        },
        /**
         * Support the two most common algorithms: ES256, and RS256
         */
        supportedAlgorithmIDs: [-7, -257],
    };

    const options = await generateRegistrationOptions(opts);

    // (Pseudocode) Remember the challenge for this user
    cookies.set('challenge', options.challenge);

    return json(options);
};