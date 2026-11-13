import { DataSource } from 'typeorm'
import { config } from '../config.ts'
import { DocumentEntity } from '../document/document.ts'
import { TenantEntity } from '../tenant/tenant.ts'

export function buildDataSource(databaseUrl: string = config.DATABASE_URL): DataSource {
  return new DataSource({
    type: 'postgres',
    url: databaseUrl,
    entities: [TenantEntity, DocumentEntity],
    synchronize: false,
    logging: false,
  })
}
