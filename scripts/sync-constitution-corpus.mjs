import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import yaml from 'js-yaml';

const execFileAsync = promisify(execFile);

const root = process.cwd();
const articlesDir = path.join(root, 'src/content/articles');
const partsDir = path.join(root, 'src/content/parts');

const corpusSource = {
	pdfPath: '/tmp/constitution_of_india_latest.pdf',
	textPath: '/tmp/constitution_of_india_latest.txt',
	url: 'https://www.indiacode.nic.in/bitstream/123456789/19632/1/the_constitution_of_india.pdf',
};

const post2022InsertedArticles = [
	{
		number: '330A',
		partCode: 'PART XVI',
		sources: ['constitution-106th-amendment-act-2023'],
		officialText:
			'330A. Reservation of seats for women in the House of the People.—(1) Seats shall be reserved for women in the House of the People. (2) As nearly as may be, one-third of the total number of seats reserved under clause (2) of article 330 shall be reserved for women belonging to the Scheduled Castes or the Scheduled Tribes. (3) As nearly as may be, one-third (including the number of seats reserved for women belonging to the Scheduled Castes and the Scheduled Tribes) of the total number of seats to be filled by direct election to the House of the People shall be reserved for women.',
	},
	{
		number: '332A',
		partCode: 'PART XVI',
		sources: ['constitution-106th-amendment-act-2023'],
		officialText:
			'332A. Reservation of seats for women in the Legislative Assembly of every State.—(1) Seats shall be reserved for women in the Legislative Assembly of every State. (2) As nearly as may be, one-third of the total number of seats reserved under clause (3) of article 332 shall be reserved for women belonging to the Scheduled Castes or the Scheduled Tribes. (3) As nearly as may be, one-third (including the number of seats reserved for women belonging to the Scheduled Castes and the Scheduled Tribes) of the total number of seats to be filled by direct election in the Legislative Assembly of every State shall be reserved for women.',
	},
	{
		number: '334A',
		partCode: 'PART XVI',
		sources: ['constitution-106th-amendment-act-2023'],
		officialText:
			'334A. Reservation of seats for women to come into effect after an exercise of delimitation.—(1) Notwithstanding anything in the foregoing provisions of this Part or Part VIII, the provisions of the Constitution relating to the reservation of seats for women in the House of the People, the Legislative Assembly of a State and the Legislative Assembly of the National Capital Territory of Delhi shall come into effect after an exercise of delimitation is undertaken for this purpose after the relevant figures for the first census taken after commencement of the Constitution (One Hundred and Sixth Amendment) Act, 2023 have been published and shall cease to have effect on the expiration of a period of fifteen years from such commencement. (2) Subject to the provisions of articles 239AA, 330A and 332A, seats reserved for women in the House of the People, the Legislative Assembly of a State and the Legislative Assembly of the National Capital Territory of Delhi shall continue till such date as Parliament may by law determine. (3) Rotation of seats reserved for women in the House of the People, the Legislative Assembly of a State and the Legislative Assembly of the National Capital Territory of Delhi shall take effect after each subsequent exercise of delimitation as Parliament may by law determine. (4) Nothing in this article shall affect any representation in the House of the People, the Legislative Assembly of a State or the Legislative Assembly of the National Capital Territory of Delhi until the dissolution of the then existing House of the People, Legislative Assembly of a State or Legislative Assembly of the National Capital Territory of Delhi.',
	},
];

const generatedArticleBody = [
	'## Editorial status',
	'',
	'This reference page is generated from the official constitutional text so every Article has a reliable primary-source anchor on the site. Interpretive notes, case law, amendment history, and current-affairs links can now be layered on top without losing the underlying text.',
	'',
	'## Reading note',
	'',
	'Start with the official wording on this page. Then move outward to the linked Part, amendments, cases, and live issue pages for doctrine and contemporary relevance.',
].join('\n');

