export type GraphPreset = {
	id: string;
	label: string;
	description: string;
	startId: string;
	targetId?: string;
	mode?: 'explore' | 'path';
	depth?: 1 | 2;
	filter?: string;
	accent?: string;
};

export const defaultGraphPresets: GraphPreset[] = [
	{
		id: 'article-21-web',
		label: 'Article 21 Web',
		description: 'Move from life and personal liberty into due process, privacy, detention, and digital regulation.',
		startId: 'articles:article-21',
		mode: 'explore',
		depth: 2,
		accent: '#bc6324',
	},
	{
		id: 'basic-structure-chain',
		label: 'Basic Structure Chain',
		description: 'Trace how Kesavananda flows into later doctrine, constitutional limits, and the NJAC conflict.',
		startId: 'cases:kesavananda-bharati',
		targetId: 'cases:supreme-court-advocates-on-record-association-njac',
		mode: 'path',
		depth: 1,
		accent: '#9a5a18',
	},
	{
		id: 'federalism-stress-test',
		label: 'Federalism Stress Test',
		description: 'Start with Article 356 and follow how gubernatorial power and centre-state friction are constrained.',
		startId: 'articles:article-356',
		mode: 'explore',
		depth: 2,
		accent: '#20486a',
	},
	{
		id: 'election-integrity',
		label: 'Election Integrity',
		description: 'See the Election Commission, appointments, campaign finance, and accountability cases in one cluster.',
		startId: 'institutions:election-commission-of-india',
		mode: 'explore',
		depth: 2,
		accent: '#8c3d30',
	},
];
