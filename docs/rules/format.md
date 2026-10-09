# format

📝 Enforce the layout of the SOML formatter.

💼🚫 This rule is enabled in the ✅ `recommended` [config](https://github.com/soml-lang/eslint-soml#preset-configs). This rule is _disabled_ in the ☑️ `unopinionated` [config](https://github.com/soml-lang/eslint-soml#preset-configs).

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

The SOML [specification](https://github.com/soml-lang/soml/blob/main/spec.md#formatting) defines a formatter that normalizes layout and keeps every choice the author made about content. This rule reports where a file differs from the formatter's output, and the autofix formats the whole file.

The formatter changes only layout:

- Indentation, to one tab per level.
- Line breaks, so that every member and every array item of an object or array that spans lines is on its own line. An object or array whose brackets are on one line stays on one line, as in `ports: [80, 443]`. To split one, put a line break anywhere inside it. An empty `[]` or `{}` goes on one line, also when it spans lines. One that holds only comments is not empty.
- Commas, which are removed from an object or array that spans lines, because a line break separates its members and items. In an object or array on one line, only the comma after the last member or item is removed.
- One space after `:` and after a comma, one space before a comment at the end of a line, and no space directly inside the brackets of an object or array on one line.
- Block strings, so that the opening delimiter, the content, and the closing delimiter have one indentation. For a member, the block string starts on the line after its key, one level deeper. For an array item, it has the item's indentation.
- Trailing whitespace, which is removed, and blank lines: a run of them becomes one, and none are kept at the start of the file or directly inside a bracket. The file ends with one line feed.

It keeps everything else: comments where they are, the order of members, the spelling of numbers, durations, and strings, and a top-level object without braces. Inside a block string, only the indentation that the closing delimiter sets changes, so its value stays the same.

The autofix formats the whole file at once, so that a block string is never moved halfway. Only the first problem in the file carries it. So it could not leave out a line that a disable comment keeps, and there is no autofix in a file with a disable comment for this rule, or for every rule. The other problems are still reported. This is also so with the `noInlineConfig` linter option, which turns the comment off. To keep a file as it is, turn the rule off for that file in your config:

```js
{
	files: ['legacy.soml'],
	rules: {
		'soml/format': 'off',
	},
}
```

A `/* eslint-disable soml/format */` comment as the first line of the file also works.

## Examples

```soml
# ❌
pool: {min: 2,
	max: 16}

# ✅
pool: {
	min: 2
	max: 16
}
```

```soml
# ❌
labels: [ 'prod',   'eu-west', ]

# ✅
labels: ['prod', 'eu-west']
```

```soml
# ❌
note: '''
	Ship it.
	'''

# ✅
note:
	'''
	Ship it.
	'''
```

```soml
# ❌
a:1

# ✅
a: 1
```
