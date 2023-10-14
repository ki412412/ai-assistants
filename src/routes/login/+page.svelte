<script lang="ts">
	import { Card, Button, Label, Input, Checkbox } from 'flowbite-svelte';
	// import SimpleWebAuthnBrowser from '@simplewebauthn/browser';
	import { startAuthentication } from '@simplewebauthn/browser';
	import { goto } from '$app/navigation';
	import { NavigatorLockAcquireTimeoutError } from '@supabase/supabase-js';

	let username = '';
	let msgSuccess = '';
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
			body: JSON.stringify({ username: username })
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
			goto('/');
		} else {
			msgError = `Oh no, something went wrong! Response: <pre>${JSON.stringify(
				verificationJSON
			)}</pre>`;
		}
	}
</script>

<Card class="w-full max-w-md m-auto">
	<form class="flex flex-col space-y-6">
		<h3 class="text-xl font-medium text-gray-900 dark:text-white">Welcome to AI Assistant🤖!</h3>
		<Label class="space-y-2">
			<span>Username</span>
			<Input type="text" name="username" bind:value={username} placeholder="Satoshi Nakamoto" required autocomplete="webauthn" />
			{#if msgError}
				<p id="error" class="text-red-600">{@html msgError}</p>
			{/if}
		</Label>
		
		<Button type="button" class="w-full" on:click={login}>Login with Passkey</Button>
		<div class="text-sm font-medium text-gray-500 dark:text-gray-300">
			Not registered? Ask <a href="https://github.com/ki412412" target="_blank" class="text-primary-700 hover:underline dark:text-primary-500">me!</a>
		</div>
	</form>
</Card>
