import Graph from 'graphology';
import circular from 'graphology-layout/circular';
import forceAtlas2 from 'graphology-layout-forceatlas2';
import dijkstra from 'graphology-shortest-path/dijkstra';
import Sigma from 'sigma';
import type {
	GraphCommunity,
	GraphDirectedEdge,
	GraphEdge,
	GraphExplorerData,
	GraphLegendItem,
	GraphMetrics,
	GraphNode,
	GraphStat,
} from './graph';

type GraphRuntimeDataset = GraphExplorerData & {
	label: string;
	description?: string;
};

type GraphRuntimePayload = {
	datasets: Record<string, GraphRuntimeDataset>;
	initialScope: string;
};

type LayoutMode = 'organic' | 'layered' | 'timeline';
type GraphMode = 'explore' | 'path';

const COLOR_BY_TYPE: Record<string, string> = {
	Article: '#bc6324',
	Part: '#1f4f74',
	Schedule: '#3c7453',
	Topic: '#7a3514',
	Institution: '#355d73',
	Case: '#6b4618',
	Amendment: '#7c6a1b',
	Glossary: '#5d5a4d',
	Timeline: '#556264',
	'Current Affair': '#92473a',
};

function escapeHtml(value: unknown) {
	return String(value)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}

function unique<T>(values: T[]) {
	return [...new Set(values)];
}

function pairKey(left: string, right: string) {
	return [left, right].sort().join('__');
}

function relationTone(direction: GraphDirectedEdge['reversed']) {
	return direction ? 'Reverse relation' : 'Forward relation';
}

function nodeSize(node: GraphNode) {
	const importance = node.importance ?? 0;
	const bridge = node.bridgeScore ?? 0;
	const degree = node.degree ?? 0;
	return Math.max(3.5, Math.min(14, 4 + importance * 7 + bridge * 4 + Math.min(6, degree * 0.3)));
}

function nodeColor(node: GraphNode) {
	return COLOR_BY_TYPE[node.type] ?? '#64584b';
}

function extractYear(node: GraphNode) {
	const text = `${node.label} ${node.subtitle} ${node.summary}`;
	const match = text.match(/\b(18|19|20)\d{2}\b/);
	return match ? Number(match[0]) : null;
}

function laneForNode(node: GraphNode) {
	return {
		Article: 0,
		Part: 0,
		Schedule: 0,
		Amendment: 1,
		Case: 2,
		Topic: 2,
		Institution: 3,
		'Current Affair': 4,
		Timeline: 5,
		Glossary: 6,
	}[node.type] ?? 7;
}

function sortNodes(nodes: GraphNode[]) {
	return [...nodes].sort((left, right) => {
		if (left.type !== right.type) {
			return left.type.localeCompare(right.type);
		}

		const rightScore = (right.importance ?? 0) * 100 + (right.bridgeScore ?? 0) * 40 + right.degree;
		const leftScore = (left.importance ?? 0) * 100 + (left.bridgeScore ?? 0) * 40 + left.degree;
		if (rightScore !== leftScore) {
			return rightScore - leftScore;
		}

		return left.label.localeCompare(right.label);
	});
}

function buildAdjacency(directedEdges: GraphDirectedEdge[]) {
	const undirected = new Map<string, Set<string>>();
	const outgoing = new Map<string, Set<string>>();

	for (const edge of directedEdges) {
		const forward = outgoing.get(edge.source) ?? new Set<string>();
		forward.add(edge.target);
		outgoing.set(edge.source, forward);

		const left = undirected.get(edge.source) ?? new Set<string>();
		left.add(edge.target);
		undirected.set(edge.source, left);

		const right = undirected.get(edge.target) ?? new Set<string>();
		right.add(edge.source);
		undirected.set(edge.target, right);
	}

	return { undirected, outgoing };
}

function buildDatasetGraph(dataset: GraphRuntimeDataset) {
	const graph = new Graph({ type: 'directed', multi: true });

	for (const node of dataset.nodes) {
		graph.addNode(node.id, {
			type: 'circle',
			label: node.label,
			subtitle: node.subtitle,
			summary: node.summary,
			contentType: node.type,
			collection: node.collection,
			slug: node.slug,
			href: node.href,
			degree: node.degree,
			inDegree: node.inDegree ?? 0,
			outDegree: node.outDegree ?? 0,
			weightedDegree: node.weightedDegree ?? node.degree,
			pagerank: node.pagerank ?? 0,
			bridgeScore: node.bridgeScore ?? 0,
			communityId: node.communityId ?? 0,
			communitySize: node.communitySize ?? 0,
			importance: node.importance ?? 0,
			size: nodeSize(node),
			color: nodeColor(node),
		});
	}

	for (const edge of dataset.directedEdges) {
		if (!graph.hasNode(edge.source) || !graph.hasNode(edge.target)) {
			continue;
		}

		graph.addDirectedEdgeWithKey(edge.id, edge.source, edge.target, {
			label: edge.relationLabel,
			relationType: edge.relationType,
			family: edge.family,
			familyLabel: edge.familyLabel,
			color: edge.familyColor,
			weight: Math.max(1, edge.strength),
			size: Math.max(1.2, Math.min(4, edge.strength)),
			explicit: edge.explicit,
			directional: true,
			reversed: edge.reversed,
			sourceCount: edge.sourceCount,
			note: edge.note,
		});
	}

	return graph;
}

function normalizeCoordinates(graph: Graph) {
	const xs: number[] = [];
	const ys: number[] = [];

	graph.forEachNode((node) => {
		const x = Number(graph.getNodeAttribute(node, 'x') ?? 0);
		const y = Number(graph.getNodeAttribute(node, 'y') ?? 0);
		xs.push(x);
		ys.push(y);
	});

	if (xs.length === 0 || ys.length === 0) {
		return;
	}

	const minX = Math.min(...xs);
	const maxX = Math.max(...xs);
	const minY = Math.min(...ys);
	const maxY = Math.max(...ys);
	const spanX = Math.max(1, maxX - minX);
	const spanY = Math.max(1, maxY - minY);
	const scale = Math.max(spanX, spanY);
	const centerX = minX + spanX / 2;
	const centerY = minY + spanY / 2;

	graph.forEachNode((node) => {
		const x = Number(graph.getNodeAttribute(node, 'x') ?? 0);
		const y = Number(graph.getNodeAttribute(node, 'y') ?? 0);
		graph.setNodeAttribute(node, 'x', ((x - centerX) / scale) * 900);
		graph.setNodeAttribute(node, 'y', ((y - centerY) / scale) * 900);
	});
}

