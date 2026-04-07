import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const graphCollections = [
	'articles',
	'parts',
	'schedules',
	'topics',
	'institutions',
	'cases',
	'glossary',
	'amendments',
	'timeline',
	'current-affairs',
] as const;

const timelineRelatedCollections = [
	'articles',
	'parts',
	'schedules',
	'topics',
	'cases',
	'amendments',
	'current-affairs',
	'glossary',
] as const;

const edgeRelationTypes = [
	'belongs-to',
	'contains',
	'cross-references',
	'references',
	'explains',
	'interprets',
	'defines',
	'shapes',
	'amends',
	'reforms',
	'anchors',
	'involves',
	'chronicles',
	'overrules',
	'reaffirms',
	'builds-on',
	'limits',
	'frames',
	'establishes',
	'applies',
	'operationalises',
	'tests',
	'administers',
	'appears-in',
	'tracked-through',
	'extends',
	'sourced-by',
] as const;

const articles = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
	schema: z.object({
		title: z.string(),
		slug: z.string(),
		number: z.union([z.string(), z.number()]).transform((value) => String(value).toUpperCase()),
		part: z.string(),
		partSlug: z.string().optional(),
		summary: z.string(),
		plainEnglish: z.string(),
		officialText: z.string().optional(),
		relatedArticles: z.array(z.string()).default([]),
		schedules: z.array(z.string()).default([]),
		topics: z.array(z.string()).default([]),
		sources: z.array(z.string()).default([]),
	}),
});

const parts = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/parts' }),
	schema: z.object({
		title: z.string(),
		slug: z.string(),
		code: z.string(),
		order: z.number(),
		summary: z.string(),
		intro: z.string(),
		articleSlugs: z.array(z.string()).default([]),
		topics: z.array(z.string()).default([]),
		sources: z.array(z.string()).default([]),
	}),
});

const schedules = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/schedules' }),
	schema: z.object({
		title: z.string(),
		slug: z.string(),
		number: z.number(),
		summary: z.string(),
		intro: z.string(),
		relatedArticles: z.array(z.string()).default([]),
		topics: z.array(z.string()).default([]),
		sources: z.array(z.string()).default([]),
	}),
});

const cases = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/cases' }),
	schema: z.object({
		title: z.string(),
		slug: z.string(),
		citation: z.string(),
		year: z.number(),
		court: z.string(),
		summary: z.string(),
		issue: z.string(),
		holding: z.string(),
		significance: z.string(),
		articles: z.array(z.string()).default([]),
		parts: z.array(z.string()).default([]),
		schedules: z.array(z.string()).default([]),
		topics: z.array(z.string()).default([]),
		sources: z.array(z.string()).default([]),
	}),
});

const topics = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/topics' }),
	schema: z.object({
		title: z.string(),
		slug: z.string(),
		summary: z.string(),
		intro: z.string(),
		parts: z.array(z.string()).default([]),
		schedules: z.array(z.string()).default([]),
		sources: z.array(z.string()).default([]),
	}),
});

const institutions = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/institutions' }),
	schema: z.object({
		title: z.string(),
		slug: z.string(),
		institutionType: z.enum([
			'court',
			'parliamentary-body',
			'constitutional-office',
			'election-authority',
			'executive',
			'legislative-office',
		]),
		summary: z.string(),
		role: z.string(),
		whyItMatters: z.string(),
		constitutionalBasis: z.array(z.string()).default([]),
		articles: z.array(z.string()).default([]),
		parts: z.array(z.string()).default([]),
		topics: z.array(z.string()).default([]),
		cases: z.array(z.string()).default([]),
		currentAffairs: z.array(z.string()).default([]),
		sources: z.array(z.string()).default([]),
	}),
});

const glossary = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/glossary' }),
	schema: z.object({
		title: z.string(),
		slug: z.string(),
		summary: z.string(),
		plainEnglish: z.string(),
		relatedArticles: z.array(z.string()).default([]),
		relatedParts: z.array(z.string()).default([]),
		relatedSchedules: z.array(z.string()).default([]),
		topics: z.array(z.string()).default([]),
		cases: z.array(z.string()).default([]),
		sources: z.array(z.string()).default([]),
	}),
});

