import type { CollectionEntry } from 'astro:content';

type LinkedCollection =
	| 'articles'
	| 'parts'
	| 'schedules'
	| 'topics'
	| 'institutions'
	| 'cases'
	| 'glossary'
	| 'amendments'
	| 'current-affairs'
	| 'sources';

const collectionPaths: Record<LinkedCollection, string> = {
	articles: '/articles',
	parts: '/parts',
	schedules: '/schedules',
	topics: '/topics',
	institutions: '/institutions',
	cases: '/cases',
	glossary: '/glossary',
	amendments: '/amendments',
	'current-affairs': '/current-affairs',
	sources: '/sources',
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
	return [...entries].sort((left, right) => compareArticleNumbers(left.data.number, right.data.number));
}

export function parseArticleNumber(value: string) {
	const normalized = String(value).trim().toUpperCase();
	const match = normalized.match(/^(\d+)([A-Z]*)$/);

	if (!match) {
		return {
			base: Number.MAX_SAFE_INTEGER,
			suffix: normalized,
		};
	}

	return {
		base: Number.parseInt(match[1], 10),
		suffix: match[2] ?? '',
	};
}

export function compareArticleNumbers(left: string, right: string) {
	const leftKey = parseArticleNumber(left);
	const rightKey = parseArticleNumber(right);

	if (leftKey.base !== rightKey.base) {
		return leftKey.base - rightKey.base;
	}

	if (leftKey.suffix === rightKey.suffix) {
		return 0;
	}

	if (!leftKey.suffix) {
		return -1;
	}

	if (!rightKey.suffix) {
		return 1;
	}

	return leftKey.suffix.localeCompare(rightKey.suffix);
}

export function sortByNumericField<T extends { data: Record<string, unknown> }>(entries: T[], field: string) {
	return [...entries].sort((left, right) => {
		const leftValue = left.data[field];
		const rightValue = right.data[field];
		if (typeof leftValue !== 'number' || typeof rightValue !== 'number') {
			return 0;
		}
		return leftValue - rightValue;
	});
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

export function sortByDateAsc<T extends { data: Record<string, unknown> }>(entries: T[], field: string) {
	return [...entries].sort((left, right) => {
		const leftValue = left.data[field];
		const rightValue = right.data[field];
		if (!(leftValue instanceof Date) || !(rightValue instanceof Date)) {
			return 0;
		}
		return leftValue.getTime() - rightValue.getTime();
	});
}

export function titleCaseStatus(status: 'ongoing' | 'resolved' | 'archived') {
	return status.charAt(0).toUpperCase() + status.slice(1);
}

export function humanizeToken(value: string) {
	return value
		.split('-')
		.map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
		.join(' ');
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
