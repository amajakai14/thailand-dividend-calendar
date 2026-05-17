import { beforeAll, afterAll } from 'vitest';
import { resetDB } from '../../../server/src/db/schema';
import fs from 'fs';

let currentDbPath: string | undefined;

// Each test FILE gets its own isolated DB. beforeAll/afterAll run once per file.
beforeAll(() => {
  currentDbPath = `/tmp/th-div-test-${Date.now()}-${Math.random().toString(36).slice(2)}.db`;
  process.env.DB_PATH = currentDbPath;
  resetDB();
});

afterAll(() => {
  resetDB();
  if (currentDbPath) {
    try {
      fs.unlinkSync(currentDbPath);
    } catch {
      // ignore if already cleaned up
    }
    currentDbPath = undefined;
  }
});
