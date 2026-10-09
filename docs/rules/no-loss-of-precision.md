# no-loss-of-precision

📝 Disallow floats whose written digits are lost when they are stored.

💼 This rule is enabled in the following [configs](https://github.com/soml-lang/eslint-soml#preset-configs): ✅ `recommended`, ☑️ `unopinionated`.

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

A float is stored as an IEEE 754 binary64 value, which holds about 16 significant digits. A float literal with more digits than that is rounded, so the value is not what the file says. This rule reports a float whose written digits do not survive the round trip, like ESLint's [`no-loss-of-precision`](https://eslint.org/docs/latest/rules/no-loss-of-precision) rule for JavaScript.

A literal like `0.1` is fine. It is not exact in binary, but `0.1` is the shortest spelling of its value, so nothing the author wrote is lost.

Ints are exact in SOML, because every int64 must be stored exactly, and a float that underflows to zero is a parse error. So only float rounding is checked.

A float written with more than 101 significant digits is always reported, even when it is exact, such as the largest float written out in full. Such a literal is very rare.

## Examples

```soml
# ❌
id: 9007199254740993.0

# ✅
id: 9007199254740993
```

```soml
# ❌
ratio: 0.1000000000000000000001

# ✅
ratio: 0.1
```
