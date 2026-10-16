---
name: create-mr
description: Open a GitLab merge request for the current branch the way this repo wants it — description filled from .gitlab/merge_request_templates/Default.md, unit-test coverage of the changed files, and evidence uploaded to GitLab (UI screenshots, a video of the feature, before/after video or screenshots for a bug fix). Use whenever asked to create, open or raise an MR / merge request ("tạo MR"), or to attach screenshots, video or coverage to one.
argument-hint: '[target-branch]'
allowed-tools: Bash(npx @playwright/cli:*) Bash(glab auth status:*) Bash(glab issue list:*)
---

# Create MR

The title and description rules are in CLAUDE.md ("Git workflow"). This skill is the procedure, plus the evidence that goes with it.

GitLab is reached through `glab`, the GitLab CLI. Run `glab auth status` first. If `glab` is missing or not logged in to the origin's host, stop and tell the user to run `glab auth login --hostname <host>` themselves (the host is in `git remote get-url origin`). Never ask them to paste a token into the chat. On a self-hosted GitLab, a `GITLAB_TOKEN` without a `glab auth login` only works if `GITLAB_HOST` is set too.

Keep every file you produce (scenario, screenshots, videos, description) in one **evidence dir** outside the repo: the session scratchpad if there is one, else `mktemp -d`.

## 1. Branch and target

1. Branch is `<type>/<TICKET>-<slug>`; TICKET looks like `K010` or `BUG-002`.
2. Target: `$ARGUMENTS` if given, otherwise the branch named by the latest merge commit (`git log --merges -1 --format=%s` → `... into 'practice-02'`). Say which one you used.
3. `git fetch origin <target>`, then `base=$(git merge-base origin/<target> HEAD)`. If `base` is `HEAD`, the branch is already in the target: stop and say so.
4. The working tree must be clean. Push with `git push -u origin HEAD`. Pre-push runs lint, format check, tests and build; if it fails, report and stop. Never `--no-verify`.
5. Read `git log --oneline $base..HEAD` and `git diff $base...HEAD`.

## 2. Classify

Prefix from the branch type: `feat`→`Feature/`, `fix`→`Bugfix/`, `refactor`→`Refactor/`, `chore`→`Chore/`, `docs`→`Docs/`, `test`→`Test/`.

From the diff, decide what a user would notice in the browser:

- **behaviour**: something works differently (click, drag, dialog, filter, saved state)
- **visual**: it only looks different (style, layout, text)
- **none**: nothing in the running app changes (tests, tooling, docs, a refactor that renders the same)

| Prefix         | behaviour                                     | visual                                  | none |
| -------------- | --------------------------------------------- | --------------------------------------- | ---- |
| Feature        | screenshot of the new UI + video of the flow  | screenshot(s)                           | —    |
| Bugfix         | video **before** + video **after**, same steps | screenshot **before** + **after**       | —    |
| anything else  | treat as Feature                              | treat as Feature                        | —    |

If there is media to capture, follow [evidence.md](evidence.md).

## 3. Coverage

Changed source files, without tests, mocks and test setup:

```bash
files=$(git diff --name-only --diff-filter=d $base...HEAD -- 'src/*.ts' 'src/*.tsx' ':!*.test.*' ':!src/test/*' ':!src/mocks/*' ':!src/main.tsx')
```

If `files` is empty, skip coverage. Otherwise:

```bash
NO_COLOR=1 npx vitest run --coverage.enabled --coverage.reporter=text $(printf -- '--coverage.include=%s ' $files) 2>&1 | sed -n '/Coverage report/,$p'
```

Vitest 5 lists only the files that miss coverage, then a summary. If a test fails, stop.

## 4. Upload and write the description

1. Upload each file and keep the markdown embed it prints (`![after](/uploads/...)`). GitLab plays `.webm` embeds as video. Use `--form`: `-F` would send the file's bytes as a text field instead of uploading it.

   ```bash
   for f in <file>...; do glab api projects/:id/uploads --form "file=@$f" | jq -r .markdown; done
   ```

2. `glab issue list --search <TICKET>` lists matching open issues as `#<iid> <title>`. One match gives `Closes #<iid>`. Several matches, or none: ask the user which number to use, or whether to drop the line.
3. Read `.gitlab/merge_request_templates/Default.md`, keep its headings and their order, remove the `<!-- -->` hints and fill in:
   - **What**: what changed and why, in a few lines, then `Closes #<iid>`.
   - **How to test**: real numbered steps. Below them, the coverage output from step 3:

     ````md
     <details><summary>Unit test coverage (changed files)</summary>

     ```text
     <output>
     ```

     </details>
     ````

   - **Screenshots**: a Feature gets each embed under a one-line caption. A Bugfix gets **Before** and **After**: screenshots side by side in a two-column table, and videos one after the other, each under its label. Delete the section if there is no media.
   - **Checklist**: keep every item. Tick the title format, since you wrote it. Tick tests only if the diff adds or changes `*.test.*` files. Tick lint/test/build because the pre-push in step 1 ran them.
4. Write it to `<evidence dir>/description.md`.

## 5. Create

```bash
glab mr create --target-branch <target> --title '<Prefix/Title>' --description-file <evidence dir>/description.md --yes
```

It prints the MR URL. Don't use `--fill` or `--push`, because step 1 already pushed. Don't use `--attach` either: it is experimental and appends files to the end of the description, not under Before/After. If GitLab answers that an MR already exists for the branch, report that and stop. Don't open a second one.

Clean up whatever you started: the dev servers (`fuser -k 5180/tcp 5181/tcp`), the playwright sessions (`npx @playwright/cli -s=<name> close`) and the before worktree (`git worktree remove --force <dir>`).

Reply with the MR URL and what was attached.
