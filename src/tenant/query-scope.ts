import { QueryBuilder } from 'typeorm'
import { getTenantId } from './context.ts'

const TENANT_COLUMN = 'tenant_id'

const FILTERED_QUERY_TYPES = new Set<string>([
  'select',
  'update',
  'delete',
  'soft-delete',
  'restore',
])

// Interpolating a value into SQL is only acceptable because the shape is checked first:
// the id comes from the tenants table and never from user input.
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type ColumnLike = { propertyName?: string }

type AliasLike = {
  name: string
  hasMetadata?: boolean
  metadata?: { columns: ColumnLike[] }
}

type ExpressionMapLike = {
  mainAlias?: AliasLike
  queryType?: string
  aliasNamePrefixingEnabled?: boolean
  wheres?: Record<string, unknown>[]
}

type ScopableBuilder = {
  expressionMap: ExpressionMapLike
  __tenantScopeInstalled?: boolean
}

type PatchedBuilder = ScopableBuilder & {
  createWhereExpression: (this: ScopableBuilder) => string
}

function appliesToMainAlias(expressionMap: ExpressionMapLike): boolean {
  const alias = expressionMap.mainAlias

  if (alias?.hasMetadata !== true || expressionMap.queryType === undefined) {
    return false
  }

  if (!FILTERED_QUERY_TYPES.has(expressionMap.queryType)) {
    return false
  }

  return alias.metadata?.columns.some((column) => column.propertyName === TENANT_COLUMN) === true
}

function tenantCondition(expressionMap: ExpressionMapLike, tenantId: string): string {
  const column =
    expressionMap.aliasNamePrefixingEnabled === true && expressionMap.mainAlias !== undefined
      ? `${expressionMap.mainAlias.name}.${TENANT_COLUMN}`
      : TENANT_COLUMN

  return `${column} = '${tenantId}'::uuid`
}

/**
 * Appends the tenant condition to every query the ORM builds.
 *
 * TypeORM already appends the soft-delete condition (and the discriminator condition when
 * it applies) inside `createWhereExpression`, so that hook is the one seam a normal query
 * cannot skip.
 */
export function installTenantQueryScope(): void {
  // Escape hatch used by `pnpm prove:red`: it turns the scope off so the isolation
  // tests can prove they fail without it. Nothing else in this repo sets it.
  if (process.env['DISABLE_TENANT_SCOPE'] === '1') {
    return
  }

  const proto = QueryBuilder.prototype as unknown as PatchedBuilder

  if (proto.__tenantScopeInstalled === true) {
    return
  }

  const original = proto.createWhereExpression

  proto.createWhereExpression = function patchedCreateWhereExpression(
    this: ScopableBuilder,
  ): string {
    const tenantId = getTenantId()

    if (tenantId === undefined || !appliesToMainAlias(this.expressionMap)) {
      return original.call(this)
    }

    if (!UUID_PATTERN.test(tenantId)) {
      throw new Error(`Tenant scope: tenant id is not a UUID (${tenantId})`)
    }

    const condition: Record<string, unknown> = {
      type: 'and',
      condition: tenantCondition(this.expressionMap, tenantId),
    }
    const existingWheres = this.expressionMap.wheres ?? []

    this.expressionMap.wheres =
      existingWheres.length > 0
        ? [
            { type: 'and', condition: { operator: 'brackets', condition: existingWheres } },
            condition,
          ]
        : [condition]

    try {
      return original.call(this)
    } finally {
      // The query builder is shared state: always put it back.
      this.expressionMap.wheres = existingWheres
    }
  }

  proto.__tenantScopeInstalled = true
}

export function isTenantQueryScopeInstalled(): boolean {
  return (QueryBuilder.prototype as unknown as ScopableBuilder).__tenantScopeInstalled === true
}
