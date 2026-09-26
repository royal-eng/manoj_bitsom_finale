import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
const require = createRequire(import.meta.url);
const env = { ...process.env };
// Portable compiler for Windows machines with native module restrictions.
if (process.platform === "win32")
  env.NEXT_TEST_WASM_DIR = path.dirname(
    require.resolve("@next/swc-wasm-nodejs"),
  );
const child = spawn(
  process.execPath,
  [require.resolve("next/dist/bin/next"), ...process.argv.slice(2)],
  { stdio: "inherit", env },
);
child.on("exit", (code) => process.exit(code ?? 1));
