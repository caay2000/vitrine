// Lowercases and strips accents, so "Colección" and "coleccion" compare equal.
export function fold(text: string): string {
	return text
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase();
}
