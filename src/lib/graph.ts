import { getCollection, type CollectionEntry } from 'astro:content';
import {
	formatDate,
	getEntryHref,
	humanizeToken,
	ordinal,
	sortArticles,
	sortByDateAsc,
	sortByDateDesc,
	sortByNumericField,
	sortByTitle,
	withBase,
} from './content';

export type GraphCollection =
	| 'articles'
	| 'parts'
	| 'schedules'
	| 'topics'
	| 'institutions'
	| 'cases'
	| 'glossary'
	| 'amendments'
	| 'timeline'
	| 'current-affairs'
	| 'sources';

export type GraphRelationType =
	| 'belongs-to'
	| 'contains'
	| 'cross-references'
	| 'references'
	| 'explains'
	| 'interprets'
	| 'defines'
	| 'shapes'
	| 'amends'
	| 'reforms'
	| 'anchors'
	| 'involves'
	| 'chronicles'
	| 'overrules'
	| 'reaffirms'
	| 'builds-on'
	| 'limits'
	| 'frames'
	| 'establishes'
	| 'applies'
	| 'tests'
	| 'operationalises'
	| 'tests'
	| 'extends'
	| 'administers'
	| 'appears-in'
	| 'tracked-through'
	| 'sourced-by';

export type GraphEdgeFamily = 'structure' | 'doctrine' | 'change' | 'live' | 'history';

export type GraphNode = {
	id: string;
	label: string;
	subtitle: string;
	summary: string;
	type: string;
	collection: GraphCollection;
	slug: string;
	href: string;
	degree: number;
	overview: boolean;
	explicitlyConnected: boolean;
};

export type GraphEdgeRelation = {
	from: string;
	to: string;
	relationType: GraphRelationType;
	relationLabel: string;
	explicit: boolean;
	note?: string;
	sources: string[];
	strength: number;
};

export type GraphEdge = {
	id: string;
	source: string;
	target: string;
	family: GraphEdgeFamily;
	familyLabel: string;
	familyDescription: string;
	familyColor: string;
	relationLabels: string[];
	relationTypes: GraphRelationType[];
	relations: GraphEdgeRelation[];
	explicit: boolean;
	note: string;
	sourceCount: number;
	weight: number;
};

export type GraphStat = {
	label: string;
	value: number;
	href?: string;
};

export type GraphLegendItem = {
	family: GraphEdgeFamily;
	label: string;
	description: string;
	color: string;
	count: number;
};

export type GraphExplorerData = {
	nodes: GraphNode[];
	edges: GraphEdge[];
	stats: GraphStat[];
	legend: GraphLegendItem[];
};

export type GraphBuildOptions = {
	profile?: 'home' | 'display' | 'full';
};

type GraphCollectionsInput = {
	articles: CollectionEntry<'articles'>[];
	parts: CollectionEntry<'parts'>[];
	schedules: CollectionEntry<'schedules'>[];
	topics: CollectionEntry<'topics'>[];
	institutions: CollectionEntry<'institutions'>[];
	cases: CollectionEntry<'cases'>[];
	glossary: CollectionEntry<'glossary'>[];
	amendments: CollectionEntry<'amendments'>[];
	timeline: CollectionEntry<'timeline'>[];
	currentAffairs: CollectionEntry<'current-affairs'>[];
	edges: CollectionEntry<'edges'>[];
};

type EdgeContribution = {
	from: string;
	to: string;
	relationType: GraphRelationType;
	explicit?: boolean;
	note?: string;
	sources?: string[];
	strength?: number;
};

type EdgeAccumulator = {
	source: string;
	target: string;
	families: Map<GraphEdgeFamily, number>;
	relations: GraphEdgeRelation[];
	relationLabels: Set<string>;
	relationTypes: Set<GraphRelationType>;
	notes: string[];
	sourceSlugs: Set<string>;
	explicit: boolean;
	weight: number;
};

const nodeTypeLabels: Record<GraphCollection, string> = {
	articles: 'Article',
	parts: 'Part',
	schedules: 'Schedule',
	topics: 'Topic',
	institutions: 'Institution',
	cases: 'Case',
	glossary: 'Glossary',
	amendments: 'Amendment',
	timeline: 'Timeline',
	'current-affairs': 'Current Affair',
	sources: 'Source',
};

const familyMeta: Record<
	GraphEdgeFamily,
	{
		label: string;
		description: string;
		color: string;
	}
