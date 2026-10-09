# no-dotted-key-collisions

📝 Disallow quoted keys with a `.` that read as a path into an object next to them.

💼🚫 This rule is enabled in the ✅ `recommended` [config](https://github.com/soml-lang/eslint-soml#preset-configs). This rule is _disabled_ in the ☑️ `unopinionated` [config](https://github.com/soml-lang/eslint-soml#preset-configs).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

SOML does not split keys at `.`, so `'logging.level'` is a key next to `logging`. In TOML and Spring properties, it is `level` in `logging`. A program that reads `level` in `logging` does not find it.

This rule reports a quoted key with a `.` when the same object has an object under the part before the first `.`. A key whose value is an object is not reported, because it is more likely a name in a map, such as the logger `'uvicorn.error'` next to `uvicorn`. A key that starts with `.`, such as `'.eslintrc'`, is not reported, because it is a file name.

Some programs, such as Spring and Elasticsearch, split keys at `.` themselves. Turn the rule off for their files.

## Examples

```soml
# ❌
logging: {format: 'json'}
'logging.level': 'debug'

# ✅
logging: {format: 'json', level: 'debug'}
```

```soml
# ✅ A map of loggers.
loggers: {
	uvicorn: {level: 'INFO'}
	'uvicorn.error': {level: 'INFO'}
}
```

```soml
# ✅ No object named `spark` is next to it.
'spark.executor.memory': '4g'
'spark.executor.cores': 2
```
