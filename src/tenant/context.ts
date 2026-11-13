import { AsyncLocalStorage } from 'node:async_hooks'

export type TenantContext = { readonly tenantId: string }

const storage = new AsyncLocalStorage<TenantContext>()

export function runWithTenant<T>(context: TenantContext, fn: () => T): T {
  return storage.run(context, fn)
}

export function getTenantId(): string | undefined {
  return storage.getStore()?.tenantId
}

/** Fail closed: a query path without a tenant should crash, not return every row. */
export function requireTenantId(): string {
  const tenantId = getTenantId()

  if (tenantId === undefined) {
    throw new Error('Tenant context is missing')
  }

  return tenantId
}
