# no-block-string-edge-blank-lines

📝 Disallow blank lines at the start and end of block strings.

💼🚫 This rule is enabled in the ✅ `recommended` [config](https://github.com/soml-lang/eslint-soml#preset-configs). This rule is _disabled_ in the ☑️ `unopinionated` [config](https://github.com/soml-lang/eslint-soml#preset-configs).

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

Blank lines directly after the opening delimiter of a block string, and directly before its closing delimiter, are not part of the value. So a block string never starts or ends with a line break. In TOML and in a YAML `|` block, the last line break is part of the value, so a blank line before the closing delimiter can look like the way to add one, for a PEM certificate or a script that must end with a line break. It does nothing.

This rule reports those blank lines, and the autofix removes them, which keeps the value. To start or end a value with a line break, write `\n` in a `"""` block string.

## Examples

```soml
# ❌
script: '''
	echo 'Hello'

	'''

# ✅
script: """
	echo 'Hello'\n
	"""
```

```soml
# ❌
description: '''

	A pool of connections.
	'''

# ✅
description: '''
	A pool of connections.
	'''
```
