import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const loopDir = path.join(root, '.loop');
const statusPath = path.join(loopDir, 'status.json');

const allowedStates = new Set(['idle', 'working', 'done']);

function usage() {
	console.error('Usage: node scripts/loop-status.mjs <idle|working|done> [message]');
	process.exit(1);
}

async function readStatus() {
	try {
		return JSON.parse(await readFile(statusPath, 'utf8'));
	} catch {
		return {
			state: 'idle',
			message: 'No loop activity recorded yet.',
			updatedAt: null,
			promptCount: 0,
		};
	}
}

const [, , state, ...messageParts] = process.argv;

if (!state || !allowedStates.has(state)) {
	usage();
}

const message = messageParts.join(' ').trim();

await mkdir(loopDir, { recursive: true });

const previous = await readStatus();
const next = {
	state,
	message:
		message ||
		(state === 'working'
			? 'A pass is currently in progress.'
			: state === 'done'
				? 'A pass has completed. Keep going.'
				: 'Loop is idle.'),
	updatedAt: new Date().toISOString(),
	promptCount: Number(previous.promptCount || 0),
};

await writeFile(statusPath, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
console.log(`Updated ${path.relative(root, statusPath)} -> ${state}`);
console.log(next.message);
