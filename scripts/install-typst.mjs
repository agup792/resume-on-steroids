/**
 * Downloads Typst binary for the current platform.
 * Runs as a postinstall hook to ensure the correct Typst version
 * is available regardless of the npm typst package version.
 */

import { execSync } from "child_process";
import { existsSync, mkdirSync, chmodSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const TYPST_VERSION = "0.14.2";
const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..");
const BIN_DIR = join(PROJECT_ROOT, "bin");
const TYPST_BIN = join(BIN_DIR, "typst");

const PLATFORM_MAP = {
  "linux-x64": "typst-x86_64-unknown-linux-musl.tar.xz",
  "linux-arm64": "typst-aarch64-unknown-linux-musl.tar.xz",
  "darwin-x64": "typst-x86_64-apple-darwin.tar.xz",
  "darwin-arm64": "typst-aarch64-apple-darwin.tar.xz",
};

function main() {
  const key = `${process.platform}-${process.arch}`;
  const archive = PLATFORM_MAP[key];

  if (!archive) {
    console.log(`[install-typst] No prebuilt Typst binary for ${key}, skipping.`);
    return;
  }

  if (existsSync(TYPST_BIN)) {
    try {
      const version = execSync(`"${TYPST_BIN}" --version`, { encoding: "utf-8" }).trim();
      if (version.includes(TYPST_VERSION)) {
        console.log(`[install-typst] Typst ${TYPST_VERSION} already installed.`);
        return;
      }
    } catch {}
  }

  const url = `https://github.com/typst/typst/releases/download/v${TYPST_VERSION}/${archive}`;
  console.log(`[install-typst] Downloading Typst ${TYPST_VERSION} for ${key}...`);

  mkdirSync(BIN_DIR, { recursive: true });

  const stripComponents = 1;
  try {
    execSync(
      `curl -fsSL "${url}" | tar -xJ --strip-components=${stripComponents} -C "${BIN_DIR}" --include="*/typst"`,
      { stdio: "inherit" },
    );
    chmodSync(TYPST_BIN, 0o755);
    console.log(`[install-typst] Typst ${TYPST_VERSION} installed to ${TYPST_BIN}`);
  } catch (err) {
    console.error(`[install-typst] Failed to install Typst: ${err.message}`);
    console.error("[install-typst] Falling back to system/npm typst.");
  }
}

main();
