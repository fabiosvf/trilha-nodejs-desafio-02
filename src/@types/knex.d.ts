// eslint-disable-next-line
import { knex } from 'knex'

declare module 'knex/types/tables' {
  export interface Tables {
    meals: {
      id: string;
      session_id?: string;
      name: string;
      description: string;
      eaten_at: string;
      created_at: string;
      within_diet: boolean;
    };
  }
}
