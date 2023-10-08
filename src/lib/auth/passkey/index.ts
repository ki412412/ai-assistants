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
  
import type { LoggedInUser } from '$lib/auth/passkey/example-server.ts';
  

// TODO: Replace with request's logged-in user ID
const userID = '1c2213fb-0e6c-490a-a861-898c67b5b3f4';

async function getUserFromDB(loggedInUserId: string): Promise<LoggedInUser> {
    const { data } = await supabase.from("users").select().eq('id', loggedInUserId).limit(1);

    const user: LoggedInUser = {
        id: data[0].id,
        username: data[0].username,
        devices: []
    };
    console.log(user);

    return user;
}

// const authenticator: Authenticator = {
//     userID:userID,
//     credentialID: new Uint8Array(),
//     credentialPublicKey: new Uint8Array(),
//     counter: 0,
//     credentialDeviceType: CredentialDeviceType.SINGLE_DEVICE,
//     credentialBackedUp: false,
//     transports: [],
// }
// async function getUserAuthenticators(user: LoggedInUser): Authenticator[] {
//     // TODO: Retrieve authenticators from the database
//     const response = await supabase.from("authenticators").select().eq('user_id', user.id).limit(1);
//     const data = response.data;

//     if (!data) {
//         return [];
//     }

//     const authenticators: Authenticator[] = data.map((authenticator) => {
//             return {
//                     userID: authenticator.user_id,
//                     credentialID: authenticator.credential_id,
//                     credentialPublicKey: authenticator.credential_public_key,
//                     counter: authenticator.counter,
//                     credentialDeviceType: authenticator.credential_device_type,
//                     credentialBackedUp: authenticator.credential_backed_up,
//                     transports: authenticator.transports,
//             }
//     });
    
//     return authenticators;
// }

export class Passkey {

    // Human-readable title for your website
    private rpName: string = 'SimpleWebAuthn Example';
    // A unique identifier for your website
    public rpID: string = 'localhost';
    // The URL at which registrations and authentications should occur
    private origin: string = `https://${this.rpID}`;

    public async generateRegistrationOptions() {

        // Retrieve the user from the database after they've logged in
        const user: LoggedInUser = await getUserFromDB(userID);
        
        // Retrieve any of the user's previously-registered authenticators
        // const userAuthenticators: Authenticator[] = getUserAuthenticators(user);

        const opts: GenerateRegistrationOptionsOpts = {
            rpName: 'SimpleWebAuthn Example',
            rpID: this.rpID,
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
        session.setItem('challenge', options.challenge);
        
        return options;
    }
    
    private setUserCurrentChallenge(user, challenge) {
        // TODO: Save `challenge` to the database
        this.challenge = challenge;
    }

    public async verifyRegistrationResponse(body: object): Promise<boolean> {

        // (Pseudocode) Retrieve the logged-in user
        const user: LoggedInUser = getUserFromDB(userID);
        // (Pseudocode) Get `options.challenge` that was saved above
        const expectedChallenge: string = this.getUserCurrentChallenge(user);

        let verification;
        try {
            verification = await verifyRegistrationResponse({
                response: body,
                expectedChallenge,
                expectedOrigin: this.origin,
                expectedRPID: this.rpID,
            });
        } catch (error) {
            console.error(error);
            throw new Error('Registration failed');
        }

        const { verified } = verification;
        return verified;
    }

    private getUserCurrentChallenge(user): string {
        // TODO: Retrieve the challenge from the database
        return 'EJJ0EiJ2-epG8Izng7qhSVrj-SU-FYli0J4G1tOOFeI';
    }
}