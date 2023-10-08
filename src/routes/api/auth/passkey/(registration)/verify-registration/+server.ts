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

    const jsonData = await request.json();

    const body: RegistrationResponseJSON = {
        id: jsonData.id,
        rawId: jsonData.rawId,
        response: jsonData.response,
        authenticatorAttachment: jsonData.authenticatorAttachment,
        clientExtensionResults: jsonData.clientExtensionResults,
        type: jsonData.type,
    };
    
    const user = await getUserFromDB(userID);

    const expectedChallenge = cookies.get('challenge');

    let verification: VerifiedRegistrationResponse;
    try {
        const opts: VerifyRegistrationResponseOpts = {
            response: body,
            expectedChallenge: `${expectedChallenge}`,
            expectedOrigin: expectedOrigin,
            expectedRPID: rpID,
            requireUserVerification: true,
        };
        verification = await verifyRegistrationResponse(opts);
    } catch (error) {
        const _error = error as Error;
        console.error(_error);
        return json({ message: _error.message }, { status: 400 });
    }

    const { verified, registrationInfo } = verification;

    if (verified && registrationInfo) {
        const { credentialPublicKey, credentialID, counter } = registrationInfo;
        
        const existingDevice = user.devices.find((device) => {
            //console.log(`${isoUint8Array.toHex(device.credentialID)} === ${isoUint8Array.toHex(credentialID)} => ${isoUint8Array.areEqual(device.credentialID, credentialID)}`);
            return isoUint8Array.areEqual(device.credentialID, credentialID)
        });

        if (!existingDevice) {
            /**
             * Add the returned device to the user's list of devices
             */
            const newDevice: AuthenticatorDevice = {
                credentialPublicKey,
                credentialID,
                counter,
                transports: body.response.transports,
            };
            
            const {data, error } = await supabase.from('authenticators').insert([
                {
                    user_id: user.id,
                    credentialID: isoBase64URL.fromBuffer(newDevice.credentialID),
                    credentialPublicKey: isoBase64URL.fromBuffer(newDevice.credentialPublicKey),
                    counter: newDevice.counter,
                    transports: newDevice.transports,
                }
            ]);
            if (error) {
                console.log(error);
                return json({ error: 'Database Error' }, { status: 500 });
            }
            // user.devices.push(newDevice);
        }
    }

    cookies.set('currentChallenge', '');

    return json({ verified });
}