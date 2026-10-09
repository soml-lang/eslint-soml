# no-mixed-number-types

📝 Disallow arrays that mix ints and floats.

💼🚫 This rule is enabled in the ✅ `recommended` [config](https://github.com/soml-lang/eslint-soml#preset-configs). This rule is _disabled_ in the ☑️ `unopinionated` [config](https://github.com/soml-lang/eslint-soml#preset-configs).

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

In SOML, an int and a float are different types, and the type comes from how a number is written: `1` is an int and `1.0` is a float. So an array of measurements with one `1` in it gives the reader an int among floats, and a program that expects one type gets two.

This rule reports an array that has both ints and floats. It reports whichever kind there are fewer of, since that is the likely mistake, and the ints when there are as many of each. For a decimal int, the suggestion writes it as a float, which changes its type, so it is not an autofix. A hexadecimal, octal, or binary int gets no suggestion, because only a decimal number can have a fraction.

`infinity` is a float, so `[10, infinity]` is reported too. Write `[10.0, infinity]`, or use `null` for no limit when the other values are ints.

## Examples

```soml
# ❌
ratios: [0.25, 0.5, 1]

# ✅
ratios: [0.25, 0.5, 1.0]
```

```soml
# ❌
ports: [80, 443, 8080.0]

# ✅
ports: [80, 443, 8080]
```

```soml
# ✅ Different types other than numbers are fine.
mixed: [1, 'two', true, null]
```
