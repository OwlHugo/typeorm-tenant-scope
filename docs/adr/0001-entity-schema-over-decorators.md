# ADR 0001: EntitySchema instead of decorators

## Context

The repo runs TypeScript directly on Node through type stripping. Type stripping only
supports syntax that can be erased, and class decorators cannot be erased. TypeORM's usual
entity style depends on `@Entity()` and `@Column()`.

## Decision

Entities are declared with `EntitySchema`. Same metadata, same repositories, no decorators.
The project needs no `reflect-metadata`, no `experimentalDecorators`, and no build step.

## Consequences

- `node src/demo.ts` works with no transpiler.
- The entity type is a plain TypeScript type, so the type carries no ORM behaviour.
- Adding a relation later means writing it in the schema object rather than as a property
  decorator. That is the accepted cost.
