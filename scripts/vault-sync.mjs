import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import yaml from 'js-yaml';

const root = process.cwd();
const today = new Date().toISOString().slice(0, 10);

const collectionConfigs = [
	{
		label: 'articles',
		canonicalDir: 'src/content/articles',
		researchDir: 'knowledge-vault/entities/articles',
		type: 'article',
		render: renderArticle,
	},
	{
		label: 'parts',
		canonicalDir: 'src/content/parts',
		researchDir: 'knowledge-vault/entities/parts',
		type: 'part',
		render: renderPart,
	},
	{
		label: 'schedules',
		canonicalDir: 'src/content/schedules',
		researchDir: 'knowledge-vault/entities/schedules',
		type: 'schedule',
		render: renderSchedule,
	},
	{
		label: 'amendments',
		canonicalDir: 'src/content/amendments',
		researchDir: 'knowledge-vault/entities/amendments',
		type: 'amendment',
		render: renderAmendment,
	},
	{
		label: 'cases',
		canonicalDir: 'src/content/cases',
		researchDir: 'knowledge-vault/entities/cases',
		type: 'case',
		render: renderCase,
	},
	{
		label: 'topics',
		canonicalDir: 'src/content/topics',
		researchDir: 'knowledge-vault/entities/topics',
		type: 'topic',
		render: renderTopic,
	},
	{
		label: 'institutions',
		canonicalDir: 'src/content/institutions',
		researchDir: 'knowledge-vault/entities/institutions',
		type: 'institution',
		render: renderInstitution,
	},
	{
		label: 'current-affairs',
		canonicalDir: 'src/content/current-affairs',
		researchDir: 'knowledge-vault/issues',
		type: 'issue',
		render: renderIssue,
	},
	{
		label: 'sources',
		canonicalDir: 'src/content/sources',
		researchDir: 'knowledge-vault/sources',
		type: 'source',
		render: renderSource,
	},
];

function absolute(relativePath) {
	return path.join(root, relativePath);
}

