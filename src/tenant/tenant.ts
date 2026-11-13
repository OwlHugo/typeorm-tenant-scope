import { randomUUID } from 'node:crypto'
import { type DataSource, EntitySchema } from 'typeorm'

export type Tenant = {
  id: string
  name: string
}

export const TenantEntity = new EntitySchema<Tenant>({
  name: 'Tenant',
  tableName: 'tenants',
  columns: {
    id: { type: 'uuid', primary: true },
    name: { type: 'varchar', length: 80 },
  },
})

export async function createTenant(dataSource: DataSource, name: string): Promise<Tenant> {
  const repository = dataSource.getRepository<Tenant>('Tenant')

  return repository.save(repository.create({ id: randomUUID(), name }))
}
