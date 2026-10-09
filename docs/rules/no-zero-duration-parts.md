# no-zero-duration-parts

📝 Disallow duration parts that are zero.

💼🚫 This rule is enabled in the ✅ `recommended` [config](https://github.com/soml-lang/eslint-soml#preset-configs). This rule is _disabled_ in the ☑️ `unopinionated` [config](https://github.com/soml-lang/eslint-soml#preset-configs).

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

Go writes durations with every part, even the ones that are zero, so `5h0m0s` appears in many configs that came from Go programs, such as those of Argo CD, Cilium, and Fly. The zero parts add nothing for a reader, and canonical form leaves them out.

This rule reports a duration with a part that is zero, and the autofix removes those parts, which keeps the value. A duration of one part, such as `0s`, is fine. When every part is zero, the last part stays.

## Examples

```soml
# ❌
refresh: 1h0m0s

# ✅
refresh: 1h
```

```soml
# ❌
grace: 0h30m

# ✅
grace: 30m
```
