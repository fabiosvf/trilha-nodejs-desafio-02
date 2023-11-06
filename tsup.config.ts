// tsup.config.ts
import { defineConfig, Options } from 'tsup';

export default defineConfig((options: Options) => {
  return {
    external: [
      'better-sqlite3',
      // 'pg',
      'mysql2',
      'mysql',
      'tedious',
      'oracledb',
      'pg-query-stream',
    ],
  };
});
