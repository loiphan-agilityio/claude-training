Hello World

## Commit convention

Commits follow [Conventional Commits](https://www.conventionalcommits.org/) with the ticket ID as a required, upper-case scope:

```
type(TICKET): lower-case subject
```

Examples:

```
chore(K005): add commitlint and lefthook git hooks
fix(BUG-002): clear due date when input is emptied
```

Git hooks are installed by `npm install` (via lefthook). They check the commit message, lint and format staged files on commit, and run lint, format check, tests and build on push.
