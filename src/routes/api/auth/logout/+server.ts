import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

/**
 * Logout
 */
export const DELETE: RequestHandler = async ({ cookies }) => {
    // Clear the session
    cookies.delete('__session', { path: '/' });

    return json({ status: 'signedOut' });
}