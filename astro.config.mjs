// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
const isGithubPages = process.env.GITHUB_PAGES === 'true';
const repository = process.env.GITHUB_REPOSITORY?.split('/')[1];
const owner = process.env.GITHUB_REPOSITORY_OWNER;

export default defineConfig({
	output: 'static',
	base: isGithubPages && repository ? `/${repository}/` : '/',
	site: isGithubPages && owner && repository ? `https://${owner}.github.io/${repository}` : undefined,
});
