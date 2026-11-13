import type { DataSource } from 'typeorm'

// Same SQL as the article: the unique key is per tenant, not global.
const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS tenants (
    id   uuid PRIMARY KEY,
    name varchar(80) NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS documents (
    id         uuid PRIMARY KEY,
    tenant_id  uuid NOT NULL,
    slug       varchar(80) NOT NULL,
    title      text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS uq_documents_tenant_slug ON documents (tenant_id, slug)`,
  `CREATE INDEX IF NOT EXISTS idx_documents_tenant_created ON documents (tenant_id, created_at DESC)`,
]

export async function createSchema(dataSource: DataSource): Promise<void> {
  for (const statement of STATEMENTS) {
    await dataSource.query(statement)
  }
}

export async function truncateAll(dataSource: DataSource): Promise<void> {
  await dataSource.query('TRUNCATE documents, tenants CASCADE')
}
