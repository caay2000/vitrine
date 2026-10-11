import type { ItemInput } from './db';
import type { Field } from './settings';

// Reads the fields rendered by ItemForm.astro.
export function readItemForm(form: FormData, siteFields: Field[]): ItemInput {
	const fields: Record<string, string> = {};
	for (const field of siteFields) {
		const value = String(form.get(`field-${field.key}`) ?? '').trim();
		if (value) fields[field.key] = value;
	}
	return {
		title: String(form.get('title') ?? '').trim(),
		fields,
		tags: String(form.get('tags') ?? '')
			.split(',')
			.map((tag) => tag.trim())
			.filter(Boolean),
		published: form.get('published') !== null,
	};
}
