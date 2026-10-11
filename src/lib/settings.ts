import { env } from 'cloudflare:workers';
import { strings, type Lang } from './i18n';
import { slugify } from './text';

export interface Field {
	// Identifies the field in stored items; never changes once created.
	key: string;
	label: string;
	// 'text' is one line, 'longtext' is paragraphs.
	type: 'text' | 'longtext';
	// Private fields are only visible in the admin panel.
	private: boolean;
}

export interface Site {
	title: string;
	description: string;
	lang: Lang;
	// Fields of each item, in display order. Every item also has a title, photos and tags.
	fields: Field[];
}

// What a freshly deployed site looks like until its owner changes the settings.
export const defaultSite: Site = {
	title: 'Vitrine',
	description: 'A collection, one piece at a time.',
	lang: 'en',
	fields: [
		{ key: 'description', label: 'Description', type: 'longtext', private: false },
		{ key: 'history', label: 'History', type: 'longtext', private: false },
		{ key: 'origin', label: 'Origin', type: 'text', private: false },
		{ key: 'year', label: 'Year', type: 'text', private: false },
		{ key: 'price', label: 'Price', type: 'text', private: true },
	],
};

export async function getSite(): Promise<Site> {
	const row = await env.DB.prepare("SELECT value FROM settings WHERE key = 'site'").first<{ value: string }>();
	return row ? { ...defaultSite, ...JSON.parse(row.value) } : defaultSite;
}

export async function saveSite(site: Site): Promise<void> {
	await env.DB.prepare(
		"INSERT INTO settings (key, value) VALUES ('site', ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value",
	)
		.bind(JSON.stringify(site))
		.run();
}

// Reads the form rendered by the settings page. Fields arrive as parallel lists, one entry per row;
// rows left without a name are dropped, which is also how a field is removed.
export function readSettingsForm(form: FormData, current: Site): Site {
	const lang = String(form.get('lang'));
	const keys = form.getAll('field-key').map(String);
	const labels = form.getAll('field-label').map(String);
	const types = form.getAll('field-type').map(String);
	const visibility = form.getAll('field-visibility').map(String);

	const fields: Field[] = [];
	const used = new Set<string>();
	labels.forEach((rawLabel, i) => {
		const label = rawLabel.trim();
		if (!label) return;
		// An existing field keeps its key, so renaming it does not detach the content already saved.
		let key = /^[a-z0-9-]+$/.test(keys[i] ?? '') ? keys[i] : slugify(label, 'field');
		for (let n = 2; used.has(key); n++) key = `${key.replace(/-\d+$/, '')}-${n}`;
		used.add(key);
		fields.push({
			key,
			label,
			type: types[i] === 'longtext' ? 'longtext' : 'text',
			private: visibility[i] === 'private',
		});
	});

	return {
		title: String(form.get('title') ?? '').trim() || current.title,
		description: String(form.get('description') ?? '').trim(),
		lang: lang in strings ? (lang as Lang) : current.lang,
		fields,
	};
}
