import { randomUUID } from 'node:crypto'
import type { DataSource } from 'typeorm'
import { requireTenantId } from '../tenant/context.ts'
import { type Document, documentsRepository } from './document.ts'

export type NewDocument = {
  slug: string
  title: string
}

export async function createDocument(
  dataSource: DataSource,
  input: NewDocument,
): Promise<Document> {
  const repository = documentsRepository(dataSource)

  return repository.save(
    repository.create({
      id: randomUUID(),
      tenant_id: requireTenantId(),
      slug: input.slug,
      title: input.title,
      created_at: new Date(),
    }),
  )
}

export function findDocumentById(dataSource: DataSource, id: string): Promise<Document | null> {
  return documentsRepository(dataSource).findOne({ where: { id } })
}

export function listDocuments(dataSource: DataSource): Promise<Document[]> {
  return documentsRepository(dataSource).find({ order: { created_at: 'DESC' } })
}
