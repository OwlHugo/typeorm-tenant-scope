import { type DataSource, EntitySchema, type Repository } from 'typeorm'

export type Document = {
  id: string
  tenant_id: string
  slug: string
  title: string
  created_at: Date
}

export const DocumentEntity = new EntitySchema<Document>({
  name: 'Document',
  tableName: 'documents',
  columns: {
    id: { type: 'uuid', primary: true },
    tenant_id: { type: 'uuid' },
    slug: { type: 'varchar', length: 80 },
    title: { type: 'text' },
    created_at: { type: 'timestamp with time zone' },
  },
})

export function documentsRepository(dataSource: DataSource): Repository<Document> {
  return dataSource.getRepository<Document>('Document')
}
