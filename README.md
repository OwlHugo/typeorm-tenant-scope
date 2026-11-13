# typeorm-tenant-scope

[![ci](https://github.com/OwlHugo/typeorm-tenant-scope/actions/workflows/ci.yml/badge.svg)](https://github.com/OwlHugo/typeorm-tenant-scope/actions/workflows/ci.yml)

Tenant isolation for TypeORM on Postgres, in one place: a query scope that appends
`tenant_id` to every ORM query, plus specs that fail when the scope is removed.

Most multi-tenant code adds `WHERE tenant_id = ?` to every query and hopes nobody forgets.
This repo moves that condition into TypeORM's own query builder hook, so a normal query
cannot skip it, and then proves the mechanism with tests against a real Postgres.

## Requirements

- Node 22.18 or newer (runs `.ts` directly through type stripping)
- pnpm 10
- Docker (for the disposable Postgres used by the specs)

## Run it

```bash
pnpm install
pnpm db:up        # postgres 16 on 127.0.0.1:55433, waits for the healthcheck
pnpm demo         # two tenants, same slug, cross read returns null
pnpm test:coverage
pnpm prove:red    # expected: the same specs fail with the scope off
pnpm db:down
```

`pnpm check` runs lint, types, knip and the specs with coverage. It is the same set CI runs.

## How it works

1. **Tenant context per request.** `src/tenant/context.ts` keeps the tenant id in
   `AsyncLocalStorage`. `requireTenantId()` throws instead of returning "all rows".
2. **One filter for every query.** `src/tenant/query-scope.ts` patches
   `QueryBuilder.createWhereExpression`, the hook TypeORM already uses to append the
   soft-delete condition, and adds `tenant_id = '<uuid>'` for select, update and delete.
   The value is interpolated, which is only acceptable because a UUID check runs first.
3. **Tests that read across tenants on purpose.** `src/tenant/isolation.test.ts` covers the
   same slug in two tenants, a cross read by id returning null, and a list returning only
   its own rows.

## What this does not protect

| Path                                    | Why it escapes                                                          |
| --------------------------------------- | ----------------------------------------------------------------------- |
| Raw SQL (`dataSource.query`)            | never passes through the query builder hook                             |
| Jobs and crons without a tenant context | the scope treats "no context" as "no filtering", by design              |
| Joined tables                           | only the main alias is inspected; the filter comes from the foreign key |

Two of those gaps have a spec that documents the behaviour instead of hiding it:
`does not filter when there is no tenant context` and `does not filter raw SQL`.

If a second application, a BI tool or a human with psql reads these tables, move the read
path to Postgres row level security and keep these specs for the application side.

## Structure

```
src/tenant/     context, query scope, tenant entity
src/document/   entity and the three operations the specs exercise
src/db/         DataSource and the schema (the SQL lives here)
src/testing/    real-database helper used by the specs
```

Entities use `EntitySchema` instead of decorators, so the repo runs through Node's type
stripping with no build step. See `docs/adr/0001-entity-schema-over-decorators.md`.

## Why TypeORM

TypeORM is the subject of the demo, not a stack recommendation. The same shape works with
Prisma middleware, Drizzle's builder or an ORM with native multi-tenancy. What has to hold
is one seam a normal query cannot bypass, plus the specs.

## License

MIT. See `LICENSE`.
