const { test, before, after } = require("node:test");
const assert = require("node:assert");
const path = require("path");
const os = require("os");
const fs = require("fs");

// Use a separate, temporary database so tests never touch your real data/app.db
const TEST_DB = path.join(os.tmpdir(), `items-test-${Date.now()}.db`);
process.env.DB_PATH = TEST_DB;

const app = require("../backend/server");

let server;
let baseUrl;

before(() => {
  // port 0 = "give me any free port"
  server = app.listen(0);
  baseUrl = `http://localhost:${server.address().port}`;
});

after(() => {
  server.close();
  fs.rmSync(TEST_DB, { force: true });
});

test("GET /api/v1/items returns 10 items by default in the ok wrapper", async () => {
  const res = await fetch(`${baseUrl}/api/v1/items`);
  const body = await res.json();

  assert.strictEqual(res.status, 200);
  assert.strictEqual(body.status, "ok");
  assert.ok(Array.isArray(body.data));
  assert.strictEqual(body.data.length, 10);
});

test("each item has the contract shape", async () => {
  const res = await fetch(`${baseUrl}/api/v1/items?limit=1`);
  const item = (await res.json()).data[0];

  assert.strictEqual(typeof item.id, "string");
  assert.strictEqual(typeof item.title, "string");
  assert.strictEqual(typeof item.source.name, "string");
  assert.match(item.publishedAt, /Z$/);
  assert.strictEqual(typeof item.url, "string");
  assert.strictEqual(typeof item.summary, "string");
  assert.ok(Array.isArray(item.tags));
});

test("limit controls how many items come back", async () => {
  const res = await fetch(`${baseUrl}/api/v1/items?limit=3`);
  const body = await res.json();
  assert.strictEqual(body.data.length, 3);
});

test("limit is capped at 50", async () => {
  const res = await fetch(`${baseUrl}/api/v1/items?limit=100`);
  const body = await res.json();
  assert.strictEqual(res.status, 200);
  assert.ok(body.data.length <= 50);
});

test("offset skips items", async () => {
  const all = (await (await fetch(`${baseUrl}/api/v1/items?limit=20`)).json()).data;
  const page = (await (await fetch(`${baseUrl}/api/v1/items?limit=5&offset=5`)).json()).data;
  assert.strictEqual(page[0].id, all[5].id);
});

test("invalid limit returns 400 VALIDATION_ERROR", async () => {
  const res = await fetch(`${baseUrl}/api/v1/items?limit=abc`);
  const body = await res.json();
  assert.strictEqual(res.status, 400);
  assert.strictEqual(body.status, "error");
  assert.strictEqual(body.error.code, "VALIDATION_ERROR");
});

test("negative offset returns 400 VALIDATION_ERROR", async () => {
  const res = await fetch(`${baseUrl}/api/v1/items?offset=-1`);
  const body = await res.json();
  assert.strictEqual(res.status, 400);
  assert.strictEqual(body.error.code, "VALIDATION_ERROR");
});