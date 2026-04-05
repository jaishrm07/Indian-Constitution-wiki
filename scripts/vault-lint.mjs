import { readdir } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

const mappings = [
	{ label: 'articles', canonical: 'src/content/articles', research: 'knowledge-vault/entities/articles' },
	{ label: 'parts', canonical: 'src/content/parts', research: 'knowledge-vault/entities/parts' },
	{ label: 'schedules', canonical: 'src/content/schedules', research: 'knowledge-vault/entities/schedules' },
	{ label: 'institutions', canonical: 'src/content/institutions', research: 'knowledge-vault/entities/institutions' },
	{ label: 'amendments', canonical: 'src/content/amendments', research: 'knowledge-vault/entities/amendments' },
	{ label: 'cases', canonical: 'src/content/cases', research: 'knowledge-vault/entities/cases' },
	{ label: 'topics', canonical: 'src/content/topics', research: 'knowledge-vault/entities/topics' },
	{ label: 'current-affairs', canonical: 'src/content/current-affairs', research: 'knowledge-vault/issues' },
	{ label: 'sources', canonical: 'src/content/sources', research: 'knowledge-vault/sources' },
];

async function readSlugs(dirPath, extensions = new Set(['.md'])) {
	const entries = await readdir(path.join(root, dirPath), { withFileTypes: true });
	return entries
		.filter((entry) => entry.isFile())
		.map((entry) => entry.name)
		.filter((name) => extensions.has(path.extname(name)))
		.filter((name) => name.toLowerCase() !== 'readme.md')
		.map((name) => name.replace(path.extname(name), ''))
		.sort();
}

function difference(left, right) {
	const rightSet = new Set(right);
	return left.filter((item) => !rightSet.has(item));
}

let hasGap = false;

for (const mapping of mappings) {
	const canonicalSlugs = await readSlugs(mapping.canonical);
	const researchSlugs = await readSlugs(mapping.research);

	const missingResearch = difference(canonicalSlugs, researchSlugs);
	const orphanResearch = difference(researchSlugs, canonicalSlugs);

	if (missingResearch.length > 0) {
		hasGap = true;
	}

	console.log(`\n[${mapping.label}]`);
	console.log(`canonical: ${canonicalSlugs.length}`);
	console.log(`research:  ${researchSlugs.length}`);
	console.log(`coverage:  ${canonicalSlugs.length === 0 ? 'n/a' : `${Math.round((researchSlugs.length / canonicalSlugs.length) * 100)}%`}`);

	if (missingResearch.length > 0) {
		console.log(`missing research notes (${missingResearch.length}): ${missingResearch.join(', ')}`);
	}

	if (orphanResearch.length > 0) {
		console.log(`orphan research notes (${orphanResearch.length}): ${orphanResearch.join(', ')}`);
	}
}

if (hasGap) {
	console.log('\nVault lint found missing research coverage.');
	process.exitCode = 1;
} else {
	console.log('\nVault lint passed.');
}
