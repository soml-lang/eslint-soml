# numeric-separators-style

📝 Enforce the grouping of digits with `_` in decimal numbers.

💼🚫 This rule is enabled in the ✅ `recommended` [config](https://github.com/soml-lang/eslint-soml#preset-configs). This rule is _disabled_ in the ☑️ `unopinionated` [config](https://github.com/soml-lang/eslint-soml#preset-configs).

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

Long numbers are hard to read, so SOML lets you group their digits with `_`, as in `1_000_000`. This rule makes the grouping consistent, like [`unicorn/numeric-separators-style`](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/numeric-separators-style.md) does for JavaScript.

By default, a decimal number with five or more digits before the decimal point is grouped by three, and a number with fewer is not grouped. The digits after the decimal point are not grouped.

Hexadecimal, octal, and binary ints are not checked, because their grouping follows what the digits mean, such as `0xFFFF_FFFF` for two 16-bit halves, or `0b1010_1100` for nibbles. Durations are not checked either.

## Examples

```soml
# ❌
budget: 1000000

# ✅
budget: 1_000_000
```

```soml
# ❌
budget: 1_0000_00

# ✅
budget: 1_000_000
```

```soml
# ❌
port: 8_080

# ✅
port: 8080
```

## Options

### minimumDigits

Type: `integer`\
Default: `5`

The number of digits from which the digits must be grouped. A number with fewer digits must not be grouped. It applies to each part on its own: the digits before the decimal point, after it, and in the exponent.

### groupLength

Type: `integer`\
Default: `3`

The number of digits in each group, before the decimal point and in the exponent.

### fractionGroupLength

Type: `integer`\
Default: none

The number of digits in each group after the decimal point. By default, they are not grouped, so the autofix removes any `_` there.

### onlyIfContainsSeparator

Type: `boolean`\
Default: `false`

Only check numbers that already contain a `_`.

```js
'soml/numeric-separators-style': [
	'error',
	{
		onlyIfContainsSeparator: true,
	},
]
```
