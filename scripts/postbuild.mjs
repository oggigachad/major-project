import { cpSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const rootDir = process.cwd();
const standaloneDir = join(rootDir, ".next", "standalone");
const nextDir = join(standaloneDir, ".next");

mkdirSync(nextDir, { recursive: true });

const staticSource = join(rootDir, ".next", "static");
const staticTarget = join(nextDir, "static");
if (existsSync(staticSource)) {
  cpSync(staticSource, staticTarget, { recursive: true });
}

const publicSource = join(rootDir, "public");
const publicTarget = join(standaloneDir, "public");
if (existsSync(publicSource)) {
  cpSync(publicSource, publicTarget, { recursive: true });
}
