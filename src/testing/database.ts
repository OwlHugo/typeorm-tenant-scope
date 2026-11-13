import type { DataSource } from 'typeorm'
import { config } from '../config.ts'
import { buildDataSource } from '../db/data-source.ts'
import { createSchema } from '../db/schema.ts'

let dataSource: DataSource | undefined

/** Throws instead of returning a fake: the tests must run against a real Postgres. */
export async function getTestDataSource(): Promise<DataSource> {
  if (dataSource === undefined) {
    const url = process.env['TEST_DATABASE_URL'] ?? config.DATABASE_URL
    dataSource = buildDataSource(url)
    await dataSource.initialize()
    await createSchema(dataSource)
  }

  return dataSource
}

export async function closeTestDataSource(): Promise<void> {
  await dataSource?.destroy()
  dataSource = undefined
}
