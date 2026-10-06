/**
 * Lets a developer script import the engine's TypeScript sources directly.
 *
 * Node strips the type syntax itself; what it cannot do is follow the
 * bundler-style specifiers the app uses: the `@/` alias, extensionless relative
 * imports ("./text") and JSON imports without an import attribute. These hooks
 * add exactly that, for files inside this repository only.
 *
 * Developer machines only. Never imported by the app, the build or the tests.
 */
import { existsSync, statSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const WEB_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const REPO_ROOT = path.resolve(WEB_ROOT, "..", "..");

const SUFFIXES = ["", ".ts", ".tsx", "/index.ts"];

function isFile(file) {
  return existsSync(file) && statSync(file).isFile();
}

function locate(base) {
  for (const suffix of SUFFIXES) {
    if (isFile(base + suffix)) return base + suffix;
  }
  return null;
}

function insideRepo(file) {
  const relative = path.relative(REPO_ROOT, file);
  return !relative.startsWith("..") && !path.isAbsolute(relative) && !relative.includes("node_modules");
}

let registered = false;

export function registerEngineLoader() {
  if (registered) return;
  registered = true;
  registerHooks({
    resolve(specifier, context, nextResolve) {
      let base = null;
      if (specifier.startsWith("file:")) {
        const file = fileURLToPath(specifier);
        if (insideRepo(file)) base = file;
      } else if (specifier.startsWith("@/")) {
        base = path.join(WEB_ROOT, specifier.slice(2));
      } else if (specifier.startsWith(".") && context.parentURL?.startsWith("file:")) {
        const parent = fileURLToPath(context.parentURL);
        if (insideRepo(parent)) base = path.resolve(path.dirname(parent), specifier);
      }
      if (base === null) return nextResolve(specifier, context);
      const file = locate(base);
      if (file === null) return nextResolve(specifier, context);
      const url = pathToFileURL(file).href;
      if (file.endsWith(".json")) {
        return { url, format: "json", importAttributes: { type: "json" }, shortCircuit: true };
      }
      if (file.endsWith(".ts")) return { url, format: "module-typescript", shortCircuit: true };
      return { url, shortCircuit: true };
    }
  });
}

/** Imports a module of the app by its path relative to apps/web. */
export async function importFromWeb(relative) {
  registerEngineLoader();
  return import(pathToFileURL(path.join(WEB_ROOT, relative)).href);
}

/** Imports a module by its path relative to the repository root (tests/fixtures). */
export async function importFromRepo(relative) {
  registerEngineLoader();
  return import(pathToFileURL(path.join(REPO_ROOT, relative)).href);
}
