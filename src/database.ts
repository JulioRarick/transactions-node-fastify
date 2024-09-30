import { Knex, knex } from 'knex'

import { env } from './env'

export const knexConfig: Knex.Config = {
  client: 'sqlite3',
  connection: {
    filename: env.DATABASE_URL,
  },
  useNullAsDefault: true,
  migrations: {
    extension: 'ts',
    directory: './temp/migrations',
  },
}

export const database = knex(knexConfig)