> = {
	structure: {
		label: 'Constitutional structure',
		description: 'How provisions, institutions, and reference layers are formally connected.',
		color: '#20486a',
	},
	doctrine: {
		label: 'Doctrine and interpretation',
		description: 'How cases, topics, and glossary terms shape constitutional meaning.',
		color: '#9a5a18',
	},
	change: {
		label: 'Amendment and reform',
		description: 'How constitutional text is changed, extended, or operationalised over time.',
		color: '#2f6f53',
	},
	live: {
		label: 'Current constitutional practice',
		description: 'How live disputes and institutions connect doctrine back to present events.',
		color: '#8c3d30',
	},
	history: {
		label: 'Historical turning points',
		description: 'How timeline events connect text and doctrine across constitutional history.',
		color: '#5c5a49',
	},
};

const relationMeta: Record<
	GraphRelationType,
	{
		label: string;
		family: GraphEdgeFamily;
		strength: number;
	}
> = {
	'belongs-to': { label: 'Belongs to', family: 'structure', strength: 4 },
	contains: { label: 'Contains', family: 'structure', strength: 4 },
	'cross-references': { label: 'Cross-references', family: 'structure', strength: 2 },
	references: { label: 'References', family: 'structure', strength: 2 },
	explains: { label: 'Explains', family: 'doctrine', strength: 3 },
	interprets: { label: 'Interprets', family: 'doctrine', strength: 5 },
	defines: { label: 'Defines', family: 'doctrine', strength: 3 },
	shapes: { label: 'Shapes doctrine', family: 'doctrine', strength: 4 },
	amends: { label: 'Amends', family: 'change', strength: 5 },
	reforms: { label: 'Reforms', family: 'change', strength: 4 },
	anchors: { label: 'Anchors live issue', family: 'live', strength: 4 },
	involves: { label: 'Institution or actor involved', family: 'live', strength: 3 },
	chronicles: { label: 'Historic turning point', family: 'history', strength: 3 },
	overrules: { label: 'Overrules', family: 'doctrine', strength: 5 },
	reaffirms: { label: 'Reaffirms', family: 'doctrine', strength: 4 },
	'builds-on': { label: 'Builds on', family: 'doctrine', strength: 4 },
	limits: { label: 'Limits', family: 'doctrine', strength: 4 },
	frames: { label: 'Frames live dispute', family: 'live', strength: 4 },
	establishes: { label: 'Establishes', family: 'structure', strength: 5 },
	applies: { label: 'Applies', family: 'live', strength: 4 },
	tests: { label: 'Tests', family: 'live', strength: 4 },
	operationalises: { label: 'Operationalises', family: 'change', strength: 4 },
	extends: { label: 'Extends', family: 'change', strength: 3 },
	administers: { label: 'Administers', family: 'live', strength: 3 },
	'appears-in': { label: 'Appears in', family: 'live', strength: 3 },
	'tracked-through': { label: 'Tracked through', family: 'live', strength: 4 },
	'sourced-by': { label: 'Sourced by', family: 'history', strength: 1 },
};

const familyPriority: GraphEdgeFamily[] = ['doctrine', 'live', 'change', 'history', 'structure'];

const displayDerivedRelations = new Set<GraphRelationType>([
	'interprets',
	'amends',
	'anchors',
	'overrules',
	'reaffirms',
	'builds-on',
	'limits',
	'establishes',
	'extends',
	'applies',
	'tests',
]);

const displayExplicitRelations = new Set<GraphRelationType>([
	...displayDerivedRelations,
	'frames',
	'shapes',
	'reforms',
]);

function nodeId(collection: GraphCollection, slug: string) {
	return `${collection}:${slug}`;
}

function pairKey(left: string, right: string) {
	return [left, right].sort().join('__');
}

