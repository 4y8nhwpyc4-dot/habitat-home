// @ts-check
/**
 * Migration bookkeeping shared by the two appliers — `scripts/migrate.mjs`
 * (deploy, `readdir`) and `src/lib/db.ts` (PGLite preview, `import.meta.glob`).
 */

/** @param {string} path */
export function migrationName(path) {
  return path.split("/").pop() ?? path;
}

/** @param {string} path */
export function isMigrationFile(path) {
  return path.endsWith(".sql");
}

/**
 * @param {Iterable<string>} paths
 * @param {Iterable<string>} applied
 */
export function pendingMigrations(paths, applied) {
  const done = new Set(applied);
  return [...paths]
    .filter(isMigrationFile)
    .map((path) => ({ name: migrationName(path), path }))
    .sort((a, b) => a.name.localeCompare(b.name))
    .filter(({ name }) => !done.has(name));
}
