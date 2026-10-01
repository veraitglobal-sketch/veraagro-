FIX-7 translation keys (all 7 languages). If a merge with other locale changes conflicts,
keep the other side of `web/locales/*.json` / `mobile/i18n/locales/*.json` and re-apply:

    python3 scripts/i18n/fix7/apply-keys.py scripts/i18n/fix7/web-keys.json web/locales
    python3 scripts/i18n/fix7/apply-keys.py scripts/i18n/fix7/mobile-keys.json mobile/i18n/locales

Company description (home hero subtitle, meta description, home FAQ "What is Bio Vera?") —
`home-company-keys.json`; `home.faq.items.0.*` is an array path, apply with the inline
snippet in commit "Home: same company description in all languages" or set the values by hand.