const amendments = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/amendments' }),
	schema: z.object({
		title: z.string(),
		slug: z.string(),
		number: z.number(),
		year: z.number(),
		summary: z.string(),
		whatChanged: z.string(),
		officialCitation: z.string().optional(),
		compareProfile: z
			.object({
				constitutionalStrategy: z.string(),
				institutionalReach: z.string(),
				rightsImpact: z.string(),
				federalImpact: z.string(),
				longTermLegacy: z.string(),
			})
			.optional(),
		compareHighlights: z
			.array(
				z.object({
					title: z.string(),
					note: z.string(),
					articleRefs: z.array(z.string()).default([]),
					partRefs: z.array(z.string()).default([]),
					scheduleRefs: z.array(z.string()).default([]),
				}),
			)
			.default([]),
		affectedArticles: z.array(z.string()).default([]),
		affectedParts: z.array(z.string()).default([]),
		affectedSchedules: z.array(z.string()).default([]),
		topics: z.array(z.string()).default([]),
		sources: z.array(z.string()).default([]),
	}),
});

const timeline = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/timeline' }),
	schema: z.object({
		title: z.string(),
		slug: z.string(),
		date: z.coerce.date(),
		category: z.enum(['founding', 'amendment', 'case', 'crisis', 'rights', 'federalism']),
		summary: z.string(),
		articleRefs: z.array(z.string()).default([]),
		partRefs: z.array(z.string()).default([]),
		scheduleRefs: z.array(z.string()).default([]),
		relatedCollection: z.enum(timelineRelatedCollections).optional(),
		relatedSlug: z.string().optional(),
		sources: z.array(z.string()).default([]),
	}),
});

const currentAffairs = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/current-affairs' }),
	schema: z.object({
		title: z.string(),
		slug: z.string(),
		eventDate: z.coerce.date(),
		publishedAt: z.coerce.date(),
		updatedAt: z.coerce.date(),
		status: z.enum(['ongoing', 'resolved', 'archived']),
		issueTypes: z
			.array(
				z.enum([
					'rights-and-liberties',
					'institutional-conflict',
					'structural-reform',
					'elections-and-democracy',
					'equality-and-representation',
				]),
			)
			.default([]),
		summary: z.string(),
		constitutionalQuestion: z.string(),
		whyItMatters: z.string(),
		statusNote: z.string(),
		actors: z.array(z.string()).default([]),
		trackingLanes: z.array(z.string()).default([]),
		watchFor: z.array(z.string()).default([]),
		articles: z.array(z.string()).default([]),
		parts: z.array(z.string()).default([]),
		schedules: z.array(z.string()).default([]),
		cases: z.array(z.string()).default([]),
		topics: z.array(z.string()).default([]),
		institutions: z.array(z.string()).default([]),
		sources: z.array(z.string()).default([]),
	}),
});

const sources = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/sources' }),
	schema: z.object({
		title: z.string(),
		slug: z.string(),
		publisher: z.string(),
		url: z.string().url(),
		sourceType: z.enum(['official', 'court', 'policy', 'reference']),
		tier: z.enum(['primary', 'secondary', 'supporting']).default('primary'),
		formats: z.array(z.string()).default([]),
		recommendedFor: z.array(z.string()).default([]),
		institutions: z.array(z.string()).default([]),
		accessNotes: z.string().optional(),
		description: z.string(),
	}),
});

const edges = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/edges' }),
	schema: z.object({
		title: z.string(),
		slug: z.string(),
		fromCollection: z.enum(graphCollections),
		fromSlug: z.string(),
		toCollection: z.enum(graphCollections),
		toSlug: z.string(),
		relationType: z.enum(edgeRelationTypes),
		strength: z
			.union([
				z.number().int().min(1).max(5),
				z.enum(['context', 'strong', 'core']).transform((value) => (value === 'core' ? 5 : value === 'strong' ? 4 : 2)),
			])
			.default(3),
		summary: z.string().optional(),
		note: z.string().optional(),
		directional: z.boolean().default(false),
		sources: z.array(z.string()).default([]),
	}),
});

export const collections = {
	articles,
	parts,
	schedules,
	cases,
	topics,
	institutions,
	glossary,
	amendments,
	timeline,
	'current-affairs': currentAffairs,
	sources,
	edges,
};
