# no-quoted-values-in-arrays

📝 Disallow quoted values in an array of that type, such as `'443'` in `[80, '443']`.

💼🚫 This rule is enabled in the ✅ `recommended` [config](https://github.com/soml-lang/eslint-soml#preset-configs). This rule is _disabled_ in the ☑️ `unopinionated` [config](https://github.com/soml-lang/eslint-soml#preset-configs).

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

`'443'` is a string and `443` is an int, so one port in quotes among ints gives a program text where it expects a number.

This rule reports a string in an array of ints, instants, or durations, when the string is how one of them is written, such as `'2s'` among durations. It is not reported when a string is not how the type is written, or when there are more strings than other items. Floats are not checked, because a float in quotes is most often a version. `null` items do not count.

The suggestion removes the quotes. It is not an autofix, because it changes the type.

## Examples

```soml
# ❌
ports: [80, 443, '8080']

# ✅
ports: [80, 443, 8080]
```

```soml
# ❌
delays: [1s, '2s', 5s]

# ✅
delays: [1s, 2s, 5s]
```

```soml
# ✅ A tuple of different types.
address: [1600, 'Pennsylvania Avenue', '20500']
```
