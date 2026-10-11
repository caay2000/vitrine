import { env } from 'cloudflare:workers';

// Set with `wrangler secret put ADMIN_PASSWORD` (or in .dev.vars for local development).
function adminPassword(): string | undefined {
	return (env as { ADMIN_PASSWORD?: string }).ADMIN_PASSWORD || undefined;
}

export function hasAdminPassword(): boolean {
	return adminPassword() !== undefined;
}

async function sha256(text: string): Promise<Uint8Array> {
	return new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)));
}

// Hashing both sides first makes the comparison independent of the password length.
export async function checkPassword(candidate: string): Promise<boolean> {
	const expected = adminPassword();
	if (expected === undefined) return false;
	const [a, b] = await Promise.all([sha256(candidate), sha256(expected)]);
	let diff = 0;
	for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
	return diff === 0;
}
