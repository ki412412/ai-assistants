import {
    generateRegistrationOptions,
    GenerateRegistrationOptionsOpts,
} from '@simplewebauthn/server';
import { isoBase64URL } from '@simplewebauthn/server/helpers';
import { supabase } from "$lib/supabaseClient";
import type { LoggedInUser } from './example-server';

export class Passkey {

    // Human-readable title for your website
    private rpName: string = 'SimpleWebAuthn Example';
    // A unique identifier for your website
    private rpID: string = 'localhost';
    // The URL at which registrations and authentications should occur
    private origin: string = `https://${this.rpID}`;

    public async getUserFromDB(loggedInUserId: string): Promise<LoggedInUser> {
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

    public async generateRegistrationOptions(user: LoggedInUser): Promise<any> {
        const opts: GenerateRegistrationOptionsOpts = {
            rpName: this.rpName,
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
        return await generateRegistrationOptions(opts);
    }
}
