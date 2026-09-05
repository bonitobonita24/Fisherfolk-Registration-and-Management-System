// Flat ESLint config for the Expo app. Falls back to a minimal ruleset if
// eslint-config-expo (installed transitively via `expo lint`) isn't resolvable
// at lint-authoring time — the no-restricted-imports rule (Rule 13 guard) applies either way.
let expoConfig = [];
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  expoConfig = require("eslint-config-expo/flat");
} catch {
  expoConfig = [];
}

module.exports = [
  ...expoConfig,
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@frms/db", "@frms/db/*", "**/apps/web/src/server/**"],
              message:
                "Mobile must never import server/db runtime (Rule 13); import the AppRouter TYPE only via @frms/web-router.",
            },
          ],
        },
      ],
    },
  },
];
