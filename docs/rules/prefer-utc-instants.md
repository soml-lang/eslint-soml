# prefer-utc-instants

📝 Prefer instants in UTC.

🚫 This rule is _disabled_ in the following [configs](https://github.com/soml-lang/eslint-soml#preset-configs): ✅ `recommended`, ☑️ `unopinionated`.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

An instant's offset is not part of its value in SOML: `2026-09-19T16:00:00+02:00` and `2026-09-19T14:00:00Z` are the same instant, and canonical form always writes UTC. Writing every instant in UTC makes instants easy to compare by eye.

The autofix converts the instant to UTC and keeps the number of fractional digits, which keeps the value.

The rule is off by default, because an offset often carries information for the reader, such as the local time of an event.

## Examples

```soml
# ❌
deployed-at: 2026-09-19T16:00:00+02:00

# ✅
deployed-at: 2026-09-19T14:00:00Z
```
