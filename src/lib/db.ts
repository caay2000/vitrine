import { env } from 'cloudflare:workers';
import { fold } from './text';

export interface Tag {
	slug: string;
	name: string;
}

export interface TagCount extends Tag {
	count: number;
}

export interface Item {
	id: number;
	slug: string;
	title: string;
	fields: Record<string, string>;
	tags: Tag[];
	published: boolean;
}

export interface ItemSummary extends Omit<Item, 'fields' | 'tags'> {
	cover: string | null;
}

export interface Photo {
	id: number;
	item_id: number;
	key: string;
	thumb_key: string;
	width: number;
	height: number;
}

interface ItemRow {
	id: number;
	slug: string;
	title: string;
	fields: string;
	published: number;
}

async function toItem(row: ItemRow): Promise<Item> {
	const { results: tags } = await env.DB.prepare('SELECT slug, name FROM item_tags WHERE item_id = ? ORDER BY name')
		.bind(row.id)
		.all<Tag>();
	return { ...row, fields: JSON.parse(row.fields), tags, published: row.published === 1 };
}

export interface ItemFilter {
	drafts?: boolean;
	// A tag slug: only items carrying that tag.
	tag?: string;
	// Free text: only items whose title, fields or tags contain every word.
	q?: string;
}

function filterSql({ drafts = false, tag, q }: ItemFilter): { where: string; params: string[] } {
	const conditions = [];
	const params = [];
	if (!drafts) conditions.push('i.published = 1');
	if (tag) {
		conditions.push('EXISTS (SELECT 1 FROM item_tags t WHERE t.item_id = i.id AND t.slug = ?)');
		params.push(tag);
	}
	// instr rather than LIKE: D1 rejects LIKE patterns longer than 50 bytes.
	for (const word of fold(q ?? '').split(/\s+/).filter(Boolean)) {
		conditions.push('instr(i.search, ?) > 0');
		params.push(word);
	}
	return { where: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '', params };
}

export async function listItems(
	filter: ItemFilter & { limit?: number; offset?: number } = {},
): Promise<ItemSummary[]> {
	const { where, params } = filterSql(filter);
	const { results } = await env.DB.prepare(
		`SELECT i.id, i.slug, i.title, i.published,
			(SELECT p.thumb_key FROM photos p WHERE p.item_id = i.id ORDER BY p.position, p.id LIMIT 1) AS cover
		FROM items i
		${where}
		ORDER BY i.created_at DESC, i.id DESC
		LIMIT ? OFFSET ?`,
	)
		.bind(...params, filter.limit ?? -1, filter.offset ?? 0)
		.all<Omit<ItemRow, 'fields'> & { cover: string | null }>();
	return results.map((row) => ({ ...row, published: row.published === 1 }));
}

export async function countItems(filter: ItemFilter = {}): Promise<number> {
	const { where, params } = filterSql(filter);
	const row = await env.DB.prepare(`SELECT COUNT(*) AS count FROM items i ${where}`)
		.bind(...params)
		.first<{ count: number }>();
	return row?.count ?? 0;
}

export async function getItemBySlug(slug: string): Promise<Item | null> {
	const row = await env.DB.prepare('SELECT * FROM items WHERE slug = ?').bind(slug).first<ItemRow>();
	return row ? toItem(row) : null;
}

export async function getItem(id: number): Promise<Item | null> {
	const row = await env.DB.prepare('SELECT * FROM items WHERE id = ?').bind(id).first<ItemRow>();
	return row ? toItem(row) : null;
}

// Tags in use, with how many items carry each one.
export async function listTags({ drafts = false } = {}): Promise<TagCount[]> {
	const { results } = await env.DB.prepare(
		`SELECT t.slug, MIN(t.name) AS name, COUNT(*) AS count
		FROM item_tags t JOIN items i ON i.id = t.item_id
		${drafts ? '' : 'WHERE i.published = 1'}
		GROUP BY t.slug
		ORDER BY name COLLATE NOCASE`,
	).all<TagCount>();
	return results;
}

