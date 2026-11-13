import type { DataSource } from 'typeorm'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { truncateAll } from '../db/schema.ts'
import { documentsRepository } from '../document/document.ts'
import { createDocument, findDocumentById, listDocuments } from '../document/documents.ts'
import { closeTestDataSource, getTestDataSource } from '../testing/database.ts'
import { runWithTenant } from './context.ts'
import { installTenantQueryScope, isTenantQueryScopeInstalled } from './query-scope.ts'
import { createTenant, type Tenant } from './tenant.ts'

describe('documents are tenant-scoped (real Postgres)', () => {
  let db: DataSource
  let tenantA: Tenant
  let tenantB: Tenant

  const asTenant = <T>(tenant: Tenant, fn: () => Promise<T>): Promise<T> =>
    runWithTenant({ tenantId: tenant.id }, fn)

  beforeAll(async () => {
    installTenantQueryScope()
    db = await getTestDataSource()
  })

  beforeEach(async () => {
    await truncateAll(db)
    tenantA = await createTenant(db, 'doc-a')
    tenantB = await createTenant(db, 'doc-b')
  })

  afterAll(async () => {
    await closeTestDataSource()
  })

  it('installs the tenant query scope', () => {
    expect(isTenantQueryScopeInstalled()).toBe(true)
  })

  it('lets two tenants use the same slug', async () => {
    const fromA = await asTenant(tenantA, () => createDocument(db, { slug: 'q3', title: 'A' }))
    const fromB = await asTenant(tenantB, () => createDocument(db, { slug: 'q3', title: 'B' }))

    expect(fromA.tenant_id).toBe(tenantA.id)
    expect(fromB.tenant_id).toBe(tenantB.id)
  })

  it("never returns another tenant's document by id", async () => {
    const fromA = await asTenant(tenantA, () => createDocument(db, { slug: 'q3', title: 'A' }))

    const seenByB = await asTenant(tenantB, () => findDocumentById(db, fromA.id))

    expect(seenByB).toBeNull()
  })

  it('lists only its own documents', async () => {
    await asTenant(tenantA, () => createDocument(db, { slug: 'a1', title: 'A1' }))
    await asTenant(tenantB, () => createDocument(db, { slug: 'b1', title: 'B1' }))

    const list = await asTenant(tenantA, () => listDocuments(db))

    expect(list.map((document) => document.slug)).toEqual(['a1'])
  })

  it('does not filter when there is no tenant context (by design)', async () => {
    const fromA = await asTenant(tenantA, () => createDocument(db, { slug: 'q3', title: 'A' }))

    const leaked = await findDocumentById(db, fromA.id)

    expect(leaked?.tenant_id).toBe(tenantA.id)
  })

  it('does not filter raw SQL (known gap)', async () => {
    const fromA = await asTenant(tenantA, () => createDocument(db, { slug: 'q3', title: 'A' }))

    const rows = await asTenant(tenantB, () =>
      db.query('SELECT id FROM documents WHERE id = $1', [fromA.id]),
    )

    expect(rows).toHaveLength(1)
  })

  it('scopes updates, so another tenant cannot rewrite the row', async () => {
    const fromA = await asTenant(tenantA, () => createDocument(db, { slug: 'q3', title: 'A' }))

    const result = await asTenant(tenantB, () =>
      documentsRepository(db).update({ id: fromA.id }, { title: 'hijacked' }),
    )

    expect(result.affected).toBe(0)
  })

  it('rejects a tenant id that is not a UUID instead of building SQL', async () => {
    const fromA = await asTenant(tenantA, () => createDocument(db, { slug: 'q3', title: 'A' }))

    await expect(
      runWithTenant({ tenantId: "' OR 1=1 --" }, () => findDocumentById(db, fromA.id)),
    ).rejects.toThrow(/not a UUID/)
  })
})