async function applyLayout(graph: Graph, layoutMode: LayoutMode, directedEdges: GraphDirectedEdge[]) {
	if (graph.order <= 1) {
		return;
	}

	circular.assign(graph, { scale: 120 });

	if (layoutMode === 'timeline') {
		const nodes = graph.nodes();
		const years = nodes
			.map((node) => extractYear({
				id: node,
				label: String(graph.getNodeAttribute(node, 'label') ?? node),
				subtitle: String(graph.getNodeAttribute(node, 'subtitle') ?? ''),
				summary: String(graph.getNodeAttribute(node, 'summary') ?? ''),
				type: String(graph.getNodeAttribute(node, 'contentType') ?? ''),
				collection: 'articles',
				slug: '',
				href: '#',
				degree: Number(graph.getNodeAttribute(node, 'degree') ?? 0),
				overview: false,
				explicitlyConnected: false,
			}))
			.filter((year): year is number => Number.isFinite(year));
		const minYear = years.length ? Math.min(...years) : 1950;
		const maxYear = years.length ? Math.max(...years) : minYear + 1;
		const fallbackYear = years.length ? Math.round(years.reduce((sum, year) => sum + year, 0) / years.length) : 1950;
		const span = Math.max(1, maxYear - minYear);

		nodes.forEach((nodeId, index) => {
			const node = {
				id: nodeId,
				label: String(graph.getNodeAttribute(nodeId, 'label') ?? nodeId),
				subtitle: String(graph.getNodeAttribute(nodeId, 'subtitle') ?? ''),
				summary: String(graph.getNodeAttribute(nodeId, 'summary') ?? ''),
				type: String(graph.getNodeAttribute(nodeId, 'contentType') ?? ''),
				collection: 'articles',
				slug: '',
				href: '#',
				degree: Number(graph.getNodeAttribute(nodeId, 'degree') ?? 0),
				overview: false,
				explicitlyConnected: false,
			} satisfies GraphNode;
			const year = extractYear(node) ?? fallbackYear;
			const lane = laneForNode(node);
			const community = Number(graph.getNodeAttribute(nodeId, 'communityId') ?? 0);
			const x = ((year - minYear) / span) * 1800 - 900;
			const y = lane * 210 - 630 + ((community % 3) - 1) * 24 + (index % 3) * 8;
			graph.setNodeAttribute(nodeId, 'x', x);
			graph.setNodeAttribute(nodeId, 'y', y);
		});

		return;
	}

	if (layoutMode === 'organic') {
		const iterations = graph.order < 50 ? 45 : graph.order < 120 ? 70 : 90;
		const settings = forceAtlas2.inferSettings(graph);
		forceAtlas2.assign(graph, {
			iterations,
			settings: {
				...settings,
				gravity: Math.max(0.6, settings.gravity ?? 1),
				scalingRatio: Math.max(4, settings.scalingRatio ?? 10),
				strongGravityMode: graph.order > 120,
			},
		});
		normalizeCoordinates(graph);
		return;
	}

	const { default: ELK } = await import('elkjs/lib/elk.bundled.js');
	const elk = new ELK();
	const elkGraph = {
		id: 'graph',
		layoutOptions: {
			'elk.algorithm': 'layered',
			'elk.direction': 'RIGHT',
			'elk.edgeRouting': 'ORTHOGONAL',
			'elk.layered.spacing.nodeNodeBetweenLayers': '70',
			'elk.spacing.nodeNode': '50',
			'elk.layered.nodePlacement.strategy': 'SIMPLE',
			'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
		},
		children: graph.nodes().map((node) => ({
			id: node,
			width: 110 + Math.min(120, String(graph.getNodeAttribute(node, 'label') ?? node).length * 4.5),
			height: 56,
		})),
		edges: directedEdges
			.filter((edge) => graph.hasNode(edge.source) && graph.hasNode(edge.target))
			.map((edge) => ({
				id: edge.id,
				sources: [edge.source],
				targets: [edge.target],
			})),
	};

	const layout = await elk.layout(elkGraph);
	for (const child of layout.children ?? []) {
		if (child.id && typeof child.x === 'number' && typeof child.y === 'number') {
			graph.setNodeAttribute(child.id, 'x', child.x);
			graph.setNodeAttribute(child.id, 'y', child.y);
		}
	}
	normalizeCoordinates(graph);
}

function createVisibleGraph(
	dataset: GraphRuntimeDataset,
	visibleNodeIds: Set<string>,
	visibleEdgeIds: Set<string>,
	state: {
		selectedNodeId: string | null;
		selectedEdgeId: string | null;
		pathNodeIds: string[];
	},
) {
	const graph = new Graph({ type: 'directed', multi: true });

	for (const node of sortNodes(dataset.nodes.filter((item) => visibleNodeIds.has(item.id)))) {
		const isPath = state.pathNodeIds.includes(node.id);
		const isAnchor = node.id === state.selectedNodeId;
		graph.addNode(node.id, {
			type: 'circle',
			label: node.label,
			subtitle: node.subtitle,
			summary: node.summary,
			contentType: node.type,
			collection: node.collection,
			slug: node.slug,
			href: node.href,
			size: nodeSize(node) * (isAnchor ? 1.35 : isPath ? 1.18 : 1),
			color: nodeColor(node),
			borderColor: isAnchor ? '#7a3514' : isPath ? '#20486a' : node.communityId ? '#1f4f74' : '#e9dfd2',
			highlighted: isAnchor || isPath,
			degree: node.degree,
			inDegree: node.inDegree ?? 0,
			outDegree: node.outDegree ?? 0,
			pagerank: node.pagerank ?? 0,
			bridgeScore: node.bridgeScore ?? 0,
			communityId: node.communityId ?? 0,
			communitySize: node.communitySize ?? 0,
			importance: node.importance ?? 0,
		});
	}

	for (const edge of dataset.directedEdges) {
		if (!visibleEdgeIds.has(edge.id)) {
			continue;
		}
		if (!graph.hasNode(edge.source) || !graph.hasNode(edge.target)) {
			continue;
		}

		const isPathEdge = state.pathNodeIds.length > 1 && state.pathNodeIds.some((nodeId, index) => {
			if (index === state.pathNodeIds.length - 1) return false;
			return pairKey(nodeId, state.pathNodeIds[index + 1]) === pairKey(edge.source, edge.target);
		});

		graph.addDirectedEdgeWithKey(edge.id, edge.source, edge.target, {
			label: edge.relationLabel,
			relationType: edge.relationType,
			family: edge.family,
			familyLabel: edge.familyLabel,
			color: edge.familyColor,
			weight: Math.max(1, edge.strength),
			size: Math.max(1.2, Math.min(4, edge.strength)) * (isPathEdge ? 1.2 : 1),
			explicit: edge.explicit,
			directional: true,
			reversed: edge.reversed,
			sourceCount: edge.sourceCount,
			note: edge.note,
			highlighted: isPathEdge,
		});
	}

	return graph;
}

