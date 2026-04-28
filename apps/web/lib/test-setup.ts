/**
 * Pre-loaded by `tsx --import` before any *.test.ts module runs. Replaces
 * the "server-only" sentinel package with a no-op so tests can import
 * server-only modules without Next.js's RSC guard throwing.
 *
 * Usage: pnpm exec tsx --import ./lib/test-setup.ts lib/foo.test.ts
 */
import { register } from "node:module";
import { pathToFileURL } from "node:url";

// Build a tiny inline ESM loader that intercepts "server-only" specifiers
// and resolves them to an empty module. We use a data: URL so we don't
// need a separate loader file on disk.
const loaderSource = `
  export async function resolve(specifier, context, nextResolve) {
    if (specifier === "server-only" || specifier === "client-only") {
      return { url: "data:text/javascript,export%20%7B%7D;", shortCircuit: true, format: "module" };
    }
    return nextResolve(specifier, context);
  }
`;

register(
  `data:text/javascript;base64,${Buffer.from(loaderSource).toString("base64")}`,
  pathToFileURL("./"),
);
