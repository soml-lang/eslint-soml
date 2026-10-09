# no-quoted-keywords

📝 Disallow the strings `'true'`, `'false'`, and `'null'`.

💼🚫 This rule is enabled in the ✅ `recommended` [config](https://github.com/soml-lang/eslint-soml#preset-configs). This rule is _disabled_ in the ☑️ `unopinionated` [config](https://github.com/soml-lang/eslint-soml#preset-configs).

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

In SOML, `false` is a boolean and `'false'` is a string. A value is never typed by its content, so quotes are never needed to keep `true`, `false`, or `null` from being read as something else, as they are in YAML. A quoted one is a string, and a string that is not empty is true in most languages, so `enabled: 'false'` turns the feature on.

This rule reports the string values `'true'`, `'false'`, and `'null'`. Keys are always strings, so a quoted key such as `'true'` is not reported, and neither is a block string. The suggestion removes the quotes. It is not an autofix, because it changes the type, and some programs need a string, such as the values of Docker Compose `environment`.

## Examples

```soml
# ❌
enabled: 'false'

# ✅
enabled: false
```

```soml
# ❌
owner: 'null'

# ✅
owner: null
```
