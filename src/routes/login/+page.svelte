<script lang="ts">
	import { Button, Input, Label } from 'flowbite-svelte';
	// import SimpleWebAuthnBrowser from '@simplewebauthn/browser';
	import { startAuthentication } from '@simplewebauthn/browser';

	// const { startAuthentication } = SimpleWebAuthnBrowser;
	let username = '';
	// <button>
	// let elemBegin = '';
	// <span>/<p>/etc...
	let msgSuccess = '';
	// <span>/<p>/etc...
	let msgError = '';

	// Start authentication when the user clicks a button
	async function login() {
		// Reset success/error messages
		msgSuccess = '';
		msgError = '';

		// Get authentication options from the endpoint that calls
		// @simplewebauthn/server -> generateAuthenticationOptions()
		const resp = await fetch('api/auth/passkey/generate-authentication-options', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({username: username})
		});
		if (!resp.ok) {
			const { message } = await resp.json();
			msgError = message;
			return;
		}

		let asseResp;
		try {
			// Pass the options to the authenticator and wait for a response
			asseResp = await startAuthentication(await resp.json());
		} catch (error) {
			msgError = 'Something went wrong while starting the authentication process.';
			throw error;
		}

		// POST the response to the endpoint that calls
		// @simplewebauthn/server -> verifyAuthenticationResponse()
		const verificationResp = await fetch('api/auth/passkey/verify-authentication', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(asseResp)
		});

		// Wait for the results of verification
		const verificationJSON = await verificationResp.json();

		// Show UI appropriate for the `verified` status
		if (verificationJSON && verificationJSON.verified) {
			msgSuccess = 'Success!';
		} else {
			msgError = `Oh no, something went wrong! Response: <pre>${JSON.stringify(
				verificationJSON
			)}</pre>`;
		}
	}
</script>

<Input type="text" name="username" placeholder="" autocomplete="webauthn" bind:value={username}/>
<Button type="submit" color="blue" class="grow" on:click={login}>Login</Button>
<p id="success" class="text-green-600">{@html msgSuccess}</p>
<p id="error" class="text-red-600">{@html msgError}</p>
