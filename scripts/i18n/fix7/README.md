FIX-7 translation keys (all 7 languages). If a merge with other locale changes conflicts,
keep the other side of `web/locales/*.json` / `mobile/i18n/locales/*.json` and re-apply:

    python3 scripts/i18n/fix7/apply-keys.py scripts/i18n/fix7/web-keys.json web/locales
    python3 scripts/i18n/fix7/apply-keys.py scripts/i18n/fix7/mobile-keys.json mobile/i18n/locales
