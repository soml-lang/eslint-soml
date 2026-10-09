# no-confusable-keys

📝 Disallow keys that differ only in case, `-`, `_`, and `.`, or surrounding whitespace.

💼 This rule is enabled in the following [configs](https://github.com/soml-lang/eslint-soml#preset-configs): ✅ `recommended`, ☑️ `unopinionated`.

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

SOML compares keys exactly, so `retry-after` and `retry_after` are two different keys. Many programs that read a config do not: Spring and .NET ignore case, environment variable mappings treat `-`, `_`, and `.` the same (Spring and Viper read `LOG_LEVEL` as `log.level`), and HTTP headers are case-insensitive. To such a program, the two keys are one, and one silently overrides the other. The specification gives an example of the harm: a gateway that treats `-` as `_` reads `Transfer_Encoding` as `Transfer-Encoding`. It never folds keys itself, and leaves warnings about keys that look alike to a linter.

This rule reports two keys in one object that are the same after ignoring case, treating `-`, `_`, and `.` as the same, and removing whitespace at the start and end.

There is no autofix, because only the author knows which key is right.

## Examples

```soml
# ❌
retry-after: 30s
retry_after: 60s

# ✅
retry-after: 30s
```

```soml
# ❌
Name: 'soml'
name: 'soml-lang'

# ✅
name: 'soml-lang'
```

```soml
# ❌
'name ': 'soml'
name: 'soml-lang'

# ✅
name: 'soml-lang'
```

```soml
# ❌
server: {read-timeout: 30s, read_timeout: 60s}

# ✅
server: {read-timeout: 30s}
```

```soml
# ❌
'log.level': 'debug'
log-level: 'info'

# ✅
log-level: 'debug'
```

It does not check keys that look alike for other reasons, such as letters from different scripts.
