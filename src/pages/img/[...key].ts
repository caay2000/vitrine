import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

// Serves photos straight from R2. Keys are random and never reused, so responses can be cached forever.
export const GET: APIRoute = async ({ params }) => {
	const object = await env.PHOTOS.get(params.key!);
	if (!object) return new Response(null, { status: 404 });

	const headers = new Headers();
	object.writeHttpMetadata(headers);
	headers.set('etag', object.httpEtag);
	headers.set('cache-control', 'public, max-age=31536000, immutable');
	return new Response(object.body, { headers });
};
