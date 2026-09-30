const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Where the database file lives. An env variable lets Docker override it later.
const DB_PATH = process.env.DB_PATH || path.join(__dirname, "..", "data", "app.db");
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true }); // make sure the data/ folder exists

const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    source_name TEXT NOT NULL,
    published_at TEXT NOT NULL,
    url TEXT NOT NULL,
    summary TEXT NOT NULL DEFAULT '',
    tags TEXT NOT NULL DEFAULT '[]'
    )
`);

function rowToItem(row) {
  return {
    id: row.id,
    title: row.title,
    source: { name: row.source_name },
    publishedAt: row.published_at,
    url: row.url,
    summary: row.summary,
    tags: JSON.parse(row.tags),
  };
}

function seedIfEmpty() {
  const count = db.prepare("SELECT COUNT(*) AS n FROM items").get().n;
  if (count > 0) return;

  const seedPath = path.join(__dirname, "..", "seed.json");
  const seed = JSON.parse(fs.readFileSync(seedPath, "utf8"));

  const insert = db.prepare(`
    INSERT INTO items (id, title, source_name, published_at, url, summary, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const item of seed.items) {
    insert.run(
      crypto.randomUUID(),
      item.title,
      item.source.name,
      item.publishedAt,
      item.url,
      item.summary,
      JSON.stringify(item.tags)

    );
  }
}

seedIfEmpty();

module.exports = { db, rowToItem };