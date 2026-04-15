import { getCollection, type CollectionEntry } from 'astro:content';
import Graph from 'graphology';
import louvain from 'graphology-communities-louvain';
import betweennessCentrality from 'graphology-metrics/centrality/betweenness.js';
import pagerank from 'graphology-metrics/centrality/pagerank.js';
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
	| 'extends'
	| 'administers'
	| 'appears-in'
	| 'tracked-through'
	| 'sourced-by';

export type GraphEdgeFamily = 'structure' | 'doctrine' | 'change' | 'live' | 'history';

export type GraphRelationDirection = 'forward' | 'reverse' | 'bidirectional' | 'mixed';

export type GraphEvidenceItem = {
	claim: string;
	note: string;
	passage?: string;
	location?: string;
	direction: 'source-to-target' | 'target-to-source' | 'both';
	sources: string[];
	sourceRefs: GraphSourceRef[];
	weight: number;
};

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
	inDegree?: number;
	outDegree?: number;
	weightedDegree?: number;
	pagerank?: number;
	bridgeScore?: number;
	communityId?: number;
	communitySize?: number;
	importance?: number;
	overview: boolean;
	explicitlyConnected: boolean;
};

export type GraphEdgeRelation = {
	from: string;
	to: string;
	relationType: GraphRelationType;
	relationLabel: string;
	explicit: boolean;
	directional: boolean;
	direction: GraphRelationDirection;
	note?: string;
	sources: string[];
	sourceRefs: GraphSourceRef[];
	evidence: GraphEvidenceItem[];
	strength: number;
};

export type GraphSourceRef = {
	slug: string;
	title: string;
	href: string;
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
	directional: boolean;
	direction: GraphRelationDirection;
	dominantSource: string;
	dominantTarget: string;
	note: string;
	sourceCount: number;
	evidenceCount: number;
	weight: number;
};

export type GraphDirectedEdge = {
	id: string;
	source: string;
	target: string;
	relationType: GraphRelationType;
	relationLabel: string;
	family: GraphEdgeFamily;
	familyLabel: string;
	familyColor: string;
	explicit: boolean;
	note: string;
	strength: number;
	sourceCount: number;
	sourceRefs: GraphSourceRef[];
	evidence: GraphEvidenceItem[];
	edgeId: string;
	reversed: boolean;
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
	directedEdges: GraphDirectedEdge[];
	stats: GraphStat[];
	legend: GraphLegendItem[];
	metrics: GraphMetrics;
	communities: GraphCommunity[];
};

export type GraphNodeMetrics = Pick<
	GraphNode,
	'inDegree' | 'outDegree' | 'weightedDegree' | 'pagerank' | 'bridgeScore' | 'communityId' | 'communitySize' | 'importance'
>;

export type GraphCommunity = {
	id: number;
	size: number;
	label: string;
	members: string[];
	anchors: string[];
};

export type GraphMetrics = {
	nodeCount: number;
	edgeCount: number;
	directedEdgeCount: number;
	explicitEdgeCount: number;
	overviewNodeCount: number;
	communityCount: number;
	bridgeNodeCount: number;
	averageDegree: number;
	averageImportance: number;
	topCentralNodes: string[];
	topBridgeNodes: string[];
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
	sources: CollectionEntry<'sources'>[];
	edges: CollectionEntry<'edges'>[];
};

type EdgeContribution = {
	from: string;
	to: string;
	relationType: GraphRelationType;
	explicit?: boolean;
	directional?: boolean;
	note?: string;
	sources?: string[];
	strength?: number;
	evidence?: GraphEvidenceItemContribution[];
};

