// eslint-disable-next-line
import { Knex } from "knex";

declare module 'knex/types/tables' {
  export interface Tables {
    transactions: {
      id: string
      session_id: string
      title: string
      value: number
      created_at: Date
    }
  }
}
