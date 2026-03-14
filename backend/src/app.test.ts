import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";
import type { AddressInfo } from "node:net";
import { createApp } from "./app";

test("public routes are available on both canonical and legacy API prefixes", async () => {
  const app = createApp();
  const server = app.listen(0);

  try {
    await once(server, "listening");
    const { port } = server.address() as AddressInfo;
    const baseUrl = `http://127.0.0.1:${port}`;

    const [canonicalResponse, legacyResponse] = await Promise.all([
      fetch(`${baseUrl}/api/v1/public/platform-status`),
      fetch(`${baseUrl}/api/public/platform-status`),
    ]);

    assert.equal(canonicalResponse.status, 200);
    assert.equal(legacyResponse.status, 200);

    const canonicalPayload = await canonicalResponse.json();
    const legacyPayload = await legacyResponse.json();

    assert.deepEqual(canonicalPayload, legacyPayload);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }
});
