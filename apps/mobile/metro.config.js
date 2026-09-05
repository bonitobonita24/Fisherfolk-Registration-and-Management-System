const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

// Monorepo-aware Metro config: this app lives in apps/mobile/ inside a pnpm workspace,
// so Metro must also watch the workspace root and resolve node_modules hoisted there.
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

module.exports = config;
