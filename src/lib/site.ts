import { withBase } from './content';

export const siteName = 'Constitution Atlas';

export const navItems = [
	{ href: withBase('/articles'), label: 'Articles' },
	{ href: withBase('/parts'), label: 'Parts' },
	{ href: withBase('/schedules'), label: 'Schedules' },
	{ href: withBase('/topics'), label: 'Topics' },
	{ href: withBase('/institutions'), label: 'Institutions' },
	{ href: withBase('/sources'), label: 'Sources' },
	{ href: withBase('/graph'), label: 'Graph' },
	{ href: withBase('/cases'), label: 'Cases' },
	{ href: withBase('/amendments'), label: 'Amendments' },
	{ href: withBase('/current-affairs'), label: 'Current Affairs' },
	{ href: withBase('/timeline'), label: 'Timeline' },
	{ href: withBase('/glossary'), label: 'Glossary' },
	{ href: withBase('/search'), label: 'Search' },
];