function stripMarkdown(markdown) {
	return markdown
		.replace(/^#{1,6}\s+/gm, '')
		.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
		.replace(/[*_`>-]/g, '')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}

function ensureArray(value) {
	return Array.isArray(value) ? value : [];
}

function wikiLink(basePath, slug, label, collectionPath) {
	if (!slug) return null;
	return `[[${path.posix.join(basePath, collectionPath, slug)}|${label ?? slug}]]`;
}

function relEntity(slug, collection, label) {
	const map = {
		articles: '../articles',
		parts: '../parts',
		schedules: '../schedules',
		amendments: '../amendments',
		cases: '../cases',
		topics: '../topics',
	};
	return wikiLink('', slug, label, map[collection]);
}

function relIssue(slug, label) {
	return wikiLink('', slug, label, '../issues');
}

function relSource(slug, label) {
	return wikiLink('', slug, label, '../sources');
}

function formatList(items) {
	const filtered = items.filter(Boolean);
	return filtered.length > 0 ? filtered : [];
}

async function parseEntry(filePath) {
	const raw = await readFile(filePath, 'utf8');
	const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
	if (!match) {
		throw new Error(`Missing frontmatter in ${filePath}`);
	}
	const [, frontmatter, body] = match;
	return {
		data: yaml.load(frontmatter),
		body: body.trim(),
	};
}

async function readCollection(relativeDir) {
	const dir = absolute(relativeDir);
	const entries = await readdir(dir, { withFileTypes: true });
	const records = [];

	for (const entry of entries) {
		if (!entry.isFile() || path.extname(entry.name) !== '.md') continue;
		const slug = entry.name.replace(/\.md$/, '');
		const parsed = await parseEntry(path.join(dir, entry.name));
		records.push({ slug, ...parsed });
	}

	return records;
}

function buildMaps(collections) {
	const byCollection = Object.fromEntries(
		Object.entries(collections).map(([label, entries]) => [label, new Map(entries.map((entry) => [entry.data.slug, entry]))]),
	);

	const sourceUrl = new Map(collections.sources.map((entry) => [entry.data.slug, entry.data.url]));
	const topicTitle = new Map(collections.topics.map((entry) => [entry.data.slug, entry.data.title]));
	const institutionTitle = new Map(collections.institutions.map((entry) => [entry.data.slug, entry.data.title]));
	const articleTitle = new Map(collections.articles.map((entry) => [entry.data.slug, entry.data.title]));
	const caseTitle = new Map(collections.cases.map((entry) => [entry.data.slug, entry.data.title]));
	const partTitle = new Map(collections.parts.map((entry) => [entry.data.slug, entry.data.title]));
	const scheduleTitle = new Map(collections.schedules.map((entry) => [entry.data.slug, entry.data.title]));
	const amendmentTitle = new Map(collections.amendments.map((entry) => [entry.data.slug, entry.data.title]));
	const issueTitle = new Map(collections['current-affairs'].map((entry) => [entry.data.slug, entry.data.title]));

	return {
		byCollection,
		sourceUrl,
		topicTitle,
		institutionTitle,
		articleTitle,
		caseTitle,
		partTitle,
		scheduleTitle,
		amendmentTitle,
		issueTitle,
	};
}

function reverseMatches(entries, field, targetSlug) {
	return entries.filter((entry) => ensureArray(entry.data[field]).includes(targetSlug));
}

function yamlBlock(data) {
	return `---\n${yaml.dump(data, { lineWidth: 1000 }).trim()}\n---`;
}

function section(title, content) {
	return `## ${title}\n\n${content.trim()}`;
}

function bulletList(items) {
	return items.length > 0 ? items.map((item) => `- ${item}`).join('\n') : '- None yet';
}

function trimParagraphs(text) {
	return stripMarkdown(text).replace(/\n+/g, '\n').trim();
}

function renderArticle(entry, context) {
	const relatedCases = reverseMatches(context.collections.cases, 'articles', entry.data.slug).map((item) =>
		relEntity(item.data.slug, 'cases', item.data.title),
	);
	const relatedTopics = ensureArray(entry.data.topics).map((slug) => relEntity(slug, 'topics', context.maps.topicTitle.get(slug)));
	const relatedIssues = reverseMatches(context.collections['current-affairs'], 'articles', entry.data.slug).map((item) =>
		relIssue(item.data.slug, item.data.title),
	);
	const relatedParts = entry.data.partSlug ? [relEntity(entry.data.partSlug, 'parts', entry.data.part)] : [];
	const relatedSchedules = ensureArray(entry.data.schedules).map((slug) =>
		relEntity(slug, 'schedules', context.maps.scheduleTitle.get(slug)),
	);
	const sourceUrls = ensureArray(entry.data.sources).map((slug) => context.maps.sourceUrl.get(slug)).filter(Boolean);

	return noteTemplate(
		{
			type: 'article',
			slug: entry.data.slug,
			title: entry.data.title,
			aliases: [],
			constitution_refs: [],
			related_parts: formatList(relatedParts),
			related_schedules: formatList(relatedSchedules),
			related_cases: formatList(relatedCases),
			related_topics: formatList(relatedTopics),
			related_issues: formatList(relatedIssues),
			official_sources: sourceUrls,
			secondary_sources: [],
			status: 'seeded',
			last_reviewed: today,
		},
		[
			section('Summary', entry.data.summary),
			section('Official text', entry.data.officialText || 'Refer to the official Constitution text and extract the exact wording before treating this note as reviewed.'),
			section('Plain-English meaning', entry.data.plainEnglish),
			section('Canonical site note', trimParagraphs(entry.body || '')),
			section('Linked cases', bulletList(relatedCases)),
			section('Current relevance', bulletList(relatedIssues)),
			section('Open questions', '- Which clause-level or doctrine-level sub-notes should branch from this Article?'),
		],
	);
}

function renderPart(entry, context) {
	const relatedTopics = ensureArray(entry.data.topics).map((slug) => relEntity(slug, 'topics', context.maps.topicTitle.get(slug)));
	const relatedArticles = ensureArray(entry.data.articleSlugs).map((slug) => relEntity(slug, 'articles', context.maps.articleTitle.get(slug)));
	const sourceUrls = ensureArray(entry.data.sources).map((slug) => context.maps.sourceUrl.get(slug)).filter(Boolean);

	return noteTemplate(
		{
			type: 'part',
			slug: entry.data.slug,
			title: entry.data.title,
			aliases: [entry.data.code],
			constitution_refs: formatList(relatedArticles),
			related_topics: formatList(relatedTopics),
			official_sources: sourceUrls,
			secondary_sources: [],
			status: 'seeded',
			last_reviewed: today,
		},
		[
			section('Summary', entry.data.summary),
			section('Official role', entry.data.intro),
			section('Reading path', bulletList(relatedArticles)),
			section('Canonical site note', trimParagraphs(entry.body || '')),
			section('Open questions', '- Which disputes and doctrines should be anchored directly to this Part?'),
		],
	);
}

function renderSchedule(entry, context) {
	const relatedTopics = ensureArray(entry.data.topics).map((slug) => relEntity(slug, 'topics', context.maps.topicTitle.get(slug)));
	const relatedArticles = ensureArray(entry.data.relatedArticles).map((slug) =>
		relEntity(slug, 'articles', context.maps.articleTitle.get(slug)),
	);
	const sourceUrls = ensureArray(entry.data.sources).map((slug) => context.maps.sourceUrl.get(slug)).filter(Boolean);

	return noteTemplate(
		{
			type: 'schedule',
			slug: entry.data.slug,
			title: entry.data.title,
			aliases: [`Schedule ${entry.data.number}`],
			constitution_refs: formatList(relatedArticles),
			related_topics: formatList(relatedTopics),
			official_sources: sourceUrls,
			secondary_sources: [],
			status: 'seeded',
			last_reviewed: today,
		},
		[
			section('Summary', entry.data.summary),
			section('Why it matters', entry.data.intro),
			section('Linked provisions', bulletList(relatedArticles)),
			section('Canonical site note', trimParagraphs(entry.body || '')),
			section('Open questions', '- Which institutional or doctrinal disputes should be mapped directly to this Schedule?'),
		],
	);
}

function renderAmendment(entry, context) {
	const affectedArticles = ensureArray(entry.data.affectedArticles).map((slug) =>
		relEntity(slug, 'articles', context.maps.articleTitle.get(slug)),
	);
	const affectedParts = ensureArray(entry.data.affectedParts).map((slug) =>
		relEntity(slug, 'parts', context.maps.partTitle.get(slug)),
	);
	const affectedSchedules = ensureArray(entry.data.affectedSchedules).map((slug) =>
		relEntity(slug, 'schedules', context.maps.scheduleTitle.get(slug)),
	);
	const relatedTopics = ensureArray(entry.data.topics).map((slug) => relEntity(slug, 'topics', context.maps.topicTitle.get(slug)));
	const sourceUrls = ensureArray(entry.data.sources).map((slug) => context.maps.sourceUrl.get(slug)).filter(Boolean);

	return noteTemplate(
		{
			type: 'amendment',
			slug: entry.data.slug,
			title: entry.data.title,
			number: entry.data.number,
			year: entry.data.year,
			constitution_refs: formatList([...affectedArticles, ...affectedParts, ...affectedSchedules]),
			related_topics: formatList(relatedTopics),
			official_sources: sourceUrls,
			secondary_sources: [],
			status: 'seeded',
			last_reviewed: today,
		},
		[
			section('Summary', entry.data.summary),
			section('What changed', entry.data.whatChanged),
			section('Affected provisions', bulletList([...affectedArticles, ...affectedParts, ...affectedSchedules])),
			section('Canonical site note', trimParagraphs(entry.body || '')),
			section('Open questions', '- Which bill-history or doctrinal follow-up notes should be attached to this amendment?'),
		],
	);
}

function renderCase(entry, context) {
	const relatedArticles = ensureArray(entry.data.articles).map((slug) =>
		relEntity(slug, 'articles', context.maps.articleTitle.get(slug)),
	);
	const relatedParts = ensureArray(entry.data.parts).map((slug) => relEntity(slug, 'parts', context.maps.partTitle.get(slug)));
	const relatedSchedules = ensureArray(entry.data.schedules).map((slug) =>
		relEntity(slug, 'schedules', context.maps.scheduleTitle.get(slug)),
	);
	const relatedTopics = ensureArray(entry.data.topics).map((slug) => relEntity(slug, 'topics', context.maps.topicTitle.get(slug)));
	const sourceUrls = ensureArray(entry.data.sources).map((slug) => context.maps.sourceUrl.get(slug)).filter(Boolean);

	return noteTemplate(
		{
			type: 'case',
			slug: entry.data.slug,
			title: entry.data.title,
			citation: entry.data.citation,
			date: `${entry.data.year}-01-01`,
			court: entry.data.court,
			constitution_refs: formatList([...relatedArticles, ...relatedParts, ...relatedSchedules]),
			related_topics: formatList(relatedTopics),
			related_cases: [],
			official_sources: sourceUrls,
			secondary_sources: [],
			status: 'seeded',
			last_reviewed: today,
		},
		[
			section('Summary', entry.data.summary),
			section('Facts and issue', entry.data.issue),
			section('Holding', entry.data.holding),
			section('Constitutional significance', entry.data.significance),
			section('Related provisions', bulletList([...relatedArticles, ...relatedParts, ...relatedSchedules])),
			section('Canonical site note', trimParagraphs(entry.body || '')),
			section('Open questions', '- Which later cases should be linked as part of this case line?'),
		],
	);
}

function renderTopic(entry, context) {
	const relatedParts = ensureArray(entry.data.parts).map((slug) => relEntity(slug, 'parts', context.maps.partTitle.get(slug)));
	const relatedSchedules = ensureArray(entry.data.schedules).map((slug) =>
		relEntity(slug, 'schedules', context.maps.scheduleTitle.get(slug)),
	);
	const relatedCases = reverseMatches(context.collections.cases, 'topics', entry.data.slug).map((item) =>
		relEntity(item.data.slug, 'cases', item.data.title),
	);
	const relatedIssues = reverseMatches(context.collections['current-affairs'], 'topics', entry.data.slug).map((item) =>
		relIssue(item.data.slug, item.data.title),
	);
	const relatedAmendments = reverseMatches(context.collections.amendments, 'topics', entry.data.slug).map((item) =>
		relEntity(item.data.slug, 'amendments', item.data.title),
	);
	const sourceUrls = ensureArray(entry.data.sources).map((slug) => context.maps.sourceUrl.get(slug)).filter(Boolean);

	return noteTemplate(
		{
			type: 'topic',
			slug: entry.data.slug,
			title: entry.data.title,
			aliases: [],
			constitution_refs: formatList([...relatedParts, ...relatedSchedules]),
			related_cases: formatList(relatedCases),
			related_amendments: formatList(relatedAmendments),
			related_issues: formatList(relatedIssues),
			official_sources: sourceUrls,
			secondary_sources: [],
			status: 'seeded',
			last_reviewed: today,
		},
		[
			section('Summary', entry.data.summary),
			section('Scope', entry.data.intro),
			section('Key provisions', bulletList([...relatedParts, ...relatedSchedules])),
			section('Key cases', bulletList(relatedCases)),
			section('Current debates', bulletList(relatedIssues)),
			section('Canonical site note', trimParagraphs(entry.body || '')),
			section('Open questions', '- Which subtopics or doctrine clusters should split out from this note?'),
		],
	);
}

function renderInstitution(entry, context) {
	const relatedArticles = ensureArray(entry.data.articles).map((slug) =>
		relEntity(slug, 'articles', context.maps.articleTitle.get(slug)),
	);
	const relatedParts = ensureArray(entry.data.parts).map((slug) => relEntity(slug, 'parts', context.maps.partTitle.get(slug)));
	const relatedTopics = ensureArray(entry.data.topics).map((slug) => relEntity(slug, 'topics', context.maps.topicTitle.get(slug)));
	const relatedCases = ensureArray(entry.data.cases).map((slug) => relEntity(slug, 'cases', context.maps.caseTitle.get(slug)));
	const relatedIssues = ensureArray(entry.data.currentAffairs).map((slug) => relIssue(slug, context.maps.issueTitle.get(slug)));
	const sourceUrls = ensureArray(entry.data.sources).map((slug) => context.maps.sourceUrl.get(slug)).filter(Boolean);

	return noteTemplate(
		{
			type: 'institution',
			slug: entry.data.slug,
			title: entry.data.title,
			aliases: [],
			institution_type: entry.data.institutionType,
			constitution_refs: formatList([...relatedArticles, ...relatedParts]),
			related_topics: formatList(relatedTopics),
			related_cases: formatList(relatedCases),
			related_issues: formatList(relatedIssues),
			official_sources: sourceUrls,
			secondary_sources: [],
			status: 'seeded',
			last_reviewed: today,
		},
		[
			section('Summary', entry.data.summary),
			section('Constitutional role', entry.data.role),
			section('Why it matters', entry.data.whyItMatters),
			section('Constitutional basis', bulletList(ensureArray(entry.data.constitutionalBasis))),
			section('Related provisions', bulletList([...relatedArticles, ...relatedParts])),
			section('Live issues', bulletList(relatedIssues)),
			section('Canonical site note', trimParagraphs(entry.body || '')),
			section('Open questions', '- Which additional actors or offices should be linked to this institution as the corpus grows?'),
		],
	);
}

function renderIssue(entry, context) {
	const relatedArticles = ensureArray(entry.data.articles).map((slug) =>
		relEntity(slug, 'articles', context.maps.articleTitle.get(slug)),
	);
	const relatedParts = ensureArray(entry.data.parts).map((slug) => relEntity(slug, 'parts', context.maps.partTitle.get(slug)));
	const relatedSchedules = ensureArray(entry.data.schedules).map((slug) =>
		relEntity(slug, 'schedules', context.maps.scheduleTitle.get(slug)),
	);
	const relatedCases = ensureArray(entry.data.cases).map((slug) => relEntity(slug, 'cases', context.maps.caseTitle.get(slug)));
	const relatedTopics = ensureArray(entry.data.topics).map((slug) => relEntity(slug, 'topics', context.maps.topicTitle.get(slug)));
	const sourceUrls = ensureArray(entry.data.sources).map((slug) => context.maps.sourceUrl.get(slug)).filter(Boolean);

	return noteTemplate(
		{
			type: 'issue',
			slug: entry.data.slug,
			title: entry.data.title,
			aliases: [],
			status: entry.data.status,
			issue_types: ensureArray(entry.data.issueTypes),
			event_date: String(entry.data.eventDate).slice(0, 10),
			constitution_refs: formatList([...relatedArticles, ...relatedParts, ...relatedSchedules]),
			related_cases: formatList(relatedCases),
			related_topics: formatList(relatedTopics),
			related_institutions: ensureArray(entry.data.actors),
			official_sources: sourceUrls,
			secondary_sources: [],
			last_reviewed: today,
		},
		[
			section('What happened', entry.data.summary),
			section('Constitutional question', entry.data.constitutionalQuestion),
			section('Why it matters', entry.data.whyItMatters),
			section('Current status', entry.data.statusNote),
			section('Tracking lanes', bulletList(ensureArray(entry.data.trackingLanes))),
			section('Related provisions', bulletList([...relatedArticles, ...relatedParts, ...relatedSchedules])),
			section('Related cases', bulletList(relatedCases)),
			section('What to watch next', bulletList(ensureArray(entry.data.watchFor))),
			section('Canonical site note', trimParagraphs(entry.body || '')),
			section('Status and next steps', `Status: ${entry.data.status}.`),
		],
	);
}

function renderSource(entry) {
	return noteTemplate(
		{
			type: 'source',
			title: entry.data.title,
			publisher: entry.data.publisher,
			url: entry.data.url,
			source_tier: entry.data.tier ?? 'primary',
			format: ensureArray(entry.data.formats).join(', '),
			captured_on: today,
			related_entities: [],
			related_institutions: ensureArray(entry.data.institutions).map((slug) => relEntity(slug, 'institutions', context.maps.institutionTitle.get(slug))),
			related_issues: [],
			status: 'seeded',
		},
		[
			section('What this source is', entry.data.description),
			section('Why it matters', ensureArray(entry.data.recommendedFor).length > 0 ? `Use for ${ensureArray(entry.data.recommendedFor).join(', ')}.` : 'Important source for the project.'),
			section('Key claims or extracts', ensureArray(entry.data.recommendedFor).map((item) => `- ${item}`).join('\n') || '- Add source-specific extraction notes here.'),
			section('Limits and caveats', entry.data.accessNotes || 'Record any access caveats here as research proceeds.'),
			section('Follow-on updates needed', '- Add linked entities and issue notes as this source begins to drive published pages.'),
		],
	);
}

function noteTemplate(frontmatter, sections) {
	return `${yamlBlock(frontmatter)}\n\n${sections.filter(Boolean).join('\n\n')}\n`;
}

async function main() {
	const collections = {};
	for (const config of collectionConfigs) {
		collections[config.label] = await readCollection(config.canonicalDir);
	}

	const context = {
		collections,
		maps: buildMaps(collections),
	};

	let createdCount = 0;

	for (const config of collectionConfigs) {
		await mkdir(absolute(config.researchDir), { recursive: true });

		const existingNames = new Set(
			(await readdir(absolute(config.researchDir), { withFileTypes: true }))
				.filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
				.map((entry) => entry.name.replace(/\.md$/, '')),
		);

		for (const entry of collections[config.label]) {
			if (existingNames.has(entry.data.slug)) continue;
			const output = config.render(entry, context);
			const target = absolute(path.join(config.researchDir, `${entry.data.slug}.md`));
			await writeFile(target, output, 'utf8');
			createdCount += 1;
			console.log(`created ${path.relative(root, target)}`);
		}
	}

	console.log(`\nCreated ${createdCount} vault notes.`);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
