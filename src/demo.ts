import { buildDataSource } from './db/data-source.ts'
import { createSchema } from './db/schema.ts'
import { createDocument, findDocumentById, listDocuments } from './document/documents.ts'
import { runWithTenant } from './tenant/context.ts'
import { installTenantQueryScope } from './tenant/query-scope.ts'
import { createTenant } from './tenant/tenant.ts'

const db = buildDataSource()
await db.initialize()
await createSchema(db)
await db.query('TRUNCATE documents, tenants CASCADE')

installTenantQueryScope()

const acme = await createTenant(db, 'acme')
const other = await createTenant(db, 'other')

const created = await runWithTenant({ tenantId: acme.id }, () =>
  createDocument(db, { slug: 'q3-report', title: 'Q3 report' }),
)

// Same slug in a second tenant: allowed, because the unique key is per tenant.
const sameSlug = await runWithTenant({ tenantId: other.id }, () =>
  createDocument(db, { slug: 'q3-report', title: 'Someone else copy' }),
)

// Cross read: the scope turns the missing row into null, not into an exception.
const seenByOther = await runWithTenant({ tenantId: other.id }, () =>
  findDocumentById(db, created.id),
)

const acmeList = await runWithTenant({ tenantId: acme.id }, () => listDocuments(db))

console.log('created in acme      :', created.slug, created.id)
console.log('same slug in other   :', sameSlug.slug, sameSlug.id)
console.log('acme document seen by other:', seenByOther)
console.log(
  'acme list            :',
  acmeList.map((document) => document.slug),
)

await db.destroy()