function createNode(
	collection: GraphCollection,
	entry: any,
): GraphNode {
	switch (collection) {
		case 'articles':
			return {
				id: nodeId(collection, entry.data.slug),
				label: `Article ${entry.data.number}`,
				subtitle: entry.data.title,
				summary: entry.data.summary,
				type: nodeTypeLabels[collection],
				collection,
				slug: entry.data.slug,
				href: getEntryHref(collection, entry.data.slug),
				degree: 0,
				overview: false,
				explicitlyConnected: false,
			};
		case 'parts':
			return {
				id: nodeId(collection, entry.data.slug),
				label: entry.data.code,
				subtitle: entry.data.title,
				summary: entry.data.summary,
				type: nodeTypeLabels[collection],
				collection,
				slug: entry.data.slug,
				href: getEntryHref(collection, entry.data.slug),
				degree: 0,
				overview: false,
				explicitlyConnected: false,
			};
		case 'schedules':
			return {
				id: nodeId(collection, entry.data.slug),
				label: `Schedule ${entry.data.number}`,
				subtitle: entry.data.title,
				summary: entry.data.summary,
				type: nodeTypeLabels[collection],
				collection,
				slug: entry.data.slug,
				href: getEntryHref(collection, entry.data.slug),
				degree: 0,
				overview: false,
				explicitlyConnected: false,
			};
		case 'topics':
			return {
				id: nodeId(collection, entry.data.slug),
				label: entry.data.title,
				subtitle: 'Topic dossier',
				summary: entry.data.summary,
				type: nodeTypeLabels[collection],
				collection,
				slug: entry.data.slug,
				href: getEntryHref(collection, entry.data.slug),
				degree: 0,
				overview: false,
				explicitlyConnected: false,
			};
		case 'institutions':
			return {
				id: nodeId(collection, entry.data.slug),
				label: entry.data.title,
				subtitle: humanizeToken(entry.data.institutionType),
				summary: entry.data.summary,
				type: nodeTypeLabels[collection],
				collection,
				slug: entry.data.slug,
				href: getEntryHref(collection, entry.data.slug),
				degree: 0,
				overview: false,
				explicitlyConnected: false,
			};
		case 'cases':
			return {
				id: nodeId(collection, entry.data.slug),
				label: entry.data.title,
				subtitle: `${entry.data.court} • ${entry.data.year}`,
				summary: entry.data.summary,
				type: nodeTypeLabels[collection],
				collection,
				slug: entry.data.slug,
				href: getEntryHref(collection, entry.data.slug),
				degree: 0,
				overview: false,
				explicitlyConnected: false,
			};
		case 'glossary':
			return {
				id: nodeId(collection, entry.data.slug),
				label: entry.data.title,
				subtitle: 'Glossary term',
				summary: entry.data.summary,
				type: nodeTypeLabels[collection],
				collection,
				slug: entry.data.slug,
				href: getEntryHref(collection, entry.data.slug),
				degree: 0,
				overview: false,
				explicitlyConnected: false,
			};
		case 'amendments':
			return {
				id: nodeId(collection, entry.data.slug),
				label: `${ordinal(entry.data.number)} Amendment`,
				subtitle: entry.data.title,
				summary: entry.data.summary,
				type: nodeTypeLabels[collection],
				collection,
				slug: entry.data.slug,
				href: getEntryHref(collection, entry.data.slug),
				degree: 0,
				overview: false,
				explicitlyConnected: false,
			};
		case 'timeline':
			return {
				id: nodeId(collection, entry.data.slug),
				label: entry.data.title,
				subtitle: `${formatDate(entry.data.date)} • ${humanizeToken(entry.data.category)}`,
				summary: entry.data.summary,
				type: nodeTypeLabels[collection],
				collection,
				slug: entry.data.slug,
				href: getEntryHref(collection, entry.data.slug),
				degree: 0,
				overview: false,
				explicitlyConnected: false,
			};
		case 'current-affairs':
			return {
				id: nodeId(collection, entry.data.slug),
				label: entry.data.title,
				subtitle: `${entry.data.status.charAt(0).toUpperCase()}${entry.data.status.slice(1)} • Updated ${formatDate(entry.data.updatedAt)}`,
				summary: entry.data.summary,
				type: nodeTypeLabels[collection],
				collection,
				slug: entry.data.slug,
				href: getEntryHref(collection, entry.data.slug),
				degree: 0,
				overview: false,
				explicitlyConnected: false,
			};
	}
}

function accumulateEdge(
	edgeMap: Map<string, EdgeAccumulator>,
	nodeIds: Set<string>,
	contribution: EdgeContribution,
) {
	if (!nodeIds.has(contribution.from) || !nodeIds.has(contribution.to) || contribution.from === contribution.to) {
		return;
	}

	const key = pairKey(contribution.from, contribution.to);
	const existing = edgeMap.get(key) ?? {
		source: key.split('__')[0],
		target: key.split('__')[1],
		families: new Map<GraphEdgeFamily, number>(),
		relations: [],
		relationLabels: new Set<string>(),
		relationTypes: new Set<GraphRelationType>(),
		notes: [],
		sourceSlugs: new Set<string>(),
		explicit: false,
		weight: 0,
	};

	const meta = relationMeta[contribution.relationType];
	const relationLabel = meta.label;
	const strength = contribution.strength ?? meta.strength;

	existing.relations.push({
		from: contribution.from,
		to: contribution.to,
		relationType: contribution.relationType,
		relationLabel,
		explicit: Boolean(contribution.explicit),
		note: contribution.note,
		sources: contribution.sources ?? [],
		strength,
	});
	existing.relationLabels.add(relationLabel);
	existing.relationTypes.add(contribution.relationType);
	existing.families.set(meta.family, (existing.families.get(meta.family) ?? 0) + strength);
	existing.weight = Math.max(existing.weight, strength);
	existing.explicit ||= Boolean(contribution.explicit);

	if (contribution.note && !existing.notes.includes(contribution.note)) {
		existing.notes.push(contribution.note);
	}

	for (const source of contribution.sources ?? []) {
		existing.sourceSlugs.add(source);
	}

	edgeMap.set(key, existing);
}

