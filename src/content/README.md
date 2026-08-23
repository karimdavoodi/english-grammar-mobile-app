# content

The game's static, read-only content "database": schema types, load-time
validation, and the bundled authored content.

The content itself lives in `data/` as plain JSON — one file per track
(`basic.json`, `intermediate.json`, `advanced.json`), each holding the full
track: metadata (`id`, `order`, `name`, `label`, `eligibleStartingPoint`) and
every level (topic, rules, and questions). Metro bundles the JSON into the app,
and `index.ts` imports it once at load time and validates it fail-fast.

Adding or editing a level or question is a content edit in `data/` — never a
code change. The schema these files must satisfy is defined in `types.ts` and
enforced by `validateContent()` (`validate.ts`).