function buildPaths(datasetGraph: Graph, startId: string | null, targetId: string | null) {
	if (!startId || !targetId || !datasetGraph.hasNode(startId) || !datasetGraph.hasNode(targetId)) {
		return [] as string[];
	}

	const path = dijkstra.bidirectional(datasetGraph, startId, targetId, 'weight');
	return path ?? [];
}

function directedNeighborhood(
	directedEdges: GraphDirectedEdge[],
	startNodeId: string,
	hops: number,
) {
	const { undirected } = buildAdjacency(directedEdges);
	const seen = new Set([startNodeId]);
	let frontier = [startNodeId];

	for (let hop = 0; hop < hops; hop += 1) {
		const next: string[] = [];
		for (const current of frontier) {
			for (const neighbor of undirected.get(current) ?? []) {
				if (seen.has(neighbor)) continue;
				seen.add(neighbor);
				next.push(neighbor);
			}
		}
		frontier = next;
	}

	return seen;
}

function weightedPathEdges(dataset: GraphRuntimeDataset, pathNodeIds: string[]) {
	const visible = new Set<string>();
	for (let index = 0; index < pathNodeIds.length - 1; index += 1) {
		visible.add(pairKey(pathNodeIds[index], pathNodeIds[index + 1]));
	}
	return dataset.directedEdges.filter((edge) => visible.has(pairKey(edge.source, edge.target))).map((edge) => edge.id);
}

function renderNodeOptions(root: HTMLElement, nodes: GraphNode[]) {
	const datalist = root.querySelector('[data-graph-node-options]');
	if (!(datalist instanceof HTMLDataListElement)) {
		return;
	}

	datalist.innerHTML = sortNodes(nodes)
		.map((node) => `<option value="${escapeHtml(node.label)}" label="${escapeHtml(`${node.type} • ${node.subtitle}`)}"></option>`)
		.join('');
}

function renderStatPanel(panel: HTMLElement | null, stats: GraphStat[]) {
	if (!(panel instanceof HTMLDivElement)) {
		return;
	}

	panel.innerHTML = stats
		.map((stat) =>
			stat.href
				? `<a class="stat-card" href="${escapeHtml(stat.href)}"><strong>${escapeHtml(stat.value)}</strong><span>${escapeHtml(stat.label)}</span></a>`
				: `<div class="stat-card"><strong>${escapeHtml(stat.value)}</strong><span>${escapeHtml(stat.label)}</span></div>`,
		)
		.join('');
}

function renderLegend(panel: HTMLElement | null, legend: GraphLegendItem[]) {
	if (!(panel instanceof HTMLDivElement)) {
		return;
	}

	panel.innerHTML = legend
		.map(
			(item) => `
				<div class="graph-legend__item" title="${escapeHtml(item.description)}">
					<span class="graph-legend__swatch" style="--legend-color:${escapeHtml(item.color)}"></span>
					<div>
						<strong>${escapeHtml(item.label)}</strong>
						<small>${escapeHtml(item.count)} edges</small>
					</div>
				</div>`,
		)
		.join('');
}

function renderStageMetrics(panel: HTMLElement | null, stats: GraphStat[], dataset: GraphRuntimeDataset) {
	if (!(panel instanceof HTMLDivElement)) {
		return;
	}

	panel.innerHTML = stats
		.slice(0, 3)
		.map((stat) => `<div class="graph-stage__metric"><strong>${escapeHtml(stat.value)}</strong><span>${escapeHtml(stat.label)}</span></div>`)
		.join('');

	const summary = panel.closest('[data-graph-shell]')?.querySelector('[data-graph-scope-summary]');
	if (summary instanceof HTMLElement) {
		summary.textContent = dataset.description ?? `Currently showing the ${dataset.label.toLowerCase()}.`;
	}
}

function renderDetailLink(link: HTMLAnchorElement, href: string | null) {
	if (!href) {
		link.classList.add('is-disabled');
		link.setAttribute('aria-disabled', 'true');
		link.setAttribute('tabindex', '-1');
		link.href = '#';
		return;
	}

	link.classList.remove('is-disabled');
	link.removeAttribute('aria-disabled');
	link.removeAttribute('tabindex');
	link.href = href;
}

function escapeAttr(value: unknown) {
	return escapeHtml(value).replaceAll('`', '&#96;');
}

function hasWebGLSupport() {
	const canvas = document.createElement('canvas');
	return Boolean(
		canvas.getContext('webgl2')
		|| canvas.getContext('webgl')
		|| canvas.getContext('experimental-webgl'),
	);
}

