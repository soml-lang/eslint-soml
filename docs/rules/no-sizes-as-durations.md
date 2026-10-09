# no-sizes-as-durations

📝 Disallow sizes that are durations, such as `memory: 512m`.

💼 This rule is enabled in the following [configs](https://github.com/soml-lang/eslint-soml#preset-configs): ✅ `recommended`, ☑️ `unopinionated`.

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

In SOML, `512m` is a duration of 512 minutes, so a memory or CPU size written the way Kubernetes, Docker, and the JVM write it is silently a time. Every other size suffix, such as `512M`, `2G`, or `512Mi`, is a parse error, but a lowercase `m` is the unit for minutes.

This rule reports a number of minutes, such as `512m`, under a key that names a size:

- A key with one of the words `memory`, `mem`, `memswap`, `cpu`, `cpus`, `heap`, or `shm`, such as `memory`, `mem_limit`, or `maxHeapSize`.
- A key of two or more words that ends with `size` or `bytes`, such as `max-size`.

A key with a word about time, such as `window-size`, `cpu-time`, or `memory-cache-expiry`, is not reported. A quoted key is split into words at every character that is not a letter or a digit, so `'spark.executor.memory'` and `'php_admin_value[memory_limit]'` count too.

The suggestion writes the value as a string, which is what an app that reads sizes like `512m` expects.

## Examples

```soml
# ❌
memory: 512m

# ✅
memory: '512m'
```

```soml
# ❌
resources: {limits: {cpu: 500m}}

# ✅
resources: {limits: {cpu: '500m'}}
```

```soml
# ✅
cache-ttl: 5m
```
