# Contributing

`pnpm check` is exactly what CI runs: Biome, `tsc`, knip and the specs with coverage
against a real Postgres. Bring the database up with `pnpm db:up` first and down with
`pnpm db:down` when you are done.

Two things this repo asks of a change:

1. If you add a table with `tenant_id`, add a spec for it. The point of the repo is that
   isolation is proved, not assumed.
2. If you remove the scope or change the hook, `pnpm prove:red` must still fail. If it
   passes, the specs stopped testing the mechanism.

Commits follow Conventional Commits, one subject each.