function pickPrimaryFamily(families: Map<GraphEdgeFamily, number>) {
	let bestFamily: GraphEdgeFamily = 'structure';
	let bestScore = -1;

	for (const family of familyPriority) {
		const score = families.get(family) ?? 0;
		if (score > bestScore) {
			bestFamily = family;
			bestScore = score;
		}
	}

	return bestFamily;
}

function finalizeEdge(edge: EdgeAccumulator, index: number): GraphEdge {
	const family = pickPrimaryFamily(edge.families);
	const meta = familyMeta[family];
	const note =
		edge.notes[0] ??
		`${edge.relationLabels.size === 1 ? [...edge.relationLabels][0] : 'Several constitutional links'} connect these nodes.`;

	return {
		id: `edge-${index + 1}`,
		source: edge.source,
		target: edge.target,
		family,
		familyLabel: meta.label,
		familyDescription: meta.description,
		familyColor: meta.color,
		relationLabels: [...edge.relationLabels].sort(),
		relationTypes: [...edge.relationTypes].sort(),
		relations: edge.relations,
		explicit: edge.explicit,
		note,
		sourceCount: edge.sourceSlugs.size,
		weight: edge.weight,
	};
}

function explicitStrengthToNumber(value: number | 'core' | 'strong' | 'context') {
	if (typeof value === 'number') {
		return value;
	}

	switch (value) {
		case 'core':
			return 5;
		case 'strong':
			return 4;
		default:
			return 2;
	}
}

function includeCollectionInProfile(collection: GraphCollection, profile: 'home' | 'display' | 'full') {
	if (profile === 'full') {
		return true;
	}

	return ['articles', 'topics', 'institutions', 'cases', 'amendments', 'current-affairs'].includes(collection);
}

function includeRelationInProfile(
	relationType: GraphRelationType,
	explicit: boolean | undefined,
	profile: 'home' | 'display' | 'full',
) {
	if (profile === 'full') {
		return true;
	}

	if (explicit) {
		return displayExplicitRelations.has(relationType);
	}

	return displayDerivedRelations.has(relationType);
}

function scoreOverviewNode(node: GraphNode) {
	const typeWeight = {
		'Current Affair': 45,
		Case: 40,
		Topic: 38,
		Institution: 34,
		Amendment: 30,
		Article: 24,
		Part: 18,
		Schedule: 18,
		Glossary: 12,
		Timeline: 10,
	}[node.type] ?? 0;

	return (node.explicitlyConnected ? 120 : 0) + typeWeight + node.degree * 4;
}

function applyGraphPruning(nodes: GraphNode[], edges: GraphEdge[], profile: 'home' | 'display' | 'full') {
	const degreeMap = new Map<string, number>();
	const explicitTouch = new Set<string>();
	const highSignalTouch = new Set<string>();

	for (const node of nodes) {
		degreeMap.set(node.id, 0);
	}

	for (const edge of edges) {
		degreeMap.set(edge.source, (degreeMap.get(edge.source) ?? 0) + 1);
		degreeMap.set(edge.target, (degreeMap.get(edge.target) ?? 0) + 1);

		if (edge.explicit) {
			explicitTouch.add(edge.source);
			explicitTouch.add(edge.target);
		}

		if (['doctrine', 'change', 'live'].includes(edge.family)) {
			highSignalTouch.add(edge.source);
			highSignalTouch.add(edge.target);
		}
	}

	if (profile === 'home') {
		const spotlightEdges = edges.filter(
			(edge) => edge.explicit || (edge.weight >= 4 && (explicitTouch.has(edge.source) || explicitTouch.has(edge.target))),
		);
		const spotlightIds = new Set<string>();

		for (const edge of spotlightEdges) {
			spotlightIds.add(edge.source);
			spotlightIds.add(edge.target);
		}

		return {
			nodes: nodes.filter((node) => spotlightIds.has(node.id)),
			edges: spotlightEdges,
		};
	}

	const activeNodeIds = new Set(
		nodes
			.filter((node) => {
				const degree = degreeMap.get(node.id) ?? 0;
				if (degree === 0 && !explicitTouch.has(node.id)) {
					return false;
				}

				if (node.collection === 'articles') {
					return degree >= 2 || explicitTouch.has(node.id) || highSignalTouch.has(node.id);
				}

				if (node.collection === 'topics' || node.collection === 'cases' || node.collection === 'amendments') {
					return degree >= 2 || explicitTouch.has(node.id) || highSignalTouch.has(node.id);
				}

				if (node.collection === 'current-affairs' || node.collection === 'institutions') {
					return degree >= 2 || explicitTouch.has(node.id);
				}

				return degree >= 2;
			})
			.map((node) => node.id),
	);

	const filteredEdges = edges.filter((edge) => activeNodeIds.has(edge.source) && activeNodeIds.has(edge.target));
	const survivingIds = new Set<string>();

	for (const edge of filteredEdges) {
		survivingIds.add(edge.source);
		survivingIds.add(edge.target);
	}

	return {
		nodes: nodes.filter((node) => survivingIds.has(node.id)),
		edges: filteredEdges,
	};
}