function renderSvgFallback(container: HTMLElement, graph: Graph) {
	const width = Math.max(720, container.clientWidth || 720);
	const height = Math.max(640, container.clientHeight || 780);
	const padding = 42;
	const nodes = graph.nodes().map((nodeId) => ({
		id: nodeId,
		...graph.getNodeAttributes(nodeId),
	})) as Array<{
		id: string;
		label?: string;
		x?: number;
		y?: number;
		size?: number;
		color?: string;
		highlighted?: boolean;
		pagerank?: number;
	}>;

	if (!nodes.length) {
		container.innerHTML = '<div class="graph-fallback-empty">No graph nodes are available for this view.</div>';
		return;
	}

	const xs = nodes.map((node) => Number(node.x ?? 0));
	const ys = nodes.map((node) => Number(node.y ?? 0));
	const minX = Math.min(...xs);
	const maxX = Math.max(...xs);
	const minY = Math.min(...ys);
	const maxY = Math.max(...ys);
	const spanX = Math.max(1, maxX - minX);
	const spanY = Math.max(1, maxY - minY);
	const scale = Math.min((width - padding * 2) / spanX, (height - padding * 2) / spanY);
	const innerWidth = spanX * scale;
	const innerHeight = spanY * scale;
	const offsetX = padding + (width - padding * 2 - innerWidth) / 2;
	const offsetY = padding + (height - padding * 2 - innerHeight) / 2;
	const project = (x: number, y: number) => ({
		x: offsetX + (x - minX) * scale,
		y: offsetY + (y - minY) * scale,
	});

	const edges = graph.edges().map((edgeId) => {
		const source = graph.source(edgeId);
		const target = graph.target(edgeId);
		return {
			id: edgeId,
			source,
			target,
			...graph.getEdgeAttributes(edgeId),
		};
	}) as Array<{
		id: string;
		source: string;
		target: string;
		color?: string;
		size?: number;
		highlighted?: boolean;
	}>;

	const labels = [...nodes]
		.sort((left, right) => {
			const rightScore = Number(right.highlighted ? 100 : 0) + Number(right.pagerank ?? 0) * 100 + Number(right.size ?? 0);
			const leftScore = Number(left.highlighted ? 100 : 0) + Number(left.pagerank ?? 0) * 100 + Number(left.size ?? 0);
			return rightScore - leftScore;
		})
		.slice(0, 14)
		.map((node) => node.id);
	const labelSet = new Set(labels);

	const edgeMarkup = edges
		.map((edge) => {
			const source = nodes.find((node) => node.id === edge.source);
			const target = nodes.find((node) => node.id === edge.target);
			if (!source || !target) return '';
			const from = project(Number(source.x ?? 0), Number(source.y ?? 0));
			const to = project(Number(target.x ?? 0), Number(target.y ?? 0));
			return `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" stroke="${escapeAttr(edge.color ?? '#9c8d7b')}" stroke-width="${Math.max(1.1, Number(edge.size ?? 1) * 0.9)}" stroke-opacity="${edge.highlighted ? '0.92' : '0.42'}" stroke-linecap="round" />`;
		})
		.join('');

	const nodeMarkup = nodes
		.map((node) => {
			const point = project(Number(node.x ?? 0), Number(node.y ?? 0));
			const radius = Math.max(4, Math.min(15, Number(node.size ?? 6) * 1.18));
			const label = labelSet.has(node.id) && node.label
				? `<text x="${point.x + radius + 5}" y="${point.y - radius - 2}" class="graph-fallback__label">${escapeHtml(node.label)}</text>`
				: '';
			return `
				<g class="graph-fallback__node${node.highlighted ? ' is-highlighted' : ''}">
					<circle cx="${point.x}" cy="${point.y}" r="${radius}" fill="${escapeAttr(node.color ?? '#b55e24')}" fill-opacity="${node.highlighted ? '0.96' : '0.88'}" stroke="${node.highlighted ? '#7a3514' : 'rgba(255,255,255,0.85)'}" stroke-width="${node.highlighted ? '2.6' : '1.2'}" />
					${label}
				</g>
			`;
		})
		.join('');

	container.innerHTML = `
		<div class="graph-fallback-note">Stable graph view</div>
		<svg class="graph-fallback" viewBox="0 0 ${width} ${height}" role="img" aria-label="Constitutional relationship graph fallback">
			<rect x="0" y="0" width="${width}" height="${height}" rx="24" fill="rgba(255,252,246,0.98)" />
			<g>${edgeMarkup}</g>
			<g>${nodeMarkup}</g>
		</svg>
	`;
}

function graphBounds(graph: Graph) {
	const xs: number[] = [];
	const ys: number[] = [];

	graph.forEachNode((nodeId) => {
		xs.push(Number(graph.getNodeAttribute(nodeId, 'x') ?? 0));
		ys.push(Number(graph.getNodeAttribute(nodeId, 'y') ?? 0));
	});

	if (!xs.length || !ys.length) {
		return null;
	}

	const minX = Math.min(...xs);
	const maxX = Math.max(...xs);
	const minY = Math.min(...ys);
	const maxY = Math.max(...ys);
	const span = Math.max(maxX - minX, maxY - minY, 1);
	const pad = Math.max(18, span * 0.08);

	return {
		x: [minX - pad, maxX + pad] as [number, number],
		y: [minY - pad, maxY + pad] as [number, number],
	};
}

function mountSigmaGraph(
	container: HTMLElement,
	graph: Graph,
) {
	if (!hasWebGLSupport()) {
		throw new Error('WebGL is unavailable in this browser or environment.');
	}

	return new Sigma(graph, container, {
		renderLabels: true,
		renderEdgeLabels: false,
		labelRenderedSizeThreshold: 7,
		minCameraRatio: 0.05,
		maxCameraRatio: 25,
		hideEdgesOnMove: true,
		hideLabelsOnMove: true,
	});
}

