#!/usr/bin/env node
/** @deprecated Use `npm run translate:de` (TRANSLATE_TO=de node scripts/translate-en-locale.mjs). */
process.env.TRANSLATE_TO = "de";
await import("./translate-en-locale.mjs");
