// Bumps "version" in manifest.json of every plugin changed by the HEAD commit,
// based on Conventional Commits: feat!/BREAKING CHANGE → major, feat → minor, else patch.
// Skipped for a plugin when the commit adds it or already changes its version by hand,
// and when only its README.md changed. Prints the updated manifest paths.
const fs = require("fs");
const { execFileSync } = require("child_process");

const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim();

function detectBumpLevel(message) {
  if (/BREAKING CHANGE/.test(message) || /^\w+(\([^)]*\))?!:/.test(message)) return "major";
  if (/^feat(\([^)]*\))?:/.test(message)) return "minor";
  return "patch";
}

function bumpVersion(current, level) {
  const [major, minor, patch] = current.split(".").map(Number);
  if (level === "major") return `${major + 1}.0.0`;
  if (level === "minor") return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

const VERSION_PATTERN = /"version"\s*:\s*"(\d+\.\d+\.\d+)"/;

function versionInParent(path) {
  try {
    return git("show", `HEAD~1:${path}`).match(VERSION_PATTERN)?.[1] ?? null;
  } catch {
    return null; // the plugin is new in this commit
  }
}

const parents = git("rev-list", "--parents", "-n", "1", "HEAD").split(" ").length - 1;
if (parents !== 1) process.exit(0); // root or merge commit

const message = git("log", "-1", "--pretty=%B", "HEAD");
const level = detectBumpLevel(message);
const changedFiles = git("diff-tree", "--no-commit-id", "--name-only", "-r", "HEAD").split("\n").filter(Boolean);

const plugins = new Set(
  changedFiles
    .filter((file) => file.includes("/") && !file.endsWith("/README.md"))
    .map((file) => file.split("/")[0])
    .filter((dir) => fs.existsSync(`${dir}/manifest.json`)),
);

for (const plugin of plugins) {
  const manifestPath = `${plugin}/manifest.json`;
  const previous = versionInParent(manifestPath);
  if (previous == null) continue;

  const content = fs.readFileSync(manifestPath, "utf8");
  if (content.trim() !== git("show", `HEAD:${manifestPath}`)) {
    console.error(`${plugin}: manifest.json has uncommitted changes, version not bumped`);
    continue;
  }
  const match = content.match(VERSION_PATTERN);
  if (!match) continue;

  const current = match[1];
  if (current !== previous) continue; // version already changed by hand in this commit

  const next = bumpVersion(current, level);
  fs.writeFileSync(manifestPath, content.replace(match[0], match[0].replace(current, next)));
  console.error(`${plugin}: ${current} -> ${next}`);
  console.log(manifestPath);
}
