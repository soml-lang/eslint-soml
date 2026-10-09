# no-surrounding-whitespace-in-keys

📝 Disallow whitespace at the start and end of keys.

💼🚫 This rule is enabled in the ✅ `recommended` [config](https://github.com/soml-lang/eslint-soml#preset-configs). This rule is _disabled_ in the ☑️ `unopinionated` [config](https://github.com/soml-lang/eslint-soml#preset-configs).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

SOML compares keys exactly, so `'timeout '` is not `timeout`, and a program that reads `timeout` does not find it. Such keys often come from a spreadsheet or a CSV header.

This rule reports a key with whitespace at its start or end, also when written as an escape, such as `"timeout\t"`. A key of only whitespace is for [`no-empty-keys`](no-empty-keys.md).

There is no autofix, because the trimmed key can be the same as another key.

## Examples

```soml
# ❌
'timeout ': 30s

# ✅
timeout: 30s
```

```soml
# ❌
headers: {' Accept': 'application/json'}

# ✅
headers: {Accept: 'application/json'}
```

```soml
# ✅
'display name': 'Ada'
```