async function setItemTags(itemId: number, names: string[]): Promise<void> {
	const tags = new Map<string, string>();
	for (const name of names) {
		const slug = slugify(name, '');
		if (slug && !tags.has(slug)) tags.set(slug, name);
	}
	// A tag that already exists keeps its current spelling, so "Porto" and "porto" stay one tag.
	const known = new Map((await listTags({ drafts: true })).map((tag) => [tag.slug, tag.name]));
	await env.DB.batch([
		env.DB.prepare('DELETE FROM item_tags WHERE item_id = ?').bind(itemId),
		...[...tags].map(([slug, name]) =>
			env.DB.prepare('INSERT INTO item_tags (item_id, slug, name) VALUES (?, ?, ?)').bind(
				itemId,
				slug,
				known.get(slug) ?? name,
			),
		),
	]);
}

function slugify(text: string, fallback = 'item'): string {
	return (
		text
			.normalize('NFD')
			.replace(/[̀-ͯ]/g, '')
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '')
			.slice(0, 80) || fallback
	);
}

async function uniqueSlug(title: string): Promise<string> {
	const base = slugify(title);
	// substr instead of LIKE: D1 rejects LIKE patterns longer than 50 bytes.
	const prefix = `${base}-`;
	const { results } = await env.DB.prepare('SELECT slug FROM items WHERE slug = ? OR substr(slug, 1, ?) = ?')
		.bind(base, prefix.length, prefix)
		.all<{ slug: string }>();
	const taken = new Set(results.map((row) => row.slug));
	if (!taken.has(base)) return base;
	let n = 2;
	while (taken.has(`${base}-${n}`)) n++;
	return `${base}-${n}`;
}

export interface ItemInput {
	title: string;
	fields: Record<string, string>;
	tags: string[];
	published: boolean;
}

function searchText(input: ItemInput): string {
	return fold([input.title, ...Object.values(input.fields), ...input.tags].join(' '));
}

export async function createItem(input: ItemInput): Promise<number> {
	const slug = await uniqueSlug(input.title);
	const result = await env.DB.prepare(
		'INSERT INTO items (slug, title, fields, published, search) VALUES (?, ?, ?, ?, ?)',
	)
		.bind(slug, input.title, JSON.stringify(input.fields), input.published ? 1 : 0, searchText(input))
		.run();
	await setItemTags(result.meta.last_row_id, input.tags);
	return result.meta.last_row_id;
}

// The slug is kept on update so public links stay stable.
export async function updateItem(id: number, input: ItemInput): Promise<void> {
	await env.DB.prepare(
		"UPDATE items SET title = ?, fields = ?, published = ?, search = ?, updated_at = datetime('now') WHERE id = ?",
	)
		.bind(input.title, JSON.stringify(input.fields), input.published ? 1 : 0, searchText(input), id)
		.run();
	await setItemTags(id, input.tags);
}

export async function deleteItem(id: number): Promise<void> {
	const photos = await listPhotos(id);
	await env.PHOTOS.delete(photos.flatMap((photo) => [photo.key, photo.thumb_key]));
	await env.DB.prepare('DELETE FROM items WHERE id = ?').bind(id).run();
}

export async function listPhotos(itemId: number): Promise<Photo[]> {
	const { results } = await env.DB.prepare('SELECT * FROM photos WHERE item_id = ? ORDER BY position, id')
		.bind(itemId)
		.all<Photo>();
	return results;
}

export async function addPhoto(
	itemId: number,
	full: File,
	thumb: File,
	width: number,
	height: number,
): Promise<void> {
	const ext = full.type === 'image/webp' ? 'webp' : 'jpg';
	const base = `items/${itemId}/${crypto.randomUUID()}`;
	const key = `${base}.${ext}`;
	const thumbKey = `${base}_t.${ext}`;
	await Promise.all([
		env.PHOTOS.put(key, full.stream(), { httpMetadata: { contentType: full.type } }),
		env.PHOTOS.put(thumbKey, thumb.stream(), { httpMetadata: { contentType: thumb.type } }),
	]);
	await env.DB.prepare(
		`INSERT INTO photos (item_id, key, thumb_key, width, height, position)
		VALUES (?, ?, ?, ?, ?, (SELECT COALESCE(MAX(position), -1) + 1 FROM photos WHERE item_id = ?))`,
	)
		.bind(itemId, key, thumbKey, width, height, itemId)
		.run();
}

export async function deletePhoto(id: number): Promise<void> {
	const photo = await env.DB.prepare('SELECT * FROM photos WHERE id = ?').bind(id).first<Photo>();
	if (!photo) return;
	await env.PHOTOS.delete([photo.key, photo.thumb_key]);
	await env.DB.prepare('DELETE FROM photos WHERE id = ?').bind(id).run();
}
