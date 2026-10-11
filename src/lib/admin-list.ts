import { countItems, listItems, type ItemSummary } from './db';

export const PAGE_SIZE = 30;

// One page of the admin list for the filters in a URL (?q=text&tag=slug&offset=n).
export async function adminPage(url: URL): Promise<{ items: ItemSummary[]; total: number; q: string; tag: string }> {
	const q = url.searchParams.get('q')?.trim() ?? '';
	const tag = url.searchParams.get('tag') ?? '';
	const offset = Math.max(0, Number(url.searchParams.get('offset')) || 0);
	const filter = { drafts: true, q, tag: tag || undefined };
	const [items, total] = await Promise.all([
		listItems({ ...filter, limit: PAGE_SIZE, offset }),
		countItems(filter),
	]);
	return { items, total, q, tag };
}
