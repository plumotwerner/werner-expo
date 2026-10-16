import type { SQLiteDatabase } from "expo-sqlite";

export type Note = {
  id: number;
  text: string;
  createdAt: number;
};

const DATABASE_VERSION = 1;

/**
 * Creates or upgrades the schema. `PRAGMA user_version` stores the schema
 * version inside the database file, so each upgrade step runs exactly once.
 */
export async function migrateNotesDatabase(db: SQLiteDatabase) {
  const result = await db.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version",
  );
  const currentVersion = result?.user_version ?? 0;
  if (currentVersion >= DATABASE_VERSION) return;

  if (currentVersion === 0) {
    await db.execAsync(`
      PRAGMA journal_mode = 'wal';
      CREATE TABLE notes (
        id INTEGER PRIMARY KEY NOT NULL,
        text TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
    `);
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}

export function listNotes(db: SQLiteDatabase): Promise<Note[]> {
  return db.getAllAsync<Note>(
    "SELECT id, text, created_at AS createdAt FROM notes ORDER BY created_at DESC, id DESC",
  );
}

export async function addNote(db: SQLiteDatabase, text: string) {
  await db.runAsync(
    "INSERT INTO notes (text, created_at) VALUES (?, ?)",
    text,
    Date.now(),
  );
}

/** Inserts several notes in one transaction. */
export async function addNotes(db: SQLiteDatabase, texts: string[]) {
  await db.withTransactionAsync(async () => {
    for (const text of texts) {
      await db.runAsync(
        "INSERT INTO notes (text, created_at) VALUES (?, ?)",
        text,
        Date.now(),
      );
    }
  });
}

export async function updateNote(db: SQLiteDatabase, id: number, text: string) {
  await db.runAsync("UPDATE notes SET text = ? WHERE id = ?", text, id);
}

export async function deleteNote(db: SQLiteDatabase, id: number) {
  await db.runAsync("DELETE FROM notes WHERE id = ?", id);
}

export async function deleteAllNotes(db: SQLiteDatabase) {
  await db.runAsync("DELETE FROM notes");
}

const SAMPLE_NOTE_COUNT = 100;

/**
 * Fills the table with fake notes, for demos and for trying the list with data.
 * Faker is large, so it is required inside the function: the module is only
 * evaluated when someone actually asks for sample notes. It is still part of
 * the bundle, which is the price of having this tool in a release build.
 * All rows go in one transaction, which is far faster than 100 separate writes.
 */
export async function seedSampleNotes(
  db: SQLiteDatabase,
  count = SAMPLE_NOTE_COUNT,
) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- lazy: faker is only evaluated when sample notes are requested
  const { faker } = require("@faker-js/faker") as typeof import("@faker-js/faker");

  await db.withTransactionAsync(async () => {
    for (let index = 0; index < count; index += 1) {
      await db.runAsync(
        "INSERT INTO notes (text, created_at) VALUES (?, ?)",
        faker.lorem.sentence({ min: 3, max: 10 }),
        faker.date.recent({ days: 30 }).getTime(),
      );
    }
  });
}
