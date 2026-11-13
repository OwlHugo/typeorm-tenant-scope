import { z } from 'zod'

const DEFAULT_DATABASE_URL = 'postgres://postgres:postgres@127.0.0.1:55433/tenant_scope'

const envSchema = z.object({
  DATABASE_URL: z.string().min(1).default(DEFAULT_DATABASE_URL),
})

export type Config = z.infer<typeof envSchema>

export const config: Config = envSchema.parse(process.env)
