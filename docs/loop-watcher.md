# Loop Watcher

This repository now includes a small local loop system that can emit a literal `keep going` prompt whenever a pass is marked done.

## What it can do

- watch a repo-local status file
- print `keep going` when a pass finishes
- optionally create a macOS notification
- optionally speak `keep going` using `say`
- write the next prompt to `.loop/next-prompt.txt`

## What it cannot do

It cannot directly re-invoke Codex or force a new chat turn by itself. It is a local watcher and prompt emitter, not a hidden control channel into the model.

## Commands

Mark a pass as working:

```bash
npm run loop:working -- "expanding anti-defection cluster"
```

Mark a pass as done:

```bash
npm run loop:done -- "anti-defection cluster done"
```

Run the watcher once:

```bash
npm run loop:watch -- --once
```

Run the watcher continuously:

```bash
npm run loop:watch
```

Run the watcher with macOS notification and speech:

```bash
npm run loop:watch -- --notify --say
```

## Files

- `.loop/status.json`
- `.loop/next-prompt.txt`
- `.loop/watcher.log`

## Suggested workflow

1. Start the watcher in one terminal.
2. Mark the repo as `working` when a pass starts.
3. Mark the repo as `done` when a pass ends.
4. Let the watcher emit `keep going`.
5. Reset to `working` when the next pass starts.