function hydrateNodeGraphState(nodes: GraphNode[], edges: GraphEdge[], profile: 'home' | 'display' | 'full') {
	const nodeIndex = new Map(nodes.map((node) => [node.id, node]));
	const explicitTouch = new Set<string>();

	for (const node of nodes) {
		node.degree = 0;
		node.explicitlyConnected = false;
		node.overview = false;
	}

	for (const edge of edges) {
		nodeIndex.get(edge.source)!.degree += 1;
		nodeIndex.get(edge.target)!.degree += 1;
		if (edge.explicit) {
			explicitTouch.add(edge.source);
			explicitTouch.add(edge.target);
		}
	}

	for (const node of nodes) {
		node.explicitlyConnected = explicitTouch.has(node.id);
	}

	if (profile === 'home' || profile === 'display') {
		const overviewIds = new Set(
			[...nodes]
				.filter((node) => node.degree > 0)
				.sort((left, right) => scoreOverviewNode(right) - scoreOverviewNode(left) || left.label.localeCompare(right.label))
				.slice(0, profile === 'home' ? 18 : 28)
				.map((node) => node.id),
		);

		for (const node of nodes) {
			node.overview = overviewIds.has(node.id);
		}

		return;
	}

	for (const node of nodes) {
		node.overview =
			node.explicitlyConnected ||
			node.degree >= 6 ||
			['Part', 'Schedule', 'Topic', 'Institution', 'Amendment', 'Current Affair'].includes(node.type);
	}
}