export function mountGraphExplorer(root: HTMLElement) {
	const payloadScript = root.querySelector('[data-graph-payload]');
	const canvas = root.querySelector('[data-graph-canvas]');
	const startInput = root.querySelector('[data-graph-start]');
	const targetInput = root.querySelector('[data-graph-target]');
	const targetField = root.querySelector('[data-graph-target-field]');
	const filterBar = root.querySelector('[data-graph-filters]');
	const modeBar = root.querySelector('[data-graph-modes]');
	const depthBar = root.querySelector('[data-graph-depths]');
	const scopeBar = root.querySelector('[data-graph-scopes]');
	const layoutBar = root.querySelector('[data-graph-layouts]');
	const scopeSummary = root.querySelector('[data-graph-scope-summary]');
	const stageMetrics = root.querySelector('[data-graph-stage-metrics]');
	const statsPanel = root.querySelector('[data-graph-stats]');
	const legendPanel = root.querySelector('[data-graph-legend]');
	const presetButtons = [...root.querySelectorAll('[data-graph-preset]')];
	const resetButton = root.querySelector('[data-graph-reset]');
	const viewSummary = root.querySelector('[data-graph-view-summary]');
	const detailTitle = root.querySelector('[data-detail-title]');
	const detailSummary = root.querySelector('[data-detail-summary]');
	const detailMeta = root.querySelector('[data-detail-meta]');
	const detailChips = root.querySelector('[data-detail-chips]');
	const detailPanel = root.querySelector('[data-detail-panel]');
	const detailLink = root.querySelector('[data-detail-link]');

	if (
		!(payloadScript instanceof HTMLScriptElement) ||
		!(canvas instanceof HTMLDivElement) ||
		!(startInput instanceof HTMLInputElement) ||
		!(targetInput instanceof HTMLInputElement) ||
		!(targetField instanceof HTMLElement) ||
		!(filterBar instanceof HTMLDivElement) ||
		!(modeBar instanceof HTMLDivElement) ||
		!(depthBar instanceof HTMLDivElement) ||
		!(resetButton instanceof HTMLButtonElement) ||
		!(viewSummary instanceof HTMLDivElement) ||
		!(detailTitle instanceof HTMLElement) ||
		!(detailSummary instanceof HTMLElement) ||
		!(detailMeta instanceof HTMLElement) ||
		!(detailChips instanceof HTMLDivElement) ||
		!(detailPanel instanceof HTMLDivElement) ||
		!(detailLink instanceof HTMLAnchorElement)
	) {
		return;
	}

	const payload = JSON.parse(payloadScript.textContent ?? '{"datasets":{"default":{"nodes":[],"edges":[],"directedEdges":[],"stats":[],"legend":[],"metrics":{"nodeCount":0,"edgeCount":0,"directedEdgeCount":0,"explicitEdgeCount":0,"overviewNodeCount":0,"communityCount":0,"bridgeNodeCount":0,"averageDegree":0,"averageImportance":0,"topCentralNodes":[],"topBridgeNodes":[]}}},"initialScope":"default"}') as GraphRuntimePayload;
	const datasets = payload.datasets ?? {};
	const datasetIds = Object.keys(datasets);
	let activeScope = payload.initialScope && datasets[payload.initialScope] ? payload.initialScope : datasetIds[0];
	let activeMode: GraphMode = 'explore';
	let activeLayout: LayoutMode = 'organic';
	let activeFilter = 'All';
	let activeDepth: 1 | 2 = 1;
	let selectedNodeId: string | null = null;
	let selectedEdgeId: string | null = null;
	let startNodeId: string | null = null;
	let targetNodeId: string | null = null;
	let pathNodeIds: string[] = [];
	let sigma: Sigma | null = null;
	let renderToken = 0;
	let usingFallback = false;

	function showGraphError(error: unknown) {
		const rawMessage = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
		const friendlyMessage = rawMessage.includes('WebGL')
			|| rawMessage.includes('blendFunc')
			? 'WebGL is unavailable, so the interactive graph switched to a static fallback view.'
			: rawMessage;
		viewSummary.textContent = `Graph failed to render: ${friendlyMessage}`;
		detailTitle.textContent = 'Graph error';
		detailSummary.textContent = friendlyMessage;
		detailMeta.textContent = 'Runtime failure';
		detailChips.innerHTML = '';
		detailPanel.innerHTML = `
			<p class="muted">The graph runtime could not acquire the rendering stack it needs.</p>
			<p class="muted">Try a modern browser with hardware acceleration enabled. Chrome, Edge, Safari, and Firefox should all work when WebGL is available.</p>
		`;
		renderDetailLink(detailLink, null);
	}

	function datasetFor(scopeId: string) {
		return datasets[scopeId] ?? datasets[datasetIds[0]];
	}

	function seedFromActivePreset() {
		const activePreset = presetButtons.find(
			(button) => button.classList.contains('is-active') && !button.disabled,
		) as HTMLButtonElement | undefined;
		if (!activePreset) {
			return;
		}

		activeMode = (activePreset.getAttribute('data-graph-preset-mode') as GraphMode) ?? 'explore';
		activeDepth = (Number(activePreset.getAttribute('data-graph-preset-depth') ?? '1') as 1 | 2) || 1;
		activeFilter = activePreset.getAttribute('data-graph-preset-filter') ?? 'All';
		startNodeId = activePreset.getAttribute('data-graph-preset-start-id');
		targetNodeId = activeMode === 'path' ? activePreset.getAttribute('data-graph-preset-target-id') : null;
		selectedNodeId = activeMode === 'explore' ? startNodeId : null;
	}

	function refreshScopeControls() {
		scopeBar?.querySelectorAll('[data-graph-scope]').forEach((button) => {
			button.classList.toggle('is-active', button.getAttribute('data-graph-scope') === activeScope);
		});

		layoutBar?.querySelectorAll('[data-graph-layout]').forEach((button) => {
			button.classList.toggle('is-active', button.getAttribute('data-graph-layout') === activeLayout);
		});

		modeBar.querySelectorAll('[data-graph-mode]').forEach((button) => {
			button.classList.toggle('is-active', button.getAttribute('data-graph-mode') === activeMode);
		});

		depthBar.querySelectorAll('[data-graph-depth]').forEach((button) => {
			button.classList.toggle('is-active', Number(button.getAttribute('data-graph-depth')) === activeDepth);
		});

		filterBar.querySelectorAll('[data-graph-filter]').forEach((button) => {
			button.classList.toggle('is-active', button.getAttribute('data-graph-filter') === activeFilter);
		});

		targetField.classList.toggle('is-hidden', activeMode !== 'path');
	}

	function syncPresetAvailability(dataset: GraphRuntimeDataset) {
		const nodeIds = new Set(dataset.nodes.map((node) => node.id));
		presetButtons.forEach((button) => {
			const startId = button.getAttribute('data-graph-preset-start-id');
			const targetId = button.getAttribute('data-graph-preset-target-id');
			const isAvailable = Boolean(startId && nodeIds.has(startId) && (!targetId || nodeIds.has(targetId)));
			button.disabled = !isAvailable;
			button.classList.toggle('is-disabled', !isAvailable);
		});
	}

	function syncInputs() {
		const dataset = datasetFor(activeScope);
		const nodeMap = new Map(dataset.nodes.map((node) => [node.id, node]));
		startInput.value = startNodeId ? nodeMap.get(startNodeId)?.label ?? '' : '';
		targetInput.value = targetNodeId ? nodeMap.get(targetNodeId)?.label ?? '' : '';
	}

	function nodeMapFor(dataset: GraphRuntimeDataset) {
		return new Map(dataset.nodes.map((node) => [node.id, node]));
	}

	function edgeMapFor(dataset: GraphRuntimeDataset) {
		return new Map(dataset.directedEdges.map((edge) => [edge.id, edge]));
	}

	function relationMapFor(dataset: GraphRuntimeDataset) {
		return new Map(dataset.edges.map((edge) => [edge.id, edge]));
	}

	function resolveNodeId(dataset: GraphRuntimeDataset, rawValue: string) {
		const value = rawValue.trim().toLowerCase();
		if (!value) {
			return null;
		}

		const exact = dataset.nodes.find((node) => node.label.toLowerCase() === value);
		if (exact) {
			return exact.id;
		}

		const exactSlug = dataset.nodes.find((node) => node.slug.toLowerCase() === value);
		if (exactSlug) {
			return exactSlug.id;
		}

		const fuzzy = dataset.nodes.find((node) => `${node.label} ${node.subtitle} ${node.summary}`.toLowerCase().includes(value));
		return fuzzy?.id ?? null;
	}

	function renderChips(values: string[]) {
		return unique(values)
			.filter(Boolean)
			.map((value) => `<span class="tag-chip">${escapeHtml(value)}</span>`)
			.join('');
	}

	function renderSourceLinks(sourceRefs: { href: string; title: string }[]) {
		if (!sourceRefs.length) {
			return '';
		}

		return `
			<div class="graph-source-links">
				${sourceRefs.map((sourceRef) => `<a class="graph-source-link" href="${escapeHtml(sourceRef.href)}">${escapeHtml(sourceRef.title)}</a>`).join('')}
			</div>
		`;
	}

	function renderDetail(dataset: GraphRuntimeDataset, graph: Graph, visibleEdgeIds: Set<string>) {
		const nodeMap = nodeMapFor(dataset);
		const edgeMap = edgeMapFor(dataset);
		const relationMap = relationMapFor(dataset);

		if (activeMode === 'path' && pathNodeIds.length > 0) {
			const steps = [];
			for (let index = 0; index < pathNodeIds.length - 1; index += 1) {
				const from = nodeMap.get(pathNodeIds[index]);
				const to = nodeMap.get(pathNodeIds[index + 1]);
				const directedEdge = dataset.directedEdges.find((edge) => edge.source === pathNodeIds[index] && edge.target === pathNodeIds[index + 1])
					?? dataset.directedEdges.find((edge) => edge.source === pathNodeIds[index + 1] && edge.target === pathNodeIds[index]);
				if (!from || !to || !directedEdge) {
					continue;
				}

				steps.push(`
					<li class="graph-related-list__item">
						<div>
							<a href="${from.href}">${escapeHtml(from.label)}</a>
							<small>${escapeHtml(directedEdge.relationLabel)}</small>
						</div>
						<span class="graph-path-arrow">→</span>
						<a href="${to.href}">${escapeHtml(to.label)}</a>
					</li>
				`);
			}

			detailTitle.textContent = 'Shortest constitutional path';
			detailSummary.textContent = `${nodeMap.get(pathNodeIds[0])?.label ?? 'Start'} to ${nodeMap.get(pathNodeIds[pathNodeIds.length - 1])?.label ?? 'target'}`;
			detailMeta.textContent = `${pathNodeIds.length} nodes • ${Math.max(0, pathNodeIds.length - 1)} relationships • ${activeLayout} layout`;
			detailChips.innerHTML = renderChips(['Path mode', `Scope: ${dataset.label}`, activeLayout === 'layered' ? 'Layered layout' : 'Organic layout']);
			detailPanel.innerHTML = `<ol class="graph-related-list graph-related-list--path">${steps.join('')}</ol>`;
			renderDetailLink(detailLink, null);
			return;
		}

		if (selectedEdgeId && edgeMap.has(selectedEdgeId)) {
			const edge = edgeMap.get(selectedEdgeId)!;
			const left = nodeMap.get(edge.source);
			const right = nodeMap.get(edge.target);

			if (!left || !right) {
				return;
			}

			detailTitle.textContent = edge.familyLabel;
			detailSummary.textContent = edge.note;
			detailMeta.textContent = `${left.label} → ${right.label} • ${edge.directional ? edge.direction : 'undirected'} • ${edge.evidenceCount} evidence item${edge.evidenceCount === 1 ? '' : 's'}`;
			detailChips.innerHTML = renderChips([
				...edge.relationLabels,
				edge.explicit ? 'Explicit edge' : 'Derived link',
				edge.sourceCount ? `${edge.sourceCount} source${edge.sourceCount === 1 ? '' : 's'}` : '',
			]);
			detailPanel.innerHTML = `
				<div class="graph-detail__section">
					<strong>Why these are linked</strong>
					<div class="graph-detail__relations">
						${edge.relations
							.map(
								(relation) => `
									<article class="graph-relation-card">
										<div class="graph-connection-card__header">
											<p class="graph-relation-card__title">${escapeHtml(relation.relationLabel)}</p>
											<small>${escapeHtml(relation.direction === 'reverse' ? 'Reverse relation' : relation.direction === 'bidirectional' ? 'Bidirectional relation' : 'Forward relation')}</small>
										</div>
										<p>${escapeHtml(relation.note ?? edge.note)}</p>
										<div class="graph-detail__evidence">
											${relation.evidence
												.map(
													(item) => `
														<div class="graph-evidence-card">
															<strong>${escapeHtml(item.claim)}</strong>
															<p>${escapeHtml(item.note)}</p>
															<div class="graph-evidence-card__meta">
																${item.location ? `<span>${escapeHtml(item.location)}</span>` : ''}
																<span>${escapeHtml(item.direction === 'both' ? 'Bidirectional support' : item.direction === 'target-to-source' ? 'Target to source' : 'Source to target')}</span>
															</div>
															${item.passage ? `<small>${escapeHtml(item.passage)}</small>` : ''}
															${renderSourceLinks(item.sourceRefs)}
														</div>`,
												)
												.join('')}
										</div>
										${renderSourceLinks(relation.sourceRefs)}
									</article>`,
							)
							.join('')}
					</div>
				</div>
				<div class="graph-detail__section">
					<strong>Linked pages</strong>
					<ul class="graph-related-list">
						<li class="graph-related-list__item"><a href="${left.href}">${escapeHtml(left.label)}</a><small>${escapeHtml(left.type)}</small></li>
						<li class="graph-related-list__item"><a href="${right.href}">${escapeHtml(right.label)}</a><small>${escapeHtml(right.type)}</small></li>
					</ul>
				</div>
			`;
			renderDetailLink(detailLink, null);
			return;
		}

		if (selectedNodeId && nodeMap.has(selectedNodeId)) {
			const node = nodeMap.get(selectedNodeId)!;
			const neighbors = dataset.directedEdges
				.filter((edge) => visibleEdgeIds.has(edge.id) && (edge.source === node.id || edge.target === node.id))
				.map((edge) => {
					const otherId = edge.source === node.id ? edge.target : edge.source;
					return {
						edge,
						node: nodeMap.get(otherId),
					};
				})
				.filter((entry): entry is { edge: GraphDirectedEdge; node: GraphNode } => Boolean(entry.node))
				.slice(0, 10);

			detailTitle.textContent = node.label;
			detailSummary.textContent = node.summary;
			detailMeta.textContent = `${node.type} • ${node.degree} direct link${node.degree === 1 ? '' : 's'} • ${node.subtitle}`;
			detailChips.innerHTML = renderChips([
				node.type,
				node.collection,
				node.communityId ? `Community ${node.communityId}` : '',
				node.bridgeScore && node.bridgeScore > 0.25 ? 'Bridge node' : '',
				typeof node.pagerank === 'number' && node.pagerank > 0 ? `PageRank ${node.pagerank.toFixed(3)}` : '',
			]);
			detailPanel.innerHTML = neighbors.length
				? `
					<div class="graph-detail__section">
						<strong>Why this node matters</strong>
						<div class="graph-connection-list">
							${neighbors
								.map(
									(item) => `
										<article class="graph-connection-card">
											<div class="graph-connection-card__header">
												<a class="graph-connection-card__title" href="${item.node.href}">${escapeHtml(item.node.label)}</a>
												<span class="graph-connection-card__meta">${escapeHtml(item.edge.relationLabel)}</span>
											</div>
											<div class="graph-connection-card__tags">
												${renderChips([
													item.edge.familyLabel,
													item.edge.directional ? relationTone(item.edge.reversed) : 'Derived',
												])}
											</div>
											<p class="graph-connection-card__note">${escapeHtml(item.edge.note)}</p>
											${renderSourceLinks(item.edge.sourceRefs)}
										</article>`,
								)
								.join('')}
						</div>
					</div>
				`
				: '<p class="muted">No direct neighbors are currently visible for this node.</p>';
			renderDetailLink(detailLink, node.href);
			return;
		}

		detailTitle.textContent = 'Curated overview';
		detailSummary.textContent = 'Select a node, edge, or preset to open a tighter constitutional neighborhood.';
		detailMeta.textContent = `${dataset.label} • ${dataset.metrics.nodeCount} nodes • ${dataset.metrics.directedEdgeCount} directed edges`;
		detailChips.innerHTML = renderChips([
			`Community count: ${dataset.metrics.communityCount}`,
			`Bridge nodes: ${dataset.metrics.bridgeNodeCount}`,
		]);
		detailPanel.innerHTML = `
			<p class="muted">Typed edges are color-coded by family and direction so you can distinguish structure, doctrine, reform, live dispute, and history immediately.</p>
			<div class="graph-detail__section">
				<strong>Central constitutional anchors</strong>
				<ul class="graph-related-list">
					${dataset.metrics.topCentralNodes
						.slice(0, 5)
						.map((nodeId) => {
							const node = nodeMap.get(nodeId);
							if (!node) return '';
							return `<li class="graph-related-list__item"><a href="${node.href}">${escapeHtml(node.label)}</a><small>${escapeHtml(node.type)}</small></li>`;
						})
						.join('')}
				</ul>
			</div>
			<div class="graph-detail__section">
				<strong>Bridge nodes</strong>
				<ul class="graph-related-list">
					${dataset.metrics.topBridgeNodes
						.slice(0, 5)
						.map((nodeId) => {
							const node = nodeMap.get(nodeId);
							if (!node) return '';
							return `<li class="graph-related-list__item"><a href="${node.href}">${escapeHtml(node.label)}</a><small>${escapeHtml(node.type)}</small></li>`;
						})
						.join('')}
				</ul>
			</div>
		`;
		renderDetailLink(detailLink, null);
	}

	function viewSummaryText(dataset: GraphRuntimeDataset) {
		const fallbackPrefix = usingFallback ? 'Stable graph view. ' : '';
		if (activeMode === 'path' && pathNodeIds.length > 0) {
			return `${fallbackPrefix}${dataset.label}: shortest path mode connects ${pathNodeIds.length} nodes through ${activeLayout} layout.`;
		}

		if (activeMode === 'explore' && selectedNodeId) {
			return `${fallbackPrefix}${dataset.label}: focused neighborhood with ${activeDepth}-hop traversal, ${activeLayout} layout${activeFilter !== 'All' ? `, filtered to ${activeFilter}` : ''}.`;
		}

		return `${fallbackPrefix}${dataset.label}: ${dataset.metrics.nodeCount} nodes, ${dataset.metrics.directedEdgeCount} directed edges, ${dataset.metrics.communityCount} communities${activeFilter !== 'All' ? `, filtered to ${activeFilter}` : ''}.`;
	}

	async function render() {
		try {
		const token = ++renderToken;
		const dataset = datasetFor(activeScope);
		if (!dataset) {
			return;
		}

		refreshScopeControls();
		renderStageMetrics(stageMetrics, dataset.stats, dataset);
		renderStatPanel(statsPanel, dataset.stats);
		renderLegend(legendPanel, dataset.legend);
		renderNodeOptions(root, dataset.nodes);
		syncPresetAvailability(dataset);
		syncInputs();

		const nodeMap = nodeMapFor(dataset);
		let activeNodeSet = new Set<string>();
		const visibleEdgeIds = new Set<string>();
		const undirectedAdjacency = buildAdjacency(dataset.directedEdges).undirected;

		if (activeMode === 'path' && startNodeId && targetNodeId) {
			const datasetGraph = buildDatasetGraph(dataset);
			pathNodeIds = buildPaths(datasetGraph, startNodeId, targetNodeId);

			if (pathNodeIds.length > 0) {
				pathNodeIds.forEach((nodeId) => activeNodeSet.add(nodeId));
				weightedPathEdges(dataset, pathNodeIds).forEach((edgeId) => visibleEdgeIds.add(edgeId));
				for (const nodeId of pathNodeIds) {
					for (const neighbor of undirectedAdjacency.get(nodeId) ?? []) {
						activeNodeSet.add(neighbor);
					}
				}
			} else if (startNodeId) {
				directedNeighborhood(dataset.directedEdges, startNodeId, 1).forEach((nodeId) => activeNodeSet.add(nodeId));
			}
		} else if (activeMode === 'explore' && selectedNodeId) {
			directedNeighborhood(dataset.directedEdges, selectedNodeId, activeDepth).forEach((nodeId) => activeNodeSet.add(nodeId));
		}

		if (activeNodeSet.size === 0) {
			dataset.nodes.filter((node) => node.overview).forEach((node) => activeNodeSet.add(node.id));
		}

		if (activeFilter !== 'All') {
			const filteredIds = new Set(
				[...activeNodeSet].filter((nodeId) => {
					if (nodeId === selectedNodeId || nodeId === startNodeId || nodeId === targetNodeId || pathNodeIds.includes(nodeId)) {
						return true;
					}
					return nodeMap.get(nodeId)?.type === activeFilter;
				}),
			);

			if (filteredIds.size > 0) {
				activeNodeSet = filteredIds;
			}
		}

		for (const edge of dataset.directedEdges) {
			if (activeNodeSet.has(edge.source) && activeNodeSet.has(edge.target)) {
				visibleEdgeIds.add(edge.id);
			}
		}

		if (selectedEdgeId && !visibleEdgeIds.has(selectedEdgeId)) {
			selectedEdgeId = null;
		}

		const visibleGraph = createVisibleGraph(
			dataset,
			activeNodeSet,
			visibleEdgeIds,
			{
				selectedNodeId,
				selectedEdgeId,
				pathNodeIds,
			},
		);

		if (visibleGraph.order > 1) {
			await applyLayout(visibleGraph, activeLayout, dataset.directedEdges);
		}

		if (token !== renderToken) {
			return;
		}

		sigma?.kill();
		sigma = null;
		usingFallback = true;
		canvas.innerHTML = '';
		renderSvgFallback(canvas, visibleGraph);

		viewSummary.textContent = viewSummaryText(dataset);
		renderDetail(dataset, visibleGraph, visibleEdgeIds);
		} catch (error) {
			showGraphError(error);
		}
	}

	modeBar.addEventListener('click', (event) => {
		const button = (event.target as HTMLElement | null)?.closest('[data-graph-mode]');
		if (!(button instanceof HTMLButtonElement)) {
			return;
		}

		activeMode = (button.getAttribute('data-graph-mode') as GraphMode) ?? 'explore';
		if (activeMode === 'explore') {
			targetNodeId = null;
		}
		if (activeMode === 'path' && !startNodeId && datasetFor(activeScope).nodes[0]) {
			startNodeId = datasetFor(activeScope).nodes[0].id;
		}
		void render();
	});

	layoutBar?.addEventListener('click', (event) => {
		const button = (event.target as HTMLElement | null)?.closest('[data-graph-layout]');
		if (!(button instanceof HTMLButtonElement)) {
			return;
		}

		activeLayout = (button.getAttribute('data-graph-layout') as LayoutMode) ?? 'organic';
		void render();
	});

	scopeBar?.addEventListener('click', (event) => {
		const button = (event.target as HTMLElement | null)?.closest('[data-graph-scope]');
		if (!(button instanceof HTMLButtonElement)) {
			return;
		}

		const scopeId = button.getAttribute('data-graph-scope');
		if (!scopeId || scopeId === activeScope) {
			return;
		}

		activeScope = scopeId;
		selectedNodeId = null;
		selectedEdgeId = null;
		startNodeId = null;
		targetNodeId = null;
		pathNodeIds = [];
		void render();
	});

	depthBar.addEventListener('click', (event) => {
		const button = (event.target as HTMLElement | null)?.closest('[data-graph-depth]');
		if (!(button instanceof HTMLButtonElement)) {
			return;
		}

		activeDepth = (Number(button.getAttribute('data-graph-depth')) as 1 | 2) || 1;
		void render();
	});

	filterBar.addEventListener('click', (event) => {
		const button = (event.target as HTMLElement | null)?.closest('[data-graph-filter]');
		if (!(button instanceof HTMLButtonElement)) {
			return;
		}

		activeFilter = button.getAttribute('data-graph-filter') ?? 'All';
		void render();
	});

	root.querySelector('[data-graph-presets]')?.addEventListener('click', (event) => {
		const button = (event.target as HTMLElement | null)?.closest('[data-graph-preset]');
		if (!(button instanceof HTMLButtonElement)) {
			return;
		}

		if (button.disabled) {
			return;
		}

		activeMode = (button.getAttribute('data-graph-preset-mode') as GraphMode) ?? 'explore';
		activeDepth = (Number(button.getAttribute('data-graph-preset-depth') ?? '1') as 1 | 2) || 1;
		activeFilter = button.getAttribute('data-graph-preset-filter') ?? 'All';
		selectedEdgeId = null;
		startNodeId = button.getAttribute('data-graph-preset-start-id');
		targetNodeId = activeMode === 'path' ? button.getAttribute('data-graph-preset-target-id') : null;
		selectedNodeId = activeMode === 'explore' ? startNodeId : null;
		void render();
	});

	resetButton.addEventListener('click', () => {
		activeMode = 'explore';
		activeLayout = 'organic';
		activeFilter = 'All';
		activeDepth = 1;
		selectedNodeId = null;
		selectedEdgeId = null;
		startNodeId = null;
		targetNodeId = null;
		pathNodeIds = [];
		startInput.value = '';
		targetInput.value = '';
		void render();
	});

	startInput.addEventListener('change', () => {
		const dataset = datasetFor(activeScope);
		startNodeId = resolveNodeId(dataset, startInput.value);
		if (activeMode === 'explore') {
			selectedNodeId = startNodeId;
		}
		void render();
	});

	targetInput.addEventListener('change', () => {
		const dataset = datasetFor(activeScope);
		targetNodeId = resolveNodeId(dataset, targetInput.value);
		void render();
	});

	seedFromActivePreset();
	void render();
}
