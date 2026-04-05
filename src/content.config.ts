import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const articles = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
	schema: z.object({
		title: z.string(),
		slug: z.string(),
		number: z.number(),
		part: z.string(),
		summary: z.string(),
		plainEnglish: z.string(),
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
		affectedArticles: z.array(z.string()).default([]),
		topics: z.array(z.string()).default([]),
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
		summary: z.string(),
		constitutionalQuestion: z.string(),
		whyItMatters: z.string(),
		articles: z.array(z.string()).default([]),
		cases: z.array(z.string()).default([]),
		topics: z.array(z.string()).default([]),
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
		description: z.string(),
	}),
});

export const collections = {
	articles,
	cases,
	topics,
	amendments,
	'current-affairs': currentAffairs,
	sources,
};