export function buildGraphExplorerData(input: GraphCollectionsInput, options: GraphBuildOptions = {}): GraphExplorerData {
	const profile = options.profile ?? 'display';
	const nodes = [
		...(includeCollectionInProfile('articles', profile) ? sortArticles(input.articles).map((entry) => createNode('articles', entry)) : []),
		...(includeCollectionInProfile('parts', profile) ? sortByNumericField(input.parts, 'order').map((entry) => createNode('parts', entry)) : []),
		...(includeCollectionInProfile('schedules', profile) ? sortByNumericField(input.schedules, 'number').map((entry) => createNode('schedules', entry)) : []),
		...(includeCollectionInProfile('topics', profile) ? sortByTitle(input.topics).map((entry) => createNode('topics', entry)) : []),
		...(includeCollectionInProfile('institutions', profile) ? sortByTitle(input.institutions).map((entry) => createNode('institutions', entry)) : []),
		...(includeCollectionInProfile('cases', profile) ? sortByTitle(input.cases).map((entry) => createNode('cases', entry)) : []),
		...(includeCollectionInProfile('amendments', profile)
			? [...sortByNumericField(input.amendments, 'number')].map((entry) => createNode('amendments', entry))
			: []),
		...(includeCollectionInProfile('glossary', profile) ? sortByTitle(input.glossary).map((entry) => createNode('glossary', entry)) : []),
		...(includeCollectionInProfile('timeline', profile) ? sortByDateAsc(input.timeline, 'date').map((entry) => createNode('timeline', entry)) : []),
		...(includeCollectionInProfile('current-affairs', profile)
			? sortByDateDesc(input.currentAffairs, 'updatedAt').map((entry) => createNode('current-affairs', entry))
			: []),
	];

	const nodeIds = new Set(nodes.map((node) => node.id));
	const nodeIndex = new Map(nodes.map((node) => [node.id, node]));
	const edgeMap = new Map<string, EdgeAccumulator>();

	for (const entry of input.articles) {
		const from = nodeId('articles', entry.data.slug);
		if (entry.data.partSlug) {
			if (includeRelationInProfile('belongs-to', false, profile)) {
				accumulateEdge(edgeMap, nodeIds, {
				from,
				to: nodeId('parts', entry.data.partSlug),
				relationType: 'belongs-to',
				});
			}
		}
		for (const related of entry.data.relatedArticles) {
			if (!includeRelationInProfile('cross-references', false, profile)) continue;
			accumulateEdge(edgeMap, nodeIds, {
				from,
				to: nodeId('articles', related),
				relationType: 'cross-references',
			});
		}
		for (const schedule of entry.data.schedules) {
			if (!includeRelationInProfile('operationalises', false, profile)) continue;
			accumulateEdge(edgeMap, nodeIds, {
				from,
				to: nodeId('schedules', schedule),
				relationType: 'operationalises',
			});
		}
		for (const topic of entry.data.topics) {
			if (!includeRelationInProfile('explains', false, profile)) continue;
			accumulateEdge(edgeMap, nodeIds, {
				from,
				to: nodeId('topics', topic),
				relationType: 'explains',
			});
		}
	}

	for (const entry of input.parts) {
		const from = nodeId('parts', entry.data.slug);
		for (const article of entry.data.articleSlugs) {
			if (!includeRelationInProfile('contains', false, profile)) continue;
			accumulateEdge(edgeMap, nodeIds, {
				from,
				to: nodeId('articles', article),
				relationType: 'contains',
			});
		}
		for (const topic of entry.data.topics) {
			if (!includeRelationInProfile('explains', false, profile)) continue;
			accumulateEdge(edgeMap, nodeIds, {
				from,
				to: nodeId('topics', topic),
				relationType: 'explains',
			});
		}
	}

	for (const entry of input.schedules) {
		const from = nodeId('schedules', entry.data.slug);
		for (const article of entry.data.relatedArticles) {
			if (!includeRelationInProfile('operationalises', false, profile)) continue;
			accumulateEdge(edgeMap, nodeIds, {
				from,
				to: nodeId('articles', article),
				relationType: 'operationalises',
			});
		}
		for (const topic of entry.data.topics) {
			if (!includeRelationInProfile('explains', false, profile)) continue;
			accumulateEdge(edgeMap, nodeIds, {
				from,
				to: nodeId('topics', topic),
				relationType: 'explains',
			});
		}
	}

	for (const entry of input.topics) {
		const from = nodeId('topics', entry.data.slug);
		for (const part of entry.data.parts) {
			if (!includeRelationInProfile('explains', false, profile)) continue;
			accumulateEdge(edgeMap, nodeIds, {
				from,
				to: nodeId('parts', part),
				relationType: 'explains',
			});
		}
		for (const schedule of entry.data.schedules) {
			if (!includeRelationInProfile('explains', false, profile)) continue;
			accumulateEdge(edgeMap, nodeIds, {
				from,
				to: nodeId('schedules', schedule),
				relationType: 'explains',
			});
		}
	}

	for (const entry of input.institutions) {
		const from = nodeId('institutions', entry.data.slug);
		for (const article of entry.data.articles) {
			if (!includeRelationInProfile('establishes', false, profile)) continue;
			accumulateEdge(edgeMap, nodeIds, {
				from: nodeId('articles', article),
				to: from,
				relationType: 'establishes',
			});
		}
		for (const part of entry.data.parts) {
			if (!includeRelationInProfile('establishes', false, profile)) continue;
			accumulateEdge(edgeMap, nodeIds, {
				from: nodeId('parts', part),
				to: from,
				relationType: 'establishes',
			});
		}
		for (const topic of entry.data.topics) {
			if (!includeRelationInProfile('shapes', false, profile)) continue;
			accumulateEdge(edgeMap, nodeIds, {
				from,
				to: nodeId('topics', topic),
				relationType: 'shapes',
			});
		}
		for (const caseSlug of entry.data.cases) {
			if (!includeRelationInProfile('involves', false, profile)) continue;
			accumulateEdge(edgeMap, nodeIds, {
				from,
				to: nodeId('cases', caseSlug),
				relationType: 'involves',
			});
		}
		for (const issue of entry.data.currentAffairs) {
			if (!includeRelationInProfile('involves', false, profile)) continue;
			accumulateEdge(edgeMap, nodeIds, {
				from,
				to: nodeId('current-affairs', issue),
				relationType: 'involves',
			});
		}
	}

	for (const entry of input.cases) {
		const from = nodeId('cases', entry.data.slug);
		for (const article of entry.data.articles) {
			if (!includeRelationInProfile('interprets', false, profile)) continue;
			accumulateEdge(edgeMap, nodeIds, {
				from,
				to: nodeId('articles', article),
				relationType: 'interprets',
			});
		}
		for (const part of entry.data.parts) {
			if (!includeRelationInProfile('interprets', false, profile)) continue;
			accumulateEdge(edgeMap, nodeIds, {
				from,
				to: nodeId('parts', part),
				relationType: 'interprets',
			});
		}
		for (const schedule of entry.data.schedules) {
			if (!includeRelationInProfile('interprets', false, profile)) continue;
			accumulateEdge(edgeMap, nodeIds, {
				from,
				to: nodeId('schedules', schedule),
				relationType: 'interprets',
			});
		}
		for (const topic of entry.data.topics) {
			if (!includeRelationInProfile('shapes', false, profile)) continue;
			accumulateEdge(edgeMap, nodeIds, {
				from,
				to: nodeId('topics', topic),
				relationType: 'shapes',
			});
		}
	}

	for (const entry of input.amendments) {
		const from = nodeId('amendments', entry.data.slug);
		for (const article of entry.data.affectedArticles) {
			if (!includeRelationInProfile('amends', false, profile)) continue;
			accumulateEdge(edgeMap, nodeIds, {
				from,
				to: nodeId('articles', article),
				relationType: 'amends',
			});
		}
		for (const part of entry.data.affectedParts) {
			if (!includeRelationInProfile('amends', false, profile)) continue;
			accumulateEdge(edgeMap, nodeIds, {
				from,
				to: nodeId('parts', part),
				relationType: 'amends',
			});
		}
		for (const schedule of entry.data.affectedSchedules) {
			if (!includeRelationInProfile('amends', false, profile)) continue;
			accumulateEdge(edgeMap, nodeIds, {
				from,
				to: nodeId('schedules', schedule),
				relationType: 'amends',
			});
		}
		for (const topic of entry.data.topics) {
			if (!includeRelationInProfile('extends', false, profile)) continue;
			accumulateEdge(edgeMap, nodeIds, {
				from,
				to: nodeId('topics', topic),
				relationType: 'extends',
			});
		}
	}

	for (const entry of input.currentAffairs) {
		const from = nodeId('current-affairs', entry.data.slug);
		for (const article of entry.data.articles) {
			if (!includeRelationInProfile('anchors', false, profile)) continue;
			accumulateEdge(edgeMap, nodeIds, {
				from,
				to: nodeId('articles', article),
				relationType: 'anchors',
			});
		}
		for (const part of entry.data.parts) {
			if (!includeRelationInProfile('anchors', false, profile)) continue;
			accumulateEdge(edgeMap, nodeIds, {
				from,
				to: nodeId('parts', part),
				relationType: 'anchors',
			});
		}
		for (const schedule of entry.data.schedules) {
			if (!includeRelationInProfile('anchors', false, profile)) continue;
			accumulateEdge(edgeMap, nodeIds, {
				from,
				to: nodeId('schedules', schedule),
				relationType: 'anchors',
			});
		}
		for (const topic of entry.data.topics) {
			if (!includeRelationInProfile('frames', false, profile)) continue;
			accumulateEdge(edgeMap, nodeIds, {
				from,
				to: nodeId('topics', topic),
				relationType: 'frames',
			});
		}
		for (const caseSlug of entry.data.cases) {
			if (!includeRelationInProfile('frames', false, profile)) continue;
			accumulateEdge(edgeMap, nodeIds, {
				from,
				to: nodeId('cases', caseSlug),
				relationType: 'frames',
			});
		}
		for (const institution of entry.data.institutions) {
			if (!includeRelationInProfile('involves', false, profile)) continue;
			accumulateEdge(edgeMap, nodeIds, {
				from,
				to: nodeId('institutions', institution),
				relationType: 'involves',
			});
		}
	}

	for (const entry of input.glossary) {
		const from = nodeId('glossary', entry.data.slug);
		for (const article of entry.data.relatedArticles) {
			if (!includeRelationInProfile('defines', false, profile)) continue;
			accumulateEdge(edgeMap, nodeIds, {
				from,
				to: nodeId('articles', article),
				relationType: 'defines',
			});
		}
		for (const part of entry.data.relatedParts) {
			if (!includeRelationInProfile('defines', false, profile)) continue;
			accumulateEdge(edgeMap, nodeIds, {
				from,
				to: nodeId('parts', part),
				relationType: 'defines',
			});
		}
		for (const schedule of entry.data.relatedSchedules) {
			if (!includeRelationInProfile('defines', false, profile)) continue;
			accumulateEdge(edgeMap, nodeIds, {
				from,
				to: nodeId('schedules', schedule),
				relationType: 'defines',
			});
		}
		for (const topic of entry.data.topics) {
			if (!includeRelationInProfile('defines', false, profile)) continue;
			accumulateEdge(edgeMap, nodeIds, {
				from,
				to: nodeId('topics', topic),
				relationType: 'defines',
			});
		}
		for (const caseSlug of entry.data.cases) {
			if (!includeRelationInProfile('defines', false, profile)) continue;
			accumulateEdge(edgeMap, nodeIds, {
				from,
				to: nodeId('cases', caseSlug),
				relationType: 'defines',
			});
		}
	}

	for (const entry of input.timeline) {
		const from = nodeId('timeline', entry.data.slug);
		for (const article of entry.data.articleRefs) {
			if (!includeRelationInProfile('chronicles', false, profile)) continue;
			accumulateEdge(edgeMap, nodeIds, {
				from,
				to: nodeId('articles', article),
				relationType: 'chronicles',
			});
		}
		for (const part of entry.data.partRefs) {
			if (!includeRelationInProfile('chronicles', false, profile)) continue;
			accumulateEdge(edgeMap, nodeIds, {
				from,
				to: nodeId('parts', part),
				relationType: 'chronicles',
			});
		}
		for (const schedule of entry.data.scheduleRefs) {
			if (!includeRelationInProfile('chronicles', false, profile)) continue;
			accumulateEdge(edgeMap, nodeIds, {
				from,
				to: nodeId('schedules', schedule),
				relationType: 'chronicles',
			});
		}
		if (entry.data.relatedCollection && entry.data.relatedSlug) {
			if (!includeRelationInProfile('chronicles', false, profile)) continue;
			accumulateEdge(edgeMap, nodeIds, {
				from,
				to: nodeId(entry.data.relatedCollection, entry.data.relatedSlug as string),
				relationType: 'chronicles',
			});
		}
	}

	for (const entry of input.edges) {
		if (!includeRelationInProfile(entry.data.relationType, true, profile)) {
			continue;
		}
		accumulateEdge(edgeMap, nodeIds, {
			from: nodeId(entry.data.fromCollection, entry.data.fromSlug),
			to: nodeId(entry.data.toCollection, entry.data.toSlug),
			relationType: entry.data.relationType,
			explicit: true,
			note: entry.data.note ?? entry.data.summary,
			sources: entry.data.sources,
			strength: explicitStrengthToNumber(entry.data.strength),
		});
	}

	let edges = [...edgeMap.values()].map((edge, index) => finalizeEdge(edge, index));
	let finalNodes = nodes;

	if (profile === 'home' || profile === 'display') {
		const pruned = applyGraphPruning(nodes, edges, profile);
		finalNodes = pruned.nodes;
		edges = pruned.edges;
	}

	hydrateNodeGraphState(finalNodes, edges, profile);

	const legend = familyPriority
		.map((family) => {
			const meta = familyMeta[family];
			return {
				family,
				label: meta.label,
				description: meta.description,
				color: meta.color,
				count: edges.filter((edge) => edge.family === family).length,
			};
		})
		.filter((item) => item.count > 0);

	const stats = [
		{ label: 'Nodes', value: finalNodes.length },
		{ label: 'Relationships', value: edges.length },
		{ label: 'Explicit links', value: edges.filter((edge) => edge.explicit).length },
		{ label: 'Overview nodes', value: finalNodes.filter((node) => node.overview).length },
		{ label: 'Articles', value: input.articles.length, href: withBase('/articles') },
		{ label: 'Cases', value: input.cases.length, href: withBase('/cases') },
	] satisfies GraphStat[];

	return {
		nodes: finalNodes.sort((left, right) => left.label.localeCompare(right.label)),
		edges,
		stats,
		legend,
	};
}

export async function getGraphExplorerData(options: GraphBuildOptions = {}) {
	const [articles, parts, schedules, topics, institutions, cases, glossary, amendments, timeline, currentAffairs, edges] =
		await Promise.all([
			getCollection('articles'),
			getCollection('parts'),
			getCollection('schedules'),
			getCollection('topics'),
			getCollection('institutions'),
			getCollection('cases'),
			getCollection('glossary'),
			getCollection('amendments'),
			getCollection('timeline'),
			getCollection('current-affairs'),
			getCollection('edges'),
		]);

	return buildGraphExplorerData(
		{
			articles,
			parts,
			schedules,
			topics,
			institutions,
			cases,
			glossary,
			amendments,
			timeline,
			currentAffairs,
			edges,
		},
		options,
	);
}
