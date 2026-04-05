import type { CollectionEntry } from 'astro:content';

type LinkedCollection = 'articles' | 'topics' | 'cases' | 'amendments' | 'current-affairs';

const collectionPaths: Record<LinkedCollection, string> = {
	articles: '/articles',
	topics: '/topics',
	cases: '/cases',
	amendments: '/amendments',
	'current-affairs': '/current-affairs',
};

type SluggedEntry = {
	data: {
		slug: string;
		title: string;
		summary?: string;
	};
};

export function getEntryHref(collection: LinkedCollection, slug: string) {
	return `${collectionPaths[collection]}/${slug}`;
}

export function resolveBySlugs<T extends SluggedEntry>(entries: T[], slugs: string[] = []) {
	const index = new Map(entries.map((entry) => [entry.data.slug, entry]));
	return slugs.map((slug) => index.get(slug)).filter(Boolean) as T[];
}

export function uniqueBySlug<T extends SluggedEntry>(entries: T[]) {
	const seen = new Set<string>();
	return entries.filter((entry) => {
		if (seen.has(entry.data.slug)) {
			return false;
		}
		seen.add(entry.data.slug);
		return true;
	});
}

export function filterByRelationship<T extends { data: Record<string, unknown> }>(
	entries: T[],
	field: string,
	slug: string,
) {
	return entries.filter((entry) => {
		const value = entry.data[field];
		return Array.isArray(value) && value.includes(slug);
	});
}

export function filterByAnyRelationship<T extends { data: Record<string, unknown> }>(
	entries: T[],
	field: string,
	slugs: string[] = [],
) {
	if (slugs.length === 0) {
		return [];
	}

	return entries.filter((entry) => {
		const value = entry.data[field];
		return Array.isArray(value) && slugs.some((slug) => value.includes(slug));
	});
}

export function sortArticles(entries: CollectionEntry<'articles'>[]) {
	return [...entries].sort((left, right) => left.data.number - right.data.number);
}

export function sortByTitle<T extends { data: { title: string } }>(entries: T[]) {
	return [...entries].sort((left, right) => left.data.title.localeCompare(right.data.title));
}

export function sortByDateDesc<
	T extends {
		data: Record<string, unknown>;
	},
>(entries: T[], field: string) {
	return [...entries].sort((left, right) => {
		const leftValue = left.data[field];
		const rightValue = right.data[field];
		if (!(leftValue instanceof Date) || !(rightValue instanceof Date)) {
			return 0;
		}
		return rightValue.getTime() - leftValue.getTime();
	});
}

export function formatDate(value: Date) {
	return new Intl.DateTimeFormat('en-IN', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
	}).format(value);
}

export function titleCaseStatus(status: 'ongoing' | 'resolved' | 'archived') {
	return status.charAt(0).toUpperCase() + status.slice(1);
}

export function ordinal(value: number) {
	const mod10 = value % 10;
	const mod100 = value % 100;

	if (mod10 === 1 && mod100 !== 11) {
		return `${value}st`;
	}

	if (mod10 === 2 && mod100 !== 12) {
		return `${value}nd`;
	}

	if (mod10 === 3 && mod100 !== 13) {
		return `${value}rd`;
	}

	return `${value}th`;
}
