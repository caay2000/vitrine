import { defineConfig } from './src/lib/config';

// Everything specific to your collection lives in this file.
export default defineConfig({
	title: 'Vitrine',
	description: 'A collection, one piece at a time.',
	// Interface language: 'en', 'es' or 'ca'.
	lang: 'en',
	// Fields shown on each item, in order. Every item also has a title and photos.
	// type: 'text' (one line) or 'longtext' (paragraphs).
	// private: true keeps the field out of the public site (admin only).
	fields: [
		{ key: 'description', label: 'Description', type: 'longtext' },
		{ key: 'history', label: 'History', type: 'longtext' },
		{ key: 'origin', label: 'Origin', type: 'text' },
		{ key: 'year', label: 'Year', type: 'text' },
		{ key: 'price', label: 'Price', type: 'text', private: true },
	],
});
