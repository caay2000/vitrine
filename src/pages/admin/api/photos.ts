import type { APIRoute } from 'astro';
import { addPhoto, getItem } from '../../../lib/db';

const ALLOWED_TYPES = ['image/webp', 'image/jpeg'];
// Photos arrive already resized by the browser, so anything bigger than this is not ours.
const MAX_BYTES = 5 * 1024 * 1024;

function isValidImage(value: unknown): value is File {
	return value instanceof File && ALLOWED_TYPES.includes(value.type) && value.size > 0 && value.size <= MAX_BYTES;
}

export const POST: APIRoute = async ({ request }) => {
	const form = await request.formData();
	const itemId = Number(form.get('item_id'));
	const width = Number(form.get('width'));
	const height = Number(form.get('height'));
	const full = form.get('full');
	const thumb = form.get('thumb');

	if (!isValidImage(full) || !isValidImage(thumb) || !(width > 0) || !(height > 0)) {
		return new Response('Invalid photo', { status: 400 });
	}
	if (!(await getItem(itemId))) return new Response('Item not found', { status: 404 });

	await addPhoto(itemId, full, thumb, Math.round(width), Math.round(height));
	return new Response(null, { status: 204 });
};
