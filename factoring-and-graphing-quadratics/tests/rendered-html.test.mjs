import assert from "node:assert/strict";
import test from "node:test";

test("renders the factoring and graphing app", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const response = await worker.fetch(new Request("http://localhost/", { headers: { accept: "text/html" } }), {
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
  }, { waitUntil() {}, passThroughOnException() {} });
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /<title>Quadratic Functions: Factoring and Graphing<\/title>/i);
  assert.match(html, /Coordinate plane from negative 8 to 8/i);
  assert.match(html, /Your equation/i);
});
