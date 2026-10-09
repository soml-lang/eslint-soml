# no-placeholder-values

📝 Disallow placeholder values, such as `'changeme'`.

💼🚫 This rule is enabled in the ✅ `recommended` [config](https://github.com/soml-lang/eslint-soml#preset-configs). This rule is _disabled_ in the ☑️ `unopinionated` [config](https://github.com/soml-lang/eslint-soml#preset-configs).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

A placeholder copied from an example into a real config is a security hole when it is a secret. In [CVE-2023-27524](https://thehackernews.com/2023/04/apache-superset-vulnerability-insecure.html), 2,124 of 3,176 Apache Superset servers found on the internet used a default secret key, such as the placeholder `CHANGE_ME_TO_A_COMPLEX_RANDOM_SECRET`. Secret scanners are often set to ignore exactly these words, so they do not report them.

This rule reports a string that labels itself as a placeholder:

- `changeme`, `CHANGE_ME`, `change-me`, `replaceme`, and the like, as a whole word, also inside a longer value such as a URL, and also with digits after it, as in `ChangeMe123!`. With a space, as in `change me`, it is more likely prose, so it is not reported.
- `your_…_here`, such as `your_api_key_here`.
- A whole value of `TODO`, `FIXME`, or `TBD`. An array with two different ones, such as a linter's list of comment tags, `['TODO', 'FIXME']`, holds them as data, so it is not reported.

An example or template file holds placeholders on purpose. Turn the rule off for such files, for example `*.example.soml`, in your config.

## Examples

```soml
# ❌
secret-key: 'CHANGE_ME_TO_A_COMPLEX_RANDOM_SECRET'

# ✅
secret-key: 'k3J9xQ2mPz8vR1tY'
```

```soml
# ❌
api-key: 'your_api_key_here'

# ✅
api-key: 'sk-4f9a1c2e'
```
