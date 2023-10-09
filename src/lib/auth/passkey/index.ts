import { supabase } from "$lib/supabaseClient";
import {
    // Registration
    generateRegistrationOptions,
    verifyRegistrationResponse,
    // Authentication
    generateAuthenticationOptions,
    verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { isoBase64URL, isoUint8Array } from '@simplewebauthn/server/helpers';
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
    PublicKeyCredentialRequestOptionsJSON,
    PublicKeyCredentialCreationOptionsJSON,
    AuthenticatorDevice,
    RegistrationResponseJSON,
} from '@simplewebauthn/typescript-types';
import type { LoggedInUser } from './example-server.ts';

export class Passkey {

    // Human-readable title for your website
    private rpName: string;
    // A unique identifier for your website
    private rpID: string;
    // The URL at which registrations and authentications should occur
    private origin: string;

    // contructor
    constructor() {
        // TODO: Read from environment variables instead
        this.rpName = 'SimpleWebAuthn Example';
        this.rpID = 'localhost';
        this.origin = `https://${this.rpID}`;

        if (process.env.ENABLE_HTTPS) {
            this.origin = `https://${this.rpID}`;
        } else {
            const port = 5173;
            this.origin = `http://localhost:${port}`;
        }
    }

    public async getUserFromDB(loggedInUserId: string): Promise<LoggedInUser> {
        const { data, error } = await supabase.from("users")
            .select(`
                id, username,
                authenticators (
                    credentialID,
                    credentialPublicKey,
                    counter,
                    transports
                )
            `)
            .eq('id', loggedInUserId)
            .limit(1);
        
        if (error) {
            throw error;
        }

        // convert credentialID and credentialPublicKey to fits the type of AuthenticatorDevice
        data[0].authenticators.forEach((authenticator) => {
            authenticator.credentialID = isoBase64URL.toBuffer(authenticator.credentialID);
            authenticator.credentialPublicKey = isoBase64URL.toBuffer(authenticator.credentialPublicKey);
            authenticator.transports = JSON.parse(authenticator.transports);
        });

        const user: LoggedInUser = {
            id: data[0].id,
            username: data[0].username,
            devices: data[0].authenticators
        };

        return user;
    }

    public async generateRegistrationOptions(user: LoggedInUser): Promise<PublicKeyCredentialCreationOptionsJSON> {
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

    public async verifyRegistrationResponse(body: RegistrationResponseJSON, expectedChallenge: string) {
        const opts: VerifyRegistrationResponseOpts = {
            response: body,
            expectedChallenge: `${expectedChallenge}`,
            expectedOrigin: this.origin,
            expectedRPID: this.rpID,
            requireUserVerification: true,
        };
        return await verifyRegistrationResponse(opts);
    }

    public async getRegistrationResponse(request: Request): Promise<RegistrationResponseJSON> {
        const jsonData = await request.json();
        return {
            id: jsonData.id,
            rawId: jsonData.rawId,
            response: jsonData.response,
            authenticatorAttachment: jsonData.authenticatorAttachment,
            clientExtensionResults: jsonData.clientExtensionResults,
            type: jsonData.type,
        } as RegistrationResponseJSON;
    }

    private async doesDeviceExist(user: LoggedInUser, credentialID: Uint8Array): Promise<AuthenticatorDevice | undefined> {
        return user.devices.find((device) => {
            return isoUint8Array.areEqual(device.credentialID, credentialID);
        });
    }

    public async registerNewDeviceToDBIfNotExists(user: LoggedInUser, verification: VerifiedRegistrationResponse, registrationResponse: RegistrationResponseJSON): Promise<void> {
        const { verified, registrationInfo } = verification;
        if (!verified || !registrationInfo) {
            throw new Error('Registration verification failed.');
        }
        const { credentialPublicKey, credentialID, counter, credentialDeviceType, credentialBackedUp } = registrationInfo;
        
        // Register the new device to the user's account if it doesn't already exist
        const existingDevice = await this.doesDeviceExist(user, credentialID);
        if (!existingDevice) {

            const {data, error } = await supabase.from('authenticators').insert([
                {
                    user_id: user.id,
                    credentialID: isoBase64URL.fromBuffer(credentialID),
                    credentialPublicKey: isoBase64URL.fromBuffer(credentialPublicKey),
                    counter: counter,
                    transports: registrationResponse.response.transports,
                    credentialDeviceType: credentialDeviceType,
                    credentialBackedUp: credentialBackedUp,
                }
            ]);

            if (error) {
                throw error;
            }
        }
    }

    public async generateAuthenticationOptions(user: LoggedInUser): Promise<PublicKeyCredentialRequestOptionsJSON> {
        const opts: GenerateAuthenticationOptionsOpts = {
            timeout: 60000,
            allowCredentials: user.devices.map((dev) => ({
                id: dev.credentialID,
                type: 'public-key',
                transports: dev.transports,
            })),
            userVerification: 'required',
            rpID: this.rpID,
        };
    
        return await generateAuthenticationOptions(opts);
    }

    public async getAuthenticationResponse(request: Request): Promise<AuthenticationResponseJSON> {
        const jsonData = await request.json();
        return {
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
        } as AuthenticationResponseJSON;
    }

    public async verifyAuthenticationResponse(body: AuthenticationResponseJSON, expectedChallenge: string, user: LoggedInUser): Promise<VerifiedAuthenticationResponse> {
        
        // check if the authenticator is registered to the user
        let dbAuthenticator;
        const bodyCredIDBuffer = isoBase64URL.toBuffer(body.rawId);

        for (const dev of user.devices) {
            // console.log(`${isoUint8Array.toHex(dev.credentialID)} === ${isoUint8Array.toHex(bodyCredIDBuffer)} => ${isoUint8Array.areEqual(dev.credentialID, bodyCredIDBuffer)}`);
            if (isoUint8Array.areEqual(dev.credentialID, bodyCredIDBuffer)) {
                dbAuthenticator = dev;
                break;
            }
        }
        if (!dbAuthenticator) {
            throw new Error('Authenticator is not registered with this site');
        }

        // verify the authentication response
        const opts: VerifyAuthenticationResponseOpts = {
            response: body,
            expectedChallenge: `${expectedChallenge}`,
            expectedOrigin: this.origin,
            expectedRPID: this.rpID,
            authenticator: dbAuthenticator,
            requireUserVerification: true,
        };
        return await verifyAuthenticationResponse(opts);
    }

    public async updateAuthenticatorConterInDB(verification: VerifiedAuthenticationResponse): Promise<void> {
        const { authenticationInfo } = verification;

        const { data, error } = await supabase.from("authenticators")
                            .update({ counter: authenticationInfo.newCounter })
                            .eq('credentialID', authenticationInfo.credentialID);
        if (error) {
            console.error(error);
            throw error;
        }
    }
}
