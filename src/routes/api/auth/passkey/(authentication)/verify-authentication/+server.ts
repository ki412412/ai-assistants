import { Passkey } from '$lib/auth/passkey';
import { json } from '@sveltejs/kit';

import {
    // Authentication
    generateAuthenticationOptions,
    // Registration
    generateRegistrationOptions,
    verifyAuthenticationResponse,
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
import { isoBase64URL, isoUint8Array } from '@simplewebauthn/server/helpers';
import type {
    AuthenticationResponseJSON,
    AuthenticatorDevice,
    RegistrationResponseJSON,
} from '@simplewebauthn/typescript-types';
import type { LoggedInUser } from '$lib/auth/passkey/example-server.ts';

const {
    ENABLE_CONFORMANCE,
    ENABLE_HTTPS,
    RP_ID = 'localhost',
} = process.env;

// Human-readable title for your website
const rpName: string = 'SimpleWebAuthn Example';
// A unique identifier for your website
const rpID: string = RP_ID;
// The URL at which registrations and authentications should occur
let expectedOrigin: string = `https://${rpID}`;
if (ENABLE_HTTPS) {
    expectedOrigin = `https://${rpID}`;
} else {
    const port = 5173;
    expectedOrigin = `http://localhost:${port}`;
}

// TODO: Replace with request's logged-in user ID
const userID = '1c2213fb-0e6c-490a-a861-898c67b5b3f4';

async function getUserFromDB(loggedInUserId: string): Promise<LoggedInUser> {

    const { data } = await supabase.from("users")
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
        devices: data[0].authenticators,
    };
    return user;
}

// export async function POST({ request, cookies }) {

//     const body = await request.json()

//     const passkey = new Passkey();

//     try {
//         const verified = await passkey.verifyRegistrationResponse(body);
//         return json(verified);
//     } catch (e) {
//         return json({ "message": "Invalid Registration Response" }, { status: 400 });
//     }
// }

export async function POST({ request, cookies }) {

    // const body: AuthenticationResponseJSON = req.body;

    const jsonData = await request.json();
    const body: AuthenticationResponseJSON = {
        id: jsonData.id,
        rawId: jsonData.rawId,
        response: {
            authenticatorData: jsonData.response.authenticatorData,
            clientDataJSON: jsonData.response.clientDataJSON,
            signature: jsonData.response.signature,
            userHandle: jsonData.response.userHandle,
        },
        authenticatorAttachment: jsonData.authenticatorAttachment,
        clientExtensionResults: jsonData.clientExtensionResults,
        type: jsonData.type,
    };
    
    const user = await getUserFromDB(userID);
    

    const expectedChallenge = cookies.get('challenge');

    let dbAuthenticator;
    const bodyCredIDBuffer = isoBase64URL.toBuffer(body.rawId);
    
    for (const dev of user.devices) {
        //console.log(`${isoUint8Array.toHex(dev.credentialID)} === ${isoUint8Array.toHex(bodyCredIDBuffer)} => ${isoUint8Array.areEqual(dev.credentialID, bodyCredIDBuffer)}`);
        if (isoUint8Array.areEqual(dev.credentialID, bodyCredIDBuffer)) {
            dbAuthenticator = dev;
            break;
        }
    }

    if (!dbAuthenticator) {
        return json({
            error: 'Authenticator is not registered with this site',
        }, {status: 400});
    }

    let verification: VerifiedAuthenticationResponse;
    try {
        const opts: VerifyAuthenticationResponseOpts = {
            response: body,
            expectedChallenge: `${expectedChallenge}`,
            expectedOrigin,
            expectedRPID: rpID,
            authenticator: dbAuthenticator,
            requireUserVerification: true,
        };
        verification = await verifyAuthenticationResponse(opts);
    } catch (error) {
        const _error = error as Error;
        console.error(_error);
        return json({ error: _error.message }, { status: 400 });
    }

    const { verified, authenticationInfo } = verification;

    if (verified) {
        // Update the authenticator's counter in the DB to the newest count in the authentication
        const { data, error } = await supabase.from("authenticators")
                                .update({ counter: authenticationInfo.newCounter })
                                .eq('credentialID', authenticationInfo.credentialID);
        if (error) {
            console.log(error);
            return json({ error: error.message }, { status: 400 });
        }
    }

    cookies.set('challenge', '');

    return json({ verified });
}