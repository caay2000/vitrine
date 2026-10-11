// Lowercases and strips accents, so "Colección" and "coleccion" compare equal.
export function fold(text: string): string {
	return text
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase();
}

// "Tram nº 12 (Barcelona)" -> "tram-n-12-barcelona". Used for URLs and identifiers.
export function slugify(text: string, fallback = 'item'): string {
	return (
		fold(text)
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '')
			.slice(0, 80) || fallback
	);
}
