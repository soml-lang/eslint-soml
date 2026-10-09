# no-negative-zero

📝 Disallow a sign on zero.

💼🚫 This rule is enabled in the ✅ `recommended` [config](https://github.com/soml-lang/eslint-soml#preset-configs). This rule is _disabled_ in the ☑️ `unopinionated` [config](https://github.com/soml-lang/eslint-soml#preset-configs).

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

In SOML, zero has no sign: `-0.0` is the same value as `0.0`, and canonical form writes it as `0.0`. The sign tells a reader nothing, so this rule removes it. The autofix keeps the value.

An int cannot be `-0`, because that is a parse error.

## Examples

```soml
# ❌
offset: -0.0

# ✅
offset: 0.0
```
