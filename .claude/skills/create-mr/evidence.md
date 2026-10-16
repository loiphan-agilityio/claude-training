# Capturing UI evidence

The branch runs on port **5180** ("after"). The base commit runs on **5181** ("before", bug fixes only). Neither touches a dev server the user may already have on 5173. `$EV` below is the evidence dir.

## Start the servers

After, from the repo root, as a background command:

```bash
npx vite --port 5180 --strictPort
```

Before, for a bug fix only. It uses its own worktree, so the user's checkout is never switched:

```bash
git worktree add --detach $EV/before $base
cd $EV/before && npm ci --ignore-scripts --prefer-offline --no-audit --no-fund   # ~2s from the npm cache; --ignore-scripts skips lefthook install
```

Then, from `$EV/before`, in the background: `npx vite --port 5181 --strictPort`.

Wait until a server answers: `curl -sS -o /dev/null --retry 30 --retry-connrefused --retry-delay 1 http://localhost:5180/`.

Stop servers with `fuser -k 5180/tcp 5181/tcp`, not `pkill -f vite`: `pkill -f` also matches, and kills, the shell running it.

## Write the scenario once

Put the user's steps in `$EV/scenario.js` as a `run-code` function. The same file runs against both ports, so the before and after videos show exactly the same steps.

```js
async (page) => {
  await page.getByRole('button', { name: /^Add card to/ }).first().click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Title').pressSequentially('Write MR skill', { delay: 60 })
  await dialog.getByLabel('Priority').selectOption('high')
  await page.waitForTimeout(800)
  await dialog.getByRole('button', { name: 'Add card', exact: true }).click()
  await page.getByText('Write MR skill').waitFor()
  await page.waitForTimeout(1500)
}
```

- Find the locators first: `open`, `snapshot`, then try the steps by hand. Prefer `getByRole` and `getByLabel`.
- Every column renders its own `<dialog>`, so scope to the open one with `page.getByRole('dialog')`. A page-wide `getByLabel('Title')` matches all of them and fails strict mode.
- Pace it for a person watching: `pressSequentially` with `delay: 60`, a pause before the key action, and about 1.5s at the end so the result stays on screen.
- End with a `waitFor()` on the expected outcome, so a broken run fails instead of quietly recording nothing.
- No `goto`; the URL comes from `open`. Each `open` starts a clean in-memory profile, so every run starts from the seed board even though the app persists to localStorage.
- For a bug fix, the scenario reproduces the bug. On 5181 the video shows the bug, on 5180 it shows the fix. The final `waitFor` checks the *fixed* outcome, so on 5181 expect it to time out (keep that pause short) and check the before screenshot shows the bug.

## Record

Run this once per port. Use session `mr-after` with 5180 and `after.*` files, and `mr-before` with 5181 and `before.*`:

```bash
P="npx @playwright/cli -s=mr-after"
$P open http://localhost:5180
$P resize 1280 800
$P video-start $EV/after.webm --size=1280x800 --cursor
$P run-code --filename=$EV/scenario.js
$P video-stop
$P screenshot --filename=$EV/after.png
$P close
```

- `video-stop` saves the file even if `run-code` threw. If the output has `Error` or `Call log` (apart from the expected timeout on "before"), fix the script and record again. Never upload a recording of a broken run.
- For a visual-only change, skip the three `video-*`/`run-code` lines. Reach the state with clicks or a short `run-code`, then `screenshot`. `screenshot <ref>` crops to one element when the change is small.
- File names become the alt text in GitLab: `after.webm`, `before.webm`, `after-<state>.png`, `before-<state>.png`.

## Check before uploading

- Read every PNG and confirm it shows what the caption will claim. The screenshot taken right after `video-stop` is the last frame of the video.
- Playwright's bundled ffmpeg can't decode VP8, but it can confirm a video has a sane length and size: `$(ls -d ~/.cache/ms-playwright/ffmpeg-*/ | tail -1)ffmpeg-linux -i $EV/after.webm 2>&1 | grep -E 'Duration|Video:'`.