type GraphEvidenceItemContribution = {
	claim: string;
	note: string;
	passage?: string;
	location?: string;
	direction?: 'source-to-target' | 'target-to-source' | 'both';
	sourceRefs?: string[];
	weight?: number;
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
	directional: boolean;
	directions: Set<GraphRelationDirection>;
	orientationVotes: Map<string, number>;
	evidenceCount: number;
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

function unique<T>(values: T[]) {
	return [...new Set(values)];
}

function relationDirectionFor(edgeSource: string, edgeTarget: string, from: string, to: string): GraphRelationDirection {
	const forward = from === edgeSource && to === edgeTarget;
	const reverse = from === edgeTarget && to === edgeSource;

	if (forward && reverse) {
		return 'bidirectional';
	}

	if (forward) {
		return 'forward';
	}

	if (reverse) {
		return 'reverse';
	}

	return 'mixed';
}

function relationClaimEvidence(
	contribution: EdgeContribution,
	relationLabel: string,
	direction: GraphRelationDirection,
): GraphEvidenceItem[] {
	const evidence = contribution.evidence ?? [];
	const baseEvidence = evidence.length
		? evidence
		: [
				{
					claim: contribution.note ?? relationLabel,
					note: contribution.note ?? relationLabel,
					passage: contribution.note,
					location: undefined,
					direction: direction === 'reverse' ? 'target-to-source' : direction === 'bidirectional' ? 'both' : 'source-to-target',
					sourceRefs: contribution.sources ?? [],
					weight: contribution.strength ?? 3,
				},
			];

	return baseEvidence.map((item) => ({
		claim: item.claim,
		note: item.note,
		passage: item.passage,
		location: item.location,
		direction: item.direction ?? (direction === 'reverse' ? 'target-to-source' : direction === 'bidirectional' ? 'both' : 'source-to-target'),
		sources: item.sourceRefs ?? contribution.sources ?? [],
		sourceRefs: [],
		weight: item.weight ?? contribution.strength ?? 3,
	}));
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
		directional: false,
		directions: new Set<GraphRelationDirection>(),
		orientationVotes: new Map<string, number>(),
		evidenceCount: 0,
		weight: 0,
	};

	const meta = relationMeta[contribution.relationType];
	const relationLabel = meta.label;
	const strength = contribution.strength ?? meta.strength;
	const direction = relationDirectionFor(existing.source, existing.target, contribution.from, contribution.to);
	const evidence = relationClaimEvidence(contribution, relationLabel, direction);
	const orientationKey = direction === 'reverse' ? 'reverse' : direction === 'forward' ? 'forward' : 'mixed';

	existing.relations.push({
		from: contribution.from,
		to: contribution.to,
		relationType: contribution.relationType,
		relationLabel,
		explicit: Boolean(contribution.explicit),
		directional: Boolean(contribution.directional ?? contribution.explicit ?? direction !== 'mixed'),
		direction,
		note: contribution.note,
		sources: contribution.sources ?? [],
		sourceRefs: [],
		evidence,
		strength,
	});
	existing.relationLabels.add(relationLabel);
	existing.relationTypes.add(contribution.relationType);
	existing.families.set(meta.family, (existing.families.get(meta.family) ?? 0) + strength);
	existing.weight = Math.max(existing.weight, strength);
	existing.explicit ||= Boolean(contribution.explicit);
	existing.directional ||= Boolean(contribution.directional ?? contribution.explicit ?? direction !== 'mixed');
	existing.directions.add(direction);
	existing.orientationVotes.set(orientationKey, (existing.orientationVotes.get(orientationKey) ?? 0) + strength);
	existing.evidenceCount += evidence.length;

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

function finalizeEdge(
	edge: EdgeAccumulator,
	index: number,
	sourceIndex: Map<string, GraphSourceRef>,
): GraphEdge {
	const family = pickPrimaryFamily(edge.families);
	const meta = familyMeta[family];
	const note =
		edge.notes[0] ??
		`${edge.relationLabels.size === 1 ? [...edge.relationLabels][0] : 'Several constitutional links'} connect these nodes.`;
	const directionVotes = [...edge.orientationVotes.entries()].sort((left, right) => right[1] - left[1]);
	const dominantOrientation = directionVotes[0]?.[0] ?? 'mixed';
	const direction =
		edge.directions.size <= 1
			? (edge.directions.values().next().value ?? 'mixed')
			: edge.directions.has('forward') && edge.directions.has('reverse')
				? 'bidirectional'
				: 'mixed';
	const dominantSource = dominantOrientation === 'reverse' ? edge.target : edge.source;
	const dominantTarget = dominantOrientation === 'reverse' ? edge.source : edge.target;
	const relations = edge.relations.map((relation) => ({
		...relation,
		sourceRefs: relation.sources
			.map((slug) => sourceIndex.get(slug))
			.filter((value): value is GraphSourceRef => Boolean(value)),
		evidence: relation.evidence.map((item) => ({
			...item,
			sourceRefs: item.sources
				.map((slug) => sourceIndex.get(slug))
				.filter((value): value is GraphSourceRef => Boolean(value)),
		})),
	}));
	const evidenceCount = relations.reduce((total, relation) => total + relation.evidence.length, 0);

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
		relations,
		explicit: edge.explicit,
		directional: edge.directional || direction !== 'mixed',
		direction,
		dominantSource,
		dominantTarget,
		note,
		sourceCount: edge.sourceSlugs.size,
		evidenceCount,
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

	return (node.explicitlyConnected ? 120 : 0) + typeWeight + node.degree * 4 + Math.round((node.importance ?? 0) * 90);
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

function buildDirectedEdges(edges: GraphEdge[]): GraphDirectedEdge[] {
	const directedEdges: GraphDirectedEdge[] = [];

	for (const edge of edges) {
		for (const relation of edge.relations) {
			directedEdges.push({
				id: `${edge.id}:${relation.from}->${relation.to}:${directedEdges.length + 1}`,
				source: relation.from,
				target: relation.to,
				relationType: relation.relationType,
				relationLabel: relation.relationLabel,
				family: edge.family,
				familyLabel: edge.familyLabel,
				familyColor: edge.familyColor,
				explicit: relation.explicit,
				note: relation.note ?? edge.note,
				strength: relation.strength,
				sourceCount: relation.sources.length,
				sourceRefs: relation.sourceRefs,
				evidence: relation.evidence,
				edgeId: edge.id,
				reversed: relation.direction === 'reverse',
			});
		}
	}

	return directedEdges;
}

function buildAnalyticsGraphs(nodes: GraphNode[], directedEdges: GraphDirectedEdge[]) {
	const directedGraph = new Graph({ type: 'directed' });
	const undirectedGraph = new Graph({ type: 'undirected' });

	for (const node of nodes) {
		directedGraph.addNode(node.id, { label: node.label, type: node.type });
		undirectedGraph.addNode(node.id, { label: node.label, type: node.type });
	}

	const directedWeights = new Map<string, number>();
	const undirectedWeights = new Map<string, number>();

	for (const edge of directedEdges) {
		if (!directedGraph.hasNode(edge.source) || !directedGraph.hasNode(edge.target)) {
			continue;
		}

		const directedKey = `${edge.source}-->${edge.target}`;
		directedWeights.set(directedKey, (directedWeights.get(directedKey) ?? 0) + Math.max(1, edge.strength));

		const undirectedKey = pairKey(edge.source, edge.target);
		undirectedWeights.set(undirectedKey, (undirectedWeights.get(undirectedKey) ?? 0) + Math.max(1, edge.strength));
	}

	for (const [key, weight] of directedWeights.entries()) {
		const [source, target] = key.split('-->');
		directedGraph.addDirectedEdgeWithKey(key, source, target, { weight });
	}

	for (const [key, weight] of undirectedWeights.entries()) {
		const [source, target] = key.split('__');
		undirectedGraph.addUndirectedEdgeWithKey(key, source, target, { weight });
	}

	return { directedGraph, undirectedGraph };
}

function buildUndirectedAdjacency(directedEdges: GraphDirectedEdge[]) {
	const adjacency = new Map<string, Map<string, number>>();

	for (const edge of directedEdges) {
		const forward = adjacency.get(edge.source) ?? new Map<string, number>();
		forward.set(edge.target, (forward.get(edge.target) ?? 0) + edge.strength);
		adjacency.set(edge.source, forward);

		const reverse = adjacency.get(edge.target) ?? new Map<string, number>();
		reverse.set(edge.source, (reverse.get(edge.source) ?? 0) + edge.strength);
		adjacency.set(edge.target, reverse);
	}

	return adjacency;
}

function buildOutgoingAdjacency(directedEdges: GraphDirectedEdge[]) {
	const outgoing = new Map<string, GraphDirectedEdge[]>();

	for (const edge of directedEdges) {
		const outList = outgoing.get(edge.source) ?? [];
		outList.push(edge);
		outgoing.set(edge.source, outList);
	}

	return { outgoing };
}

function computeCommunities(nodes: GraphNode[], undirectedGraph: Graph) {
	if (undirectedGraph.order === 0) {
		return { communities: [] as GraphCommunity[], labels: new Map<string, number>() };
	}

	const rawAssignments = louvain(undirectedGraph, { getEdgeWeight: 'weight' }) as Record<string, number | string>;
	const rawCommunityIds = unique(Object.values(rawAssignments).map((value) => String(value))).sort();
	const normalizedIds = new Map(rawCommunityIds.map((value, index) => [value, index + 1]));
	const labels = new Map<string, number>();
	const communityGroups = new Map<number, string[]>();

	for (const node of nodes) {
		const rawId = String(rawAssignments[node.id] ?? node.id);
		const normalizedId = normalizedIds.get(rawId) ?? normalizedIds.size + 1;
		labels.set(node.id, normalizedId);
		const members = communityGroups.get(normalizedId) ?? [];
		members.push(node.id);
		communityGroups.set(normalizedId, members);
	}

	const nodeLookup = new Map(nodes.map((node) => [node.id, node]));
	const communities = [...communityGroups.entries()]
		.sort((left, right) => right[1].length - left[1].length || left[0] - right[0])
		.map(([id, members]) => {
			const anchors = [...members]
				.map((memberId) => nodeLookup.get(memberId))
				.filter((node): node is GraphNode => Boolean(node))
				.sort((leftNode, rightNode) => rightNode.degree - leftNode.degree || leftNode.label.localeCompare(rightNode.label))
				.slice(0, 4)
				.map((node) => node.id);

			return {
				id,
				size: members.length,
				label: `${members.length} node${members.length === 1 ? '' : 's'}`,
				members,
				anchors,
			} satisfies GraphCommunity;
		});

	return { communities, labels };
}

function computeDirectedMetrics(
	nodes: GraphNode[],
	directedEdges: GraphDirectedEdge[],
	labels: Map<string, number>,
) {
	const { directedGraph } = buildAnalyticsGraphs(nodes, directedEdges);
	const { outgoing } = buildOutgoingAdjacency(directedEdges);
	const nodeIds = nodes.map((node) => node.id);
	const weightedOut = new Map<string, number>();
	const weightedIn = new Map<string, number>();
	const outDegree = new Map<string, number>();
	const inDegree = new Map<string, number>();

	for (const nodeId of nodeIds) {
		weightedOut.set(nodeId, 0);
		weightedIn.set(nodeId, 0);
		outDegree.set(nodeId, 0);
		inDegree.set(nodeId, 0);
	}

	for (const edge of directedEdges) {
		weightedOut.set(edge.source, (weightedOut.get(edge.source) ?? 0) + edge.strength);
		weightedIn.set(edge.target, (weightedIn.get(edge.target) ?? 0) + edge.strength);
		outDegree.set(edge.source, (outDegree.get(edge.source) ?? 0) + 1);
		inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
	}
	const pagerankScores = directedGraph.order > 0 ? (pagerank(directedGraph, { getEdgeWeight: 'weight' }) as Record<string, number>) : {};
	const betweennessScores =
		directedGraph.order > 2
			? (betweennessCentrality(directedGraph, { getEdgeWeight: 'weight', normalized: true }) as Record<string, number>)
			: {};
	const pagerankMap = new Map(nodeIds.map((nodeId) => [nodeId, pagerankScores[nodeId] ?? 0]));
	const betweennessMap = new Map(nodeIds.map((nodeId) => [nodeId, betweennessScores[nodeId] ?? 0]));

	const undirected = buildUndirectedAdjacency(directedEdges);
	const bridgeScore = new Map<string, number>();
	const communitySizes = new Map<number, number>();

	for (const label of labels.values()) {
		communitySizes.set(label, (communitySizes.get(label) ?? 0) + 1);
	}

	for (const nodeId of nodeIds) {
		const neighbors = undirected.get(nodeId);
		if (!neighbors || neighbors.size === 0) {
			bridgeScore.set(nodeId, 0);
			continue;
		}

		const communitiesSeen = new Set<number>();
		let totalWeight = 0;
		let crossWeight = 0;

		for (const [neighborId, weight] of neighbors.entries()) {
			totalWeight += weight;
			if ((labels.get(neighborId) ?? -1) !== (labels.get(nodeId) ?? -1)) {
				crossWeight += weight;
			}
			communitiesSeen.add(labels.get(neighborId) ?? -1);
		}

		const crossRatio = totalWeight > 0 ? crossWeight / totalWeight : 0;
		const diversity = Math.max(0, communitiesSeen.size - 1) / Math.max(1, neighbors.size - 1);
		const between = betweennessMap.get(nodeId) ?? 0;
		bridgeScore.set(nodeId, Math.min(1, crossRatio * 0.5 + diversity * 0.2 + between * 0.3));
	}

	const maxDegree = Math.max(1, ...nodeIds.map((nodeId) => (weightedOut.get(nodeId) ?? 0) + (weightedIn.get(nodeId) ?? 0)));
	const maxPagerank = Math.max(1e-9, ...nodeIds.map((nodeId) => pagerankMap.get(nodeId) ?? 0));
	const maxBetweenness = Math.max(1e-9, ...nodeIds.map((nodeId) => betweennessMap.get(nodeId) ?? 0));

	const metricsByNode = new Map<string, GraphNodeMetrics>();
	for (const nodeId of nodeIds) {
		const inDeg = inDegree.get(nodeId) ?? 0;
		const outDeg = outDegree.get(nodeId) ?? 0;
		const weighted = (weightedIn.get(nodeId) ?? 0) + (weightedOut.get(nodeId) ?? 0);
		const pr = (pagerankMap.get(nodeId) ?? 0) / maxPagerank;
		const between = (betweennessMap.get(nodeId) ?? 0) / maxBetweenness;
		const bridge = bridgeScore.get(nodeId) ?? 0;
		const importance = Math.min(1, pr * 0.34 + (weighted / maxDegree) * 0.2 + between * 0.22 + bridge * 0.18 + ((inDeg + outDeg) > 0 ? 0.06 : 0));

		metricsByNode.set(nodeId, {
			inDegree: inDeg,
			outDegree: outDeg,
			weightedDegree: weighted,
			pagerank: pagerankMap.get(nodeId) ?? 0,
			bridgeScore: bridge,
			communityId: labels.get(nodeId) ?? 0,
			communitySize: communitySizes.get(labels.get(nodeId) ?? 0) ?? 0,
			importance,
		});
	}

	return { metricsByNode, pagerank: pagerankMap, betweenness: betweennessMap, inDegree, outDegree, weightedIn, weightedOut, bridgeScore };
}

function assignNodeMetrics(nodes: GraphNode[], metricsByNode: Map<string, GraphNodeMetrics>) {
	for (const node of nodes) {
		const metrics = metricsByNode.get(node.id);
		if (!metrics) {
			continue;
		}

		node.inDegree = metrics.inDegree;
		node.outDegree = metrics.outDegree;
		node.weightedDegree = metrics.weightedDegree;
		node.pagerank = metrics.pagerank;
		node.bridgeScore = metrics.bridgeScore;
		node.communityId = metrics.communityId;
		node.communitySize = metrics.communitySize;
		node.importance = metrics.importance;
	}
}

export type GraphPathResult = {
	found: boolean;
	directed: boolean;
	totalCost: number;
	nodeIds: string[];
	edgeIds: string[];
};

export function findDirectedShortestPath(
	directedEdges: GraphDirectedEdge[],
	startId: string,
	endId: string,
	options: { directed?: boolean } = {},
): GraphPathResult {
	if (!startId || !endId) {
		return { found: false, directed: options.directed ?? true, totalCost: 0, nodeIds: [], edgeIds: [] };
	}

	const directed = options.directed ?? true;
	const adjacency = new Map<string, GraphDirectedEdge[]>();

	for (const edge of directedEdges) {
		const forward = adjacency.get(edge.source) ?? [];
		forward.push(edge);
		adjacency.set(edge.source, forward);

		if (!directed) {
			const reverse = adjacency.get(edge.target) ?? [];
			reverse.push({
				...edge,
				id: `${edge.id}:reverse`,
				source: edge.target,
				target: edge.source,
				reversed: !edge.reversed,
			});
			adjacency.set(edge.target, reverse);
		}
	}

	const distances = new Map<string, number>([[startId, 0]]);
	const previous = new Map<string, { nodeId: string; edgeId: string } | null>([[startId, null]]);
	const queue = new Set<string>([...adjacency.keys(), startId, endId]);

	while (queue.size > 0) {
		let current: string | null = null;
		let currentDistance = Infinity;

		for (const candidate of queue) {
			const distance = distances.get(candidate) ?? Infinity;
			if (distance < currentDistance) {
				current = candidate;
				currentDistance = distance;
			}
		}

		if (!current || currentDistance === Infinity) {
			break;
		}

		queue.delete(current);

		if (current === endId) {
			break;
		}

		for (const edge of adjacency.get(current) ?? []) {
			const weight = 1 / Math.max(1, edge.strength);
			const trial = currentDistance + weight;
			if (trial < (distances.get(edge.target) ?? Infinity)) {
				distances.set(edge.target, trial);
				previous.set(edge.target, { nodeId: current, edgeId: edge.id });
			}
		}
	}

	if (!previous.has(endId)) {
		return { found: false, directed, totalCost: 0, nodeIds: [], edgeIds: [] };
	}

	const nodeIds: string[] = [];
	const edgeIds: string[] = [];
	let current: string | null = endId;
	while (current) {
		nodeIds.unshift(current);
		const previousEntry = previous.get(current) ?? null;
		if (!previousEntry) {
			break;
		}
		edgeIds.unshift(previousEntry.edgeId);
		current = previousEntry.nodeId;
	}

	return {
		found: nodeIds.length > 0,
		directed,
		totalCost: distances.get(endId) ?? 0,
		nodeIds,
		edgeIds,
	};
}

export function buildGraphExplorerData(input: GraphCollectionsInput, options: GraphBuildOptions = {}): GraphExplorerData {
	const profile = options.profile ?? 'display';
	const sourceIndex = new Map(
		input.sources.map((entry) => [
			entry.data.slug,
			{
				slug: entry.data.slug,
				title: entry.data.title,
				href: getEntryHref('sources', entry.data.slug),
			} satisfies GraphSourceRef,
		]),
	);
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
			directional: entry.data.directional,
			note: entry.data.note ?? entry.data.summary,
			sources: entry.data.sources,
			strength: explicitStrengthToNumber(entry.data.strength),
			evidence: entry.data.evidence.map((item) => ({
				claim: item.claim,
				note: item.note,
				passage: item.passage,
				location: item.location,
				direction: item.direction,
				sourceRefs: item.sourceRefs,
				weight: item.weight,
			})),
		});
	}

	let edges = [...edgeMap.values()].map((edge, index) => finalizeEdge(edge, index, sourceIndex));
	let finalNodes = nodes;

	if (profile === 'home' || profile === 'display') {
		const pruned = applyGraphPruning(nodes, edges, profile);
		finalNodes = pruned.nodes;
		edges = pruned.edges;
	}

	hydrateNodeGraphState(finalNodes, edges, profile);
	const directedEdges = buildDirectedEdges(edges);
	const analyticsGraphs = buildAnalyticsGraphs(finalNodes, directedEdges);
	const communities = computeCommunities(finalNodes, analyticsGraphs.undirectedGraph);
	const metrics = computeDirectedMetrics(finalNodes, directedEdges, communities.labels);
	assignNodeMetrics(finalNodes, metrics.metricsByNode);

	const communityLookup = new Map(communities.communities.map((community) => [community.id, community]));
	for (const node of finalNodes) {
		const community = communityLookup.get(node.communityId ?? 0);
		if (community) {
			node.communitySize = community.size;
		}
	}
	for (const community of communities.communities) {
		community.anchors = [...community.members]
			.map((memberId) => finalNodes.find((node) => node.id === memberId))
			.filter((node): node is GraphNode => Boolean(node))
			.sort(
				(leftNode, rightNode) =>
					(rightNode.importance ?? 0) - (leftNode.importance ?? 0) ||
					(rightNode.bridgeScore ?? 0) - (leftNode.bridgeScore ?? 0) ||
					rightNode.degree - leftNode.degree,
			)
			.slice(0, 4)
			.map((node) => node.id);
	}

	const nodeCount = finalNodes.length;
	const edgeCount = edges.length;
	const directedEdgeCount = directedEdges.length;
	const explicitEdgeCount = edges.filter((edge) => edge.explicit).length;
	const overviewNodeCount = finalNodes.filter((node) => node.overview).length;
	const communityCount = communities.communities.length;
	const bridgeNodeCount = finalNodes.filter((node) => (node.bridgeScore ?? 0) >= 0.42).length;
	const averageDegree = nodeCount > 0 ? finalNodes.reduce((sum, node) => sum + node.degree, 0) / nodeCount : 0;
	const averageImportance =
		nodeCount > 0 ? finalNodes.reduce((sum, node) => sum + (node.importance ?? 0), 0) / nodeCount : 0;

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
		{ label: 'Nodes', value: nodeCount },
		{ label: 'Relationships', value: edgeCount },
		{ label: 'Directed edges', value: directedEdgeCount },
		{ label: 'Explicit links', value: explicitEdgeCount },
		{ label: 'Overview nodes', value: overviewNodeCount },
		{ label: 'Communities', value: communityCount },
		{ label: 'Bridge nodes', value: bridgeNodeCount },
		{ label: 'Articles', value: input.articles.length, href: withBase('/articles') },
		{ label: 'Cases', value: input.cases.length, href: withBase('/cases') },
	] satisfies GraphStat[];

	const topCentralNodes = [...finalNodes]
		.sort((left, right) => (right.pagerank ?? 0) - (left.pagerank ?? 0) || (right.importance ?? 0) - (left.importance ?? 0))
		.slice(0, 8)
		.map((node) => node.id);
	const topBridgeNodes = [...finalNodes]
		.sort((left, right) => (right.bridgeScore ?? 0) - (left.bridgeScore ?? 0) || (right.importance ?? 0) - (left.importance ?? 0))
		.slice(0, 8)
		.map((node) => node.id);

	return {
		nodes: finalNodes.sort((left, right) => left.label.localeCompare(right.label)),
		edges,
		directedEdges,
		stats,
		legend,
		metrics: {
			nodeCount,
			edgeCount,
			directedEdgeCount,
			explicitEdgeCount,
			overviewNodeCount,
			communityCount,
			bridgeNodeCount,
			averageDegree,
			averageImportance,
			topCentralNodes,
			topBridgeNodes,
		},
		communities: communities.communities,
	};
}

export async function getGraphExplorerData(options: GraphBuildOptions = {}) {
	const [articles, parts, schedules, topics, institutions, cases, glossary, amendments, timeline, currentAffairs, sources, edges] =
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
			getCollection('sources'),
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
			sources,
			edges,
		},
		options,
	);
}
