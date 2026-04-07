import { access, appendFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';

const root = process.cwd();
const loopDir = path.join(root, '.loop');
const statusPath = path.join(loopDir, 'status.json');
const promptPath = path.join(loopDir, 'next-prompt.txt');
const logPath = path.join(loopDir, 'watcher.log');

const intervalMs = Number.parseInt(process.env.LOOP_WATCH_INTERVAL_MS || '5000', 10);
const notify = process.argv.includes('--notify');
const speak = process.argv.includes('--say');
const once = process.argv.includes('--once');

async function exists(filePath) {
	try {
		await access(filePath, constants.F_OK);
		return true;
	} catch {
		return false;
	}
}

async function readStatus() {
	if (!(await exists(statusPath))) {
		return {
			state: 'idle',
			message: 'No loop status file yet.',
			updatedAt: null,
			promptCount: 0,
		};
	}

	try {
		return JSON.parse(await readFile(statusPath, 'utf8'));
	} catch {
		return {
			state: 'idle',
			message: 'Loop status exists but could not be parsed.',
			updatedAt: null,
			promptCount: 0,
		};
	}
}

async function emitKeepGoing(status) {
	const stamp = new Date().toISOString();
	const line = `[${stamp}] keep going :: ${status.message}\n`;

	console.log('\n[loop] keep going');
	console.log(`[loop] ${status.message}`);

	await writeFile(promptPath, `keep going\n\n${status.message}\n`, 'utf8');
	await appendFile(logPath, line, 'utf8');

	if (notify && process.platform === 'darwin') {
		spawn('osascript', ['-e', `display notification "keep going" with title "Codex Loop"`], {
			stdio: 'ignore',
			detached: true,
		}).unref();
	}

	if (speak && process.platform === 'darwin') {
		spawn('say', ['keep going'], {
			stdio: 'ignore',
			detached: true,
		}).unref();
	}
}

async function persistPromptCount(status) {
	const next = {
		...status,
		promptCount: Number(status.promptCount || 0) + 1,
	};
	await writeFile(statusPath, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
	return next;
}

await mkdir(loopDir, { recursive: true });

let lastSeenUpdatedAt = null;

async function tick() {
	const status = await readStatus();

	if (
		status.state === 'done' &&
		status.updatedAt &&
		status.updatedAt !== lastSeenUpdatedAt &&
		Number(status.promptCount || 0) === 0
	) {
		await emitKeepGoing(status);
		const persisted = await persistPromptCount(status);
		lastSeenUpdatedAt = persisted.updatedAt;
		return;
	}

	lastSeenUpdatedAt = status.updatedAt;
}

await tick();

if (once) {
	process.exit(0);
}

console.log(`[loop] watching ${path.relative(root, statusPath)} every ${intervalMs}ms`);

setInterval(() => {
	tick().catch((error) => {
		console.error('[loop] watcher error:', error);
	});
}, intervalMs);
