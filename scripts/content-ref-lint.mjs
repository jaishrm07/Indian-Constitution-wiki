import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import yaml from 'js-yaml';

const root = process.cwd();
const contentRoot = path.join(root, 'src/content');

const collections = [
	'articles',
	'parts',
	'schedules',
	'cases',
	'topics',
	'institutions',
	'glossary',
	'amendments',
	'timeline',
	'current-affairs',
	'sources',
	'edges',
];

const relationRules = {
	articles: [
		{ field: 'partSlug', target: 'parts', mode: 'single' },
		{ field: 'relatedArticles', target: 'articles' },
		{ field: 'schedules', target: 'schedules' },
		{ field: 'topics', target: 'topics' },
		{ field: 'sources', target: 'sources' },
	],
	parts: [
		{ field: 'articleSlugs', target: 'articles' },
		{ field: 'topics', target: 'topics' },
		{ field: 'sources', target: 'sources' },
	],
	schedules: [
		{ field: 'relatedArticles', target: 'articles' },
		{ field: 'topics', target: 'topics' },
		{ field: 'sources', target: 'sources' },
	],
	cases: [
		{ field: 'articles', target: 'articles' },
		{ field: 'parts', target: 'parts' },
		{ field: 'schedules', target: 'schedules' },
		{ field: 'topics', target: 'topics' },
		{ field: 'sources', target: 'sources' },
	],
	topics: [
		{ field: 'parts', target: 'parts' },
		{ field: 'schedules', target: 'schedules' },
		{ field: 'sources', target: 'sources' },
	],
	institutions: [
		{ field: 'articles', target: 'articles' },
		{ field: 'parts', target: 'parts' },
		{ field: 'topics', target: 'topics' },
		{ field: 'cases', target: 'cases' },
		{ field: 'currentAffairs', target: 'current-affairs' },
		{ field: 'sources', target: 'sources' },
	],
	glossary: [
		{ field: 'relatedArticles', target: 'articles' },
		{ field: 'relatedParts', target: 'parts' },
		{ field: 'relatedSchedules', target: 'schedules' },
		{ field: 'topics', target: 'topics' },
		{ field: 'cases', target: 'cases' },
		{ field: 'sources', target: 'sources' },
	],
	amendments: [
		{ field: 'affectedArticles', target: 'articles' },
		{ field: 'affectedParts', target: 'parts' },
		{ field: 'affectedSchedules', target: 'schedules' },
		{ field: 'topics', target: 'topics' },
		{ field: 'sources', target: 'sources' },
		{
			field: 'compareHighlights',
			nested: [
				{ field: 'articleRefs', target: 'articles' },
				{ field: 'partRefs', target: 'parts' },
				{ field: 'scheduleRefs', target: 'schedules' },
			],
		},
	],
	timeline: [
		{ field: 'articleRefs', target: 'articles' },
		{ field: 'partRefs', target: 'parts' },
		{ field: 'scheduleRefs', target: 'schedules' },
		{ field: 'sources', target: 'sources' },
		{ field: 'relatedSlug', targetField: 'relatedCollection', mode: 'dynamic-single' },
	],
	'current-affairs': [
		{ field: 'articles', target: 'articles' },
		{ field: 'parts', target: 'parts' },
		{ field: 'schedules', target: 'schedules' },
		{ field: 'cases', target: 'cases' },
		{ field: 'topics', target: 'topics' },
		{ field: 'institutions', target: 'institutions' },
		{ field: 'sources', target: 'sources' },
	],
	sources: [],
	edges: [
		{ field: 'fromSlug', targetField: 'fromCollection', mode: 'dynamic-single' },
		{ field: 'toSlug', targetField: 'toCollection', mode: 'dynamic-single' },
		{ field: 'sources', target: 'sources' },
	],
};

const entriesByCollection = new Map();
const slugsByCollection = new Map();
const missing = [];

await main();

async function main() {
	for (const collection of collections) {
		const entries = await loadCollection(collection);
		entriesByCollection.set(collection, entries);
		slugsByCollection.set(
			collection,
			new Set(entries.map((entry) => entry.data.slug).filter(Boolean)),
		);
	}

	for (const collection of collections) {
		for (const entry of entriesByCollection.get(collection) ?? []) {
			checkEntry(collection, entry);
		}
	}

	if (missing.length > 0) {
		console.error('Content reference lint failed.\n');
		for (const record of missing) {
			console.error(
				`${record.collection}/${record.file}: ${record.field} -> ${record.targetCollection}/${record.slug}`,
			);
		}
		process.exit(1);
	}

	console.log('Content reference lint passed.');
}

async function loadCollection(collection) {
	const directory = path.join(contentRoot, collection);
	const files = (await readdir(directory)).filter((file) => file.endsWith('.md')).sort();
	return Promise.all(
		files.map(async (file) => ({
			file,
			data: await loadFrontmatter(path.join(directory, file)),
		})),
	);
}

async function loadFrontmatter(filePath) {
	const raw = await readFile(filePath, 'utf8');
	if (!raw.startsWith('---\n')) {
		return {};
	}

	const end = raw.indexOf('\n---\n', 4);
	if (end === -1) {
		return {};
	}

	return yaml.load(raw.slice(4, end)) ?? {};
}

function checkEntry(collection, entry) {
	const rules = relationRules[collection] ?? [];

	for (const rule of rules) {
		if (rule.mode === 'single') {
			checkValues(collection, entry.file, rule.field, rule.target, optionalSingle(entry.data[rule.field]));
			continue;
		}

		if (rule.mode === 'dynamic-single') {
			const targetCollection = entry.data[rule.targetField];
			if (!targetCollection || !collections.includes(targetCollection)) {
				continue;
			}
			checkValues(collection, entry.file, rule.field, targetCollection, optionalSingle(entry.data[rule.field]));
			continue;
		}

		if (rule.nested) {
			for (const [index, nestedEntry] of (entry.data[rule.field] ?? []).entries()) {
				for (const nestedRule of rule.nested) {
					checkValues(
						collection,
						entry.file,
						`${rule.field}[${index}].${nestedRule.field}`,
						nestedRule.target,
						arrayValues(nestedEntry?.[nestedRule.field]),
					);
				}
			}
			continue;
		}

		checkValues(collection, entry.file, rule.field, rule.target, arrayValues(entry.data[rule.field]));
	}
}

function checkValues(collection, file, field, targetCollection, values) {
	const known = slugsByCollection.get(targetCollection);
	if (!known) {
		return;
	}

	for (const slug of values) {
		if (!known.has(slug)) {
			missing.push({ collection, file, field, targetCollection, slug });
		}
	}
}

function arrayValues(value) {
	return Array.isArray(value) ? value.filter(Boolean) : [];
}

function optionalSingle(value) {
	return typeof value === 'string' && value ? [value] : [];
}