const generatedPartBody = [
	'## Editorial status',
	'',
	'This Part page is maintained as a structural hub for the constitutional text. It is designed to keep every Article in the Part connected to doctrine, institutions, amendments, and live constitutional disputes as the corpus expands.',
	'',
	'## Reading note',
	'',
	'Use this page to move from the Constitution’s high-level structure to the individual Articles that operationalise it.',
].join('\n');

await main();

async function main() {
	await mkdir(articlesDir, { recursive: true });
	await mkdir(partsDir, { recursive: true });

	const officialText = await ensureOfficialText();
	const parsed = parseOfficialCorpus(officialText);
	addInsertedArticles(parsed);

	const partIndex = new Map(parsed.parts.map((part) => [part.code, part]));
	for (const article of parsed.articles) {
		const part = partIndex.get(article.partCode);
		article.partSlug = part?.slug;
		article.partTitle = part?.title ?? article.partCode;
	}

	const articlesByPart = new Map();
	for (const article of parsed.articles) {
		const collection = articlesByPart.get(article.partCode) ?? [];
		collection.push(article);
		articlesByPart.set(article.partCode, collection);
	}

	for (const articleGroup of articlesByPart.values()) {
		articleGroup.sort((left, right) => compareArticleNumbers(left.number, right.number));
		articleGroup.forEach((article, index) => {
			const related = [];
			if (articleGroup[index - 1]) related.push(articleGroup[index - 1].slug);
			if (articleGroup[index + 1]) related.push(articleGroup[index + 1].slug);
			article.relatedArticles = related;
		});
	}

	for (const part of parsed.parts) {
		const partArticles = articlesByPart.get(part.code) ?? [];
		part.articleSlugs = partArticles.map((article) => article.slug);
		part.sources = [...new Set(partArticles.flatMap((article) => article.sources))];
		if (!part.sources.includes('constitution-of-india')) {
			part.sources.unshift('constitution-of-india');
		}
	}

	const articleStats = await syncArticles(parsed.articles);
	const partStats = await syncParts(parsed.parts);

	console.log(
		JSON.stringify(
			{
				parts: parsed.parts.length,
				articles: parsed.articles.length,
				createdArticles: articleStats.created,
				updatedArticles: articleStats.updated,
				createdParts: partStats.created,
				updatedParts: partStats.updated,
			},
			null,
			2,
		),
	);
}

async function ensureOfficialText() {
	if (await fileExists(corpusSource.textPath)) {
		return readFile(corpusSource.textPath, 'utf8');
	}

	if (!(await fileExists(corpusSource.pdfPath))) {
		const response = await fetch(corpusSource.url);
		if (!response.ok) {
			throw new Error(`Failed to download Constitution PDF from ${corpusSource.url}: ${response.status}`);
		}
		const buffer = Buffer.from(await response.arrayBuffer());
		await writeFile(corpusSource.pdfPath, buffer);
	}

	await execFileAsync('pdftotext', [corpusSource.pdfPath, corpusSource.textPath]);
	return readFile(corpusSource.textPath, 'utf8');
}

