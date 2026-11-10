/**
 * Test helper: services/store.js loads its seed data with fetch(new URL('../data/...', import.meta.url)).
 * Browsers can do that natively; Node's fetch cannot read file: URLs, so this shim serves them from disk.
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const realFetch = globalThis.fetch;

globalThis.fetch = async (input, init) => {
  const url = input instanceof URL ? input : new URL(String(input));
  if (url.protocol === 'file:') {
    const body = await readFile(fileURLToPath(url));
    return new Response(body, { status: 200, headers: { 'content-type': 'application/json' } });
  }
  return realFetch(input, init);
};
