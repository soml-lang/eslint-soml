# no-decimal-file-modes

📝 Disallow file modes written as decimal numbers.

💼 This rule is enabled in the following [configs](https://github.com/soml-lang/eslint-soml#preset-configs): ✅ `recommended`, ☑️ `unopinionated`.

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

A file mode such as `644` is octal: owner read and write, group read, others read. In SOML, a number without a prefix is decimal, so `mode: 644` is the mode `0o1204`, which is nothing like what was meant, and nothing reports it. Write an octal number with `0o`, as in `0o644`. A file converted from YAML or Ansible is a common source, because `0644` is octal there and a parse error in SOML, and removing the zero gives the wrong mode.

This rule reports a decimal number of three or four digits from 0 to 7 under a key for a file mode, such as `mode`, `file-mode`, `defaultMode`, `FILE_UPLOAD_PERMISSIONS`, or `'listen.mode'` in a quoted key, when the number is not a sensible mode but its digits read as octal are. The check of what is sensible comes from ansible-lint's [`risky-octal`](https://github.com/ansible/ansible-lint/blob/main/src/ansiblelint/rules/risky_octal.md) rule. So the correct decimal form of a mode, such as `defaultMode: 420` for `0o644`, is not reported.

The suggestion adds the `0o`. It is not an autofix, because it changes the value.

## Examples

```soml
# ❌
mode: 644

# ✅
mode: 0o644
```

```soml
# ❌
volume: {defaultMode: 400}

# ✅
volume: {defaultMode: 0o400}
```

```soml
# ✅ The decimal value of 0o644.
defaultMode: 420
```