function parseOfficialCorpus(text) {
	const startMarker = 'PART I\nTHE UNION AND ITS TERRITORY\n1. Name and territory of the Union.';
	const start = text.indexOf(startMarker);
	const end = text.indexOf('[FIRST SCHEDULE', start);

	if (start === -1 || end === -1) {
		throw new Error('Unable to isolate the main constitutional body from the official text.');
	}

	const mainBody = text
		.slice(start, end)
		.replace(/\r/g, '')
		.replace(/\f/g, '\n\f\n');

	const lines = mainBody.split('\n');
	const parts = [];
	const articles = [];

	let currentPart = null;
	let capturingPartTitle = false;
	let currentArticle = null;
	let skippingFootnotes = false;

	for (const rawLine of lines) {
		let line = rawLine.replace(/\f/g, '').trim();

		if (rawLine.includes('\f')) {
			skippingFootnotes = false;
		}

		if (!line) {
			continue;
		}

		if (skippingFootnotes) {
			continue;
		}

		if (isFootnoteDivider(line)) {
			skippingFootnotes = true;
			continue;
		}

		if (isIgnoredLine(line)) {
			continue;
		}

		const partMatch = line.match(/^\[?PART\s+([IVXLCDM]+[A-Z]?)$/);
		if (partMatch) {
			flushArticle();
			currentPart = {
				code: `PART ${partMatch[1]}`,
				slug: `part-${partMatch[1].toLowerCase()}`,
				order: partOrder(partMatch[1]),
				rawTitleLines: [],
				articleSlugs: [],
				sources: ['constitution-of-india'],
			};
			parts.push(currentPart);
			capturingPartTitle = true;
			continue;
		}

		if (capturingPartTitle && currentPart) {
			if (looksLikePartTitle(line)) {
				currentPart.rawTitleLines.push(cleanStructuralText(line));
				continue;
			}
			capturingPartTitle = false;
		}

		const articleMatch = line.match(/^\[?(\d+[A-Z]*)\.\s*(.*)$/);
		if (articleMatch && isValidArticleNumber(articleMatch[1]) && !looksLikeFootnoteLine(line)) {
			flushArticle();
			currentArticle = {
				number: articleMatch[1].toUpperCase(),
				slug: `article-${articleMatch[1].toLowerCase()}`,
				partCode: currentPart?.code ?? 'PART UNKNOWN',
				sources: ['constitution-of-india'],
				lines: [cleanInlineFootnotes(line)],
			};
			continue;
		}

		if (currentArticle) {
			if (looksLikeFootnoteLine(line)) {
				skippingFootnotes = true;
				continue;
			}
			currentArticle.lines.push(cleanInlineFootnotes(line));
		}
	}

	flushArticle();

	for (const part of parts) {
		const partTitle = toDisplayTitle(part.rawTitleLines.join(' '));
		part.heading = partTitle;
		part.title = `${toPartLabel(part.code)} - ${partTitle}`;
		part.summary = `${toPartLabel(part.code)} contains the constitutional provisions on ${lowercaseFirst(stripTerminalPeriod(partTitle))}.`;
		part.intro = `This Part serves as the site’s structural hub for ${lowercaseFirst(stripTerminalPeriod(partTitle))}.`;
		delete part.rawTitleLines;
	}

	return {
		parts,
		articles: dedupeBySlug(articles),
	};

	function flushArticle() {
		if (!currentArticle) {
			return;
		}

		const officialText = normalizeOfficialText(currentArticle.lines);
		if (!officialText) {
			currentArticle = null;
			return;
		}

		const heading = extractHeading(currentArticle.number, officialText);
		const summary = `Article ${currentArticle.number} covers ${lowercaseFirst(stripTerminalPeriod(cleanHeading(heading)))}.`;

		articles.push({
			number: currentArticle.number,
			slug: currentArticle.slug,
			partCode: currentArticle.partCode,
			partTitle: currentArticle.partCode,
			partSlug: undefined,
			summary,
			plainEnglish: `This page reproduces the official text of Article ${currentArticle.number}. The constitutional wording is the primary reference point, and interpretive layers are added through linked cases, amendments, topics, and current-affairs pages.`,
			officialText,
			relatedArticles: [],
			schedules: inferSchedules(officialText),
			topics: [],
			sources: currentArticle.sources,
		});

		currentArticle = null;
	}
}

function addInsertedArticles(parsed) {
	const partIndex = new Map(parsed.parts.map((part) => [part.code, part]));

	for (const inserted of post2022InsertedArticles) {
		if (parsed.articles.some((article) => article.number === inserted.number)) {
			continue;
		}

		let part = partIndex.get(inserted.partCode);
		if (!part) {
			part = {
				code: inserted.partCode,
				slug: `part-${inserted.partCode.replace('PART ', '').toLowerCase()}`,
				order: partOrder(inserted.partCode.replace('PART ', '')),
				heading: toDisplayTitle(inserted.partCode.replace('PART ', '')),
				title: inserted.partCode,
				summary: `This Part includes Article ${inserted.number}.`,
				intro: `This Part includes later amendments that must still be anchored to primary constitutional text.`,
				articleSlugs: [],
				sources: ['constitution-of-india'],
			};
			parsed.parts.push(part);
			partIndex.set(part.code, part);
		}

		parsed.articles.push({
			number: inserted.number,
			slug: `article-${inserted.number.toLowerCase()}`,
			partCode: inserted.partCode,
			partTitle: part.title,
			partSlug: part.slug,
			summary: `Article ${inserted.number} covers ${lowercaseFirst(stripTerminalPeriod(cleanHeading(extractHeading(inserted.number, inserted.officialText))))}.`,
			plainEnglish: `This page reproduces the official text inserted by the Constitution (One Hundred and Sixth Amendment) Act, 2023. It anchors later editorial work to the primary amendment text notified by the Government of India.`,
			officialText: inserted.officialText,
			relatedArticles: [],
			schedules: inferSchedules(inserted.officialText),
			topics: [],
			sources: ['constitution-of-india', ...inserted.sources],
		});
	}

	parsed.articles.sort((left, right) => compareArticleNumbers(left.number, right.number));
}

async function syncArticles(articles) {
	let created = 0;
	let updated = 0;

	for (const article of articles) {
		const filePath = path.join(articlesDir, `${article.slug}.md`);

		if (await fileExists(filePath)) {
			const existing = await parseMarkdown(filePath);
			const isGenerated = existing.body.trim() === generatedArticleBody.trim();
			const relatedArticles = sortArticleSlugs(
				(isGenerated ? article.relatedArticles : mergeUnique(existing.data.relatedArticles ?? [], article.relatedArticles)).filter(
					(slug) => slug !== article.slug,
				),
			);
			const data = {
				...existing.data,
				part: article.partTitle,
				partSlug: article.partSlug,
				officialText: article.officialText,
				sources: mergeUnique(existing.data.sources ?? [], article.sources),
				relatedArticles,
			};
			if (isGenerated) {
				data.summary = article.summary;
				data.plainEnglish = article.plainEnglish;
				data.schedules = article.schedules;
			}
			await writeMarkdown(filePath, data, existing.body);
			updated += 1;
			continue;
		}

		const data = {
			title: `Article ${article.number}`,
			slug: article.slug,
			number: article.number,
			part: article.partTitle,
			partSlug: article.partSlug,
			summary: article.summary,
			plainEnglish: article.plainEnglish,
			officialText: article.officialText,
			relatedArticles: sortArticleSlugs(article.relatedArticles.filter((slug) => slug !== article.slug)),
			schedules: article.schedules,
			topics: article.topics,
			sources: article.sources,
		};
		await writeMarkdown(filePath, data, generatedArticleBody);
		created += 1;
	}

	return { created, updated };
}

async function syncParts(parts) {
	let created = 0;
	let updated = 0;

	for (const part of parts.sort((left, right) => left.order - right.order)) {
		const filePath = path.join(partsDir, `${part.slug}.md`);

		if (await fileExists(filePath)) {
			const existing = await parseMarkdown(filePath);
			const isGenerated = existing.body.trim() === generatedPartBody.trim();
			const data = {
				...existing.data,
				title: part.title,
				slug: part.slug,
				code: toPartLabel(part.code),
				order: part.order,
				summary: isGenerated ? part.summary : (existing.data.summary ?? part.summary),
				intro: isGenerated ? part.intro : (existing.data.intro ?? part.intro),
				articleSlugs: sortArticleSlugs(part.articleSlugs),
				sources: isGenerated ? part.sources : mergeUnique(existing.data.sources ?? [], part.sources),
			};
			await writeMarkdown(filePath, data, existing.body);
			updated += 1;
			continue;
		}

		const data = {
			title: part.title,
			slug: part.slug,
			code: toPartLabel(part.code),
			order: part.order,
			summary: part.summary,
			intro: part.intro,
			articleSlugs: part.articleSlugs,
			topics: [],
			sources: part.sources,
		};
		await writeMarkdown(filePath, data, generatedPartBody);
		created += 1;
	}

	return { created, updated };
}

async function parseMarkdown(filePath) {
	const raw = await readFile(filePath, 'utf8');
	const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
	if (!match) {
		throw new Error(`Missing frontmatter in ${filePath}`);
	}

	return {
		data: yaml.load(match[1]),
		body: match[2].trim(),
	};
}

async function writeMarkdown(filePath, data, body) {
	const frontmatter = yaml.dump(data, { lineWidth: 1000, noRefs: true, sortKeys: false }).trim();
	await writeFile(filePath, `---\n${frontmatter}\n---\n\n${body.trim()}\n`);
}

function normalizeOfficialText(lines) {
	const paragraphs = [];
	let buffer = [];

	for (const line of lines.map((value) => cleanStructuralText(value))) {
		if (!line) {
			flushBuffer();
			continue;
		}

		if (buffer.length > 0 && startsNewParagraph(line)) {
			flushBuffer();
		}

		buffer.push(line);
	}

	flushBuffer();
	return paragraphs.join('\n\n').trim();

	function flushBuffer() {
		if (buffer.length === 0) {
			return;
		}
		paragraphs.push(buffer.join(' ').replace(/\s+/g, ' ').trim());
		buffer = [];
	}
}

function extractHeading(number, officialText) {
	const prefix = new RegExp(`^\\[?${number}\\.\\s*`, 'i');
	const remainder = officialText.replace(prefix, '');
	const match = remainder.match(/^(.*?)(?:\.\u2014|\.\u2013|\.\-|\u2014|\u2013)/);
	return cleanHeading(match ? match[1] : remainder.split('. ')[0] ?? `Article ${number}`);
}

function cleanHeading(value) {
	return value
		.replace(/^\[+/, '')
		.replace(/\]+$/, '')
		.replace(/\s+/g, ' ')
		.trim();
}

function startsNewParagraph(line) {
	return /^(?:\(\d+\)|\([a-z]\)|Provided|Explanation|Nothing|Subject to|Notwithstanding|\[Provided)/.test(line);
}

function cleanInlineFootnotes(line) {
	return line
		.replace(/(^|\s)\d+\[/g, '$1[')
		.replace(/(^|\s)\d+\*+/g, '$1')
		.replace(/\s+/g, ' ')
		.trim();
}

function cleanStructuralText(line) {
	return cleanInlineFootnotes(line)
		.replace(/[–]/g, '—')
		.replace(/\s+/g, ' ')
		.trim();
}

function looksLikePartTitle(line) {
	return /^[A-Z0-9[\](),.&/\-— ]+$/.test(cleanStructuralText(line)) && line !== 'ARTICLES';
}

function isIgnoredLine(line) {
	return (
		line === 'THE CONSTITUTION OF INDIA' ||
		line === 'ARTICLES' ||
		line === 'CONTENTS' ||
		/^\([ivxlcdm]+\)$/i.test(line) ||
		/^\d+$/.test(line) ||
		/^\(Part .*?\)$/.test(line) ||
		/^CHAPTER\s+[IVXLCDM]+/.test(line)
	);
}

function looksLikeFootnoteLine(line) {
	return /^\d+\.\s+(?:Subs\.|Ins\.|Rep\.|Omitted|The words|Section|Art\.|Arts\.|Added by|See\b|Inserted by|Substituted by|Omitted by)/.test(line);
}

function isFootnoteDivider(line) {
	return /^_{5,}$/.test(line);
}

function isStructuralStart(line) {
	return /^\[?PART\s+[IVXLCDM]+[A-Z]?$/.test(line) || (/^\[?\d+[A-Z]*\.\s*/.test(line) && !looksLikeFootnoteLine(line));
}

function isValidArticleNumber(value) {
	const match = String(value).toUpperCase().match(/^(\d+)([A-Z]*)$/);
	if (!match) {
		return false;
	}

	return Number.parseInt(match[1], 10) <= 395;
}

function inferSchedules(text) {
	const scheduleMap = [
		{ matcher: /\bFirst Schedule\b/i, slug: 'schedule-i' },
		{ matcher: /\bSeventh Schedule\b/i, slug: 'schedule-vii' },
		{ matcher: /\bTenth Schedule\b/i, slug: 'schedule-x' },
		{ matcher: /\bEleventh Schedule\b/i, slug: 'schedule-xi' },
		{ matcher: /\bTwelfth Schedule\b/i, slug: 'schedule-xii' },
	];

	return scheduleMap.filter((item) => item.matcher.test(text)).map((item) => item.slug);
}

function toPartLabel(code) {
	return code.replace(/^PART\s+/, 'Part ');
}

function toDisplayTitle(raw) {
	const words = cleanStructuralText(raw)
		.toLowerCase()
		.split(/\s+/)
		.filter(Boolean);

	const minorWords = new Set(['a', 'an', 'and', 'as', 'at', 'for', 'from', 'in', 'of', 'on', 'or', 'the', 'to', 'with']);

	return words
		.map((word, index) => {
			const cleaned = word.replace(/\bpt\.\b/, 'Part');
			if (minorWords.has(cleaned) && index > 0) {
				return cleaned;
			}
			return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
		})
		.join(' ')
		.replace(/\[\s*/g, '[')
		.replace(/\s*\]/g, ']');
}

function stripTerminalPeriod(value) {
	return value.replace(/[.]+$/, '').trim();
}

function lowercaseFirst(value) {
	if (!value) return value;
	return value.charAt(0).toLowerCase() + value.slice(1);
}

function partOrder(code) {
	const match = code.match(/^([IVXLCDM]+)([A-Z]?)$/);
	if (!match) return Number.MAX_SAFE_INTEGER;

	const base = romanToInt(match[1]);
	if (!match[2]) return base;
	return base + (match[2].charCodeAt(0) - 64) / 10;
}

function romanToInt(value) {
	const numerals = new Map([
		['I', 1],
		['V', 5],
		['X', 10],
		['L', 50],
		['C', 100],
		['D', 500],
		['M', 1000],
	]);

	let total = 0;
	let previous = 0;

	for (const symbol of value.split('').reverse()) {
		const current = numerals.get(symbol) ?? 0;
		if (current < previous) {
			total -= current;
		} else {
			total += current;
			previous = current;
		}
	}

	return total;
}

function parseArticleNumber(value) {
	const match = String(value).trim().toUpperCase().match(/^(\d+)([A-Z]*)$/);
	if (!match) {
		return { base: Number.MAX_SAFE_INTEGER, suffix: String(value).toUpperCase() };
	}
	return { base: Number.parseInt(match[1], 10), suffix: match[2] ?? '' };
}

function compareArticleNumbers(left, right) {
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

function sortArticleSlugs(slugs) {
	return [...new Set(slugs)].sort((left, right) => {
		const leftNumber = left.replace(/^article-/, '').toUpperCase();
		const rightNumber = right.replace(/^article-/, '').toUpperCase();
		return compareArticleNumbers(leftNumber, rightNumber);
	});
}

function mergeUnique(existing, incoming) {
	return [...new Set([...(existing ?? []), ...(incoming ?? [])])];
}

function dedupeBySlug(entries) {
	const seen = new Set();
	const unique = [];

	for (const entry of entries) {
		if (seen.has(entry.slug)) {
			continue;
		}

		seen.add(entry.slug);
		unique.push(entry);
	}

	return unique;
}

async function fileExists(filePath) {
	try {
		await access(filePath);
		return true;
	} catch {
		return false;
	}
}
