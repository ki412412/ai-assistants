<script lang="ts">
    import { Button, Input, Label } from 'flowbite-svelte';
	import { startRegistration } from '@simplewebauthn/browser';
	
	let username = '';
	let msgSuccess = ''
	let msgError = ''

	// Start registration when the user clicks a button
	async function register() {
		// Reset success/error messages
		msgSuccess = '';
		msgError = '';
		
		// Create a user
		const resp1 = await fetch('/api/auth/create-user', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ username })
		});
		// error handling
		if (resp1.status !== 200) {
			msgError = 'Could not create a user. Please try again.';
			return;
		}

		// GET registration options from the endpoint that calls
		// @simplewebauthn/server -> generateRegistrationOptions()
		const resp = await fetch('/api/auth/passkey/generate-registration-options');

		let attResp;
		try {
			// Pass the options to the authenticator and wait for a response
			attResp = await startRegistration(await resp.json());
		} catch (error) {
			// Some basic error handling
			if (error.name === 'InvalidStateError') {
				msgError = 'Error: Authenticator was probably already registered by user';
			} else {
				msgError = 'error';//error;
			}

			throw error;
		}

		// POST the response to the endpoint that calls
		// @simplewebauthn/server -> verifyRegistrationResponse()
		const verificationResp = await fetch('/api/auth/passkey/verify-registration', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(attResp)
		});

		// Wait for the results of verification
		const verificationJSON = await verificationResp.json();

		// Show UI appropriate for the `verified` status
		if (verificationJSON && verificationJSON.verified) {
			msgSuccess = 'Success!';
		} else {
			msgSuccess = `Oh no, something went wrong! Response: <pre>${JSON.stringify(
				verificationJSON
			)}</pre>`;
		}
	};
</script>

<Input type="text" placeholder="Satoshi Nakamoto" bind:value={username}/>
<Button type="submit" color="blue" class="grow" on:click={register}>Register</Button>
<p id="success" class="text-green-600">{@html msgSuccess}</p>
<p id="error" class="text-red-600">{@html msgError}</p>
