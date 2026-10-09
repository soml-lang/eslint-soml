# eslint-soml

> ESLint plugin for [SOML](https://github.com/soml-lang/soml), a config format for humans

[`eslint-plugin-unicorn`](https://github.com/sindresorhus/eslint-plugin-unicorn#soml) has more rules that also lint SOML, such as `prefer-https` and `name-replacements`.

[**Propose a new rule ➡**](.github/contributing.md)

*We do not accept pull requests because of too much AI slop.*

## Install

```sh
npm install --save-dev eslint eslint-soml
```

**Requires Node.js 22.13 or later, ESLint `>=10.4`, [flat config](https://eslint.org/docs/latest/use/configure/configuration-files), and [ESM](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c#how-can-i-make-my-typescript-project-output-esm).**

The rules of this plugin do not need `Temporal`, so they work on every supported Node.js version, also for files with instants and durations. Only reading the `value` of an `Instant` or `Duration` node needs it, as in your own rule or in a `no-restricted-syntax` selector that matches on `value`, such as `[value=1]`. Node.js 26 and later have `Temporal` built in. On older versions, load a [`Temporal` polyfill](https://github.com/fullcalendar/temporal-polyfill) first: make `import 'temporal-polyfill/global';` the first import in `eslint.config.js`, before `eslint-soml`.

## Usage

Use a [preset config](#preset-configs):

```js
import soml from 'eslint-soml';
import {defineConfig} from 'eslint/config';

export default defineConfig([
	soml.configs.recommended,
]);
```

Or configure each rule. Then set `language: 'soml/soml'`, as shown below.

```js
import soml from 'eslint-soml';
import {defineConfig} from 'eslint/config';

export default defineConfig([
	{
		files: ['**/*.soml'],
		plugins: {
			soml,
		},
		language: 'soml/soml',
		rules: {
			'soml/prefer-literal-strings': 'error',
			'soml/…': 'error',
		},
	},
]);
```

Disable a rule with a comment, in either comment style:

```soml
# eslint-disable-next-line soml/prefer-bare-keys
'name': 'soml'

'404': 'Not found' /* eslint-disable-line soml/prefer-bare-keys */
```

The [`reportUnusedDisableDirectives`](https://eslint.org/docs/latest/use/configure/configuration-files#report-unused-disable-directives) and [`reportUnusedInlineConfigs`](https://eslint.org/docs/latest/use/configure/configuration-files#report-unused-inline-configs) linter options work for `.soml` files, and so do the rules of [`@eslint-community/eslint-plugin-eslint-comments`](https://github.com/eslint-community/eslint-plugin-eslint-comments), such as `no-unlimited-disable`. Those rules follow JavaScript, where a line comment holds only `eslint-disable-line` and `eslint-disable-next-line`, so some of them, such as `no-unlimited-disable` and `no-use`, do not check `# eslint-disable` and `# eslint-enable`. Write those as `/* … */` comments to have them checked.

ESLint's [`no-restricted-syntax`](https://eslint.org/docs/latest/rules/no-restricted-syntax) rule works too. For example, to disallow a key named `password`:

```js
import soml from 'eslint-soml';
import {defineConfig} from 'eslint/config';

export default defineConfig([
	soml.configs.recommended,
	{
		files: ['**/*.soml'],
		rules: {
			'no-restricted-syntax': [
				'error',
				{
					selector: 'Member > Key[value="password"]',
					message: 'Read the password from the environment.',
				},
			],
		},
	},
]);
```

A selector can also check a value under a given key, which catches settings that are risky in production:

```js
'no-restricted-syntax': [
	'error',
	{
		selector: 'Member:has(> Key[value=/^(allowed-origins|cors-origins?)$/]) String[value="*"]',
		message: 'Allow only known origins.',
	},
	{
		selector: 'Member:has(> Key[value=/^(verify-ssl|ssl-verify|tls-verify)$/]) > Boolean[value=false]',
		message: 'Do not turn off TLS verification.',
	},
	{
		selector: 'Member:has(> Key[value=/^(host|bind|listen)$/]) > String[value="0.0.0.0"]',
		message: 'Bind to a specific address.',
	},
	{
		// Only at the top level.
		selector: 'Document > Object > Member > Key[value="debug"]',
		message: 'Set `debug` in the environment, not in the file.',
	},
],
```

A selector can also say what the program that reads a file does not support. SOML allows each of these values, so use only the ones your program needs:

```js
'no-restricted-syntax': [
	'error',
	{
		// Such as a program that reads ints as JavaScript numbers.
		selector: ':matches(Integer[value>9007199254740991], Integer[value<-9007199254740991])',
		message: 'This program needs ints in the JavaScript safe integer range.',
	},
	{
		// Such as a program that writes the value as JSON, where `infinity` becomes `null`.
		selector: ':matches(Float[value="Infinity"], Float[value="-Infinity"])',
		message: 'This program needs finite numbers.',
	},
	{
		// Such as a program that uses the value as a file name.
		selector: ':matches(String, Key)[value=/\\u0000/]',
		message: 'This program does not support the NUL character.',
	},
	{
		// Such as a program that merges the value into an object with `Object.assign()`.
		selector: 'Key[value="__proto__"]',
		message: 'This program does not support the key `__proto__`.',
	},
	{
		selector: ':matches(Instant, Duration)',
		message: 'This program does not support instants and durations.',
	},
],
```

### SOML in Markdown

To lint the `` ```soml `` code blocks in Markdown files, add the processor of [`@eslint/markdown`](https://github.com/eslint/markdown) before the preset. The blocks are linted as `.soml` files, and `--fix` writes the fixes back, also in an indented block:

```js
import markdown from '@eslint/markdown';
import soml from 'eslint-soml';
import {defineConfig} from 'eslint/config';

export default defineConfig([
	{
		files: ['**/*.md'],
		plugins: {
			markdown,
		},
		processor: 'markdown/markdown',
	},
	soml.configs.recommended,
]);
```

A block that shows a mistake on purpose can be skipped with `<!-- eslint-skip -->` on the line before it.

## Rules

<!-- Do not manually modify this list. Run: `npm run fix:eslint-docs` -->
<!-- begin auto-generated rules list -->

💼 [Configurations](https://github.com/soml-lang/eslint-soml#preset-configs) enabled in.\
✅ Set in the `recommended` [configuration](https://github.com/soml-lang/eslint-soml#preset-configs).\
☑️ Set in the `unopinionated` [configuration](https://github.com/soml-lang/eslint-soml#preset-configs).\
🔧 Automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/user-guide/command-line-interface#--fix).\
💡 Manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

| Name                                                                                                 | Description                                                                           | 💼   | 🔧 | 💡 |
| :--------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------ | :--- | :- | :- |
| [format](docs/rules/format.md)                                                                       | Enforce the layout of the SOML formatter.                                             | ✅    | 🔧 |    |
| [key-name-casing](docs/rules/key-name-casing.md)                                                     | Enforce a casing style for keys.                                                      |      |    |    |
| [no-block-string-edge-blank-lines](docs/rules/no-block-string-edge-blank-lines.md)                   | Disallow blank lines at the start and end of block strings.                           | ✅    | 🔧 |    |
| [no-block-string-trailing-whitespace](docs/rules/no-block-string-trailing-whitespace.md)             | Disallow trailing whitespace in block strings.                                        | ✅ ☑️ |    |    |
| [no-confusable-keys](docs/rules/no-confusable-keys.md)                                               | Disallow keys that differ only in case, `-`, `_`, and `.`, or surrounding whitespace. | ✅ ☑️ |    |    |
| [no-decimal-file-modes](docs/rules/no-decimal-file-modes.md)                                         | Disallow file modes written as decimal numbers.                                       | ✅ ☑️ |    | 💡 |
| [no-dotted-key-collisions](docs/rules/no-dotted-key-collisions.md)                                   | Disallow quoted keys with a `.` that read as a path into an object next to them.      | ✅    |    |    |
| [no-doubled-backslashes-in-literal-strings](docs/rules/no-doubled-backslashes-in-literal-strings.md) | Disallow doubled backslashes in literal strings, such as `'^\\d+$'`.                  | ✅    |    | 💡 |
| [no-duplicate-array-items](docs/rules/no-duplicate-array-items.md)                                   | Disallow the same string twice in an array.                                           |      |    | 💡 |
| [no-empty-keys](docs/rules/no-empty-keys.md)                                                         | Disallow empty and whitespace-only keys.                                              | ✅ ☑️ |    |    |
| [no-escapes-in-literal-strings](docs/rules/no-escapes-in-literal-strings.md)                         | Disallow escapes in literal strings, such as `'Line one\nLine two'`.                  | ✅    |    | 💡 |
| [no-escapes-in-paths](docs/rules/no-escapes-in-paths.md)                                             | Disallow `\n` and `\t` escapes in Windows paths.                                      | ✅ ☑️ |    | 💡 |
| [no-float-trailing-zeros](docs/rules/no-float-trailing-zeros.md)                                     | Disallow trailing zeros in the fraction of a float.                                   | ✅    |    | 💡 |
| [no-invisible-characters](docs/rules/no-invisible-characters.md)                                     | Disallow invisible characters in strings, keys, and comments.                         | ✅ ☑️ | 🔧 |    |
| [no-loss-of-precision](docs/rules/no-loss-of-precision.md)                                           | Disallow floats whose written digits are lost when they are stored.                   | ✅ ☑️ |    |    |
| [no-misplaced-block-string-delimiters](docs/rules/no-misplaced-block-string-delimiters.md)           | Disallow a block string delimiter at the end of a content line.                       | ✅ ☑️ |    |    |
| [no-mixed-number-types](docs/rules/no-mixed-number-types.md)                                         | Disallow arrays that mix ints and floats.                                             | ✅    |    | 💡 |
| [no-negative-zero](docs/rules/no-negative-zero.md)                                                   | Disallow a sign on zero.                                                              | ✅    | 🔧 |    |
| [no-placeholder-values](docs/rules/no-placeholder-values.md)                                         | Disallow placeholder values, such as `'changeme'`.                                    | ✅    |    |    |
| [no-quoted-keywords](docs/rules/no-quoted-keywords.md)                                               | Disallow the strings `'true'`, `'false'`, and `'null'`.                               | ✅    |    | 💡 |
| [no-quoted-values-in-arrays](docs/rules/no-quoted-values-in-arrays.md)                               | Disallow quoted values in an array of that type, such as `'443'` in `[80, '443']`.    | ✅    |    | 💡 |
| [no-sizes-as-durations](docs/rules/no-sizes-as-durations.md)                                         | Disallow sizes that are durations, such as `memory: 512m`.                            | ✅ ☑️ |    | 💡 |
| [no-surrounding-whitespace-in-keys](docs/rules/no-surrounding-whitespace-in-keys.md)                 | Disallow whitespace at the start and end of keys.                                     | ✅    |    |    |
| [no-unnormalized-keys](docs/rules/no-unnormalized-keys.md)                                           | Disallow keys that are not in a Unicode normalization form.                           | ✅ ☑️ |    |    |
| [no-zero-duration-parts](docs/rules/no-zero-duration-parts.md)                                       | Disallow duration parts that are zero.                                                | ✅    | 🔧 |    |
| [numeric-separators-style](docs/rules/numeric-separators-style.md)                                   | Enforce the grouping of digits with `_` in decimal numbers.                           | ✅    | 🔧 |    |
| [prefer-bare-keys](docs/rules/prefer-bare-keys.md)                                                   | Prefer bare keys when a key does not need quotes.                                     | ✅    | 🔧 |    |
| [prefer-block-strings](docs/rules/prefer-block-strings.md)                                           | Prefer block strings for strings of three lines or more.                              | ✅    | 🔧 |    |
| [prefer-literal-strings](docs/rules/prefer-literal-strings.md)                                       | Prefer literal strings, `'…'`, when a string does not need escapes.                   | ✅    | 🔧 |    |
| [prefer-utc-instants](docs/rules/prefer-utc-instants.md)                                             | Prefer instants in UTC.                                                               |      | 🔧 |    |
| [sort-keys](docs/rules/sort-keys.md)                                                                 | Require object keys to be sorted.                                                     |      | 🔧 |    |
| [spaced-comment](docs/rules/spaced-comment.md)                                                       | Require a space after `#` and `/*`, and before `*/`.                                  | ✅    | 🔧 |    |

<!-- end auto-generated rules list -->

## Preset configs

See the [ESLint docs](https://eslint.org/docs/latest/use/configure/configuration-files) for more information about extending config files.

**Note**: The preset configs apply to `**/*.soml` files. They also set `language: 'soml/soml'`.

### Recommended config

This plugin exports a `recommended` config that enforces good practices.

```js
import soml from 'eslint-soml';
import {defineConfig} from 'eslint/config';

export default defineConfig([
	// …
	soml.configs.recommended,
	{
		files: ['**/*.soml'],
		rules: {
			'soml/sort-keys': 'error',
		},
	},
]);
```

### Unopinionated config

This plugin exports an `unopinionated` config with only the rules that catch bugs. Every syntax error is reported by every config, because it comes from the parser.

```js
import soml from 'eslint-soml';
import {defineConfig} from 'eslint/config';

export default defineConfig([
	// …
	soml.configs.unopinionated,
]);
```

### All config

This plugin exports an `all` config that enables every rule.

```js
import soml from 'eslint-soml';
import {defineConfig} from 'eslint/config';

export default defineConfig([
	// …
	soml.configs.all,
	{
		files: ['**/*.soml'],
		rules: {
			'soml/prefer-utc-instants': 'off',
		},
	},
]);
```

## Editor integration

In Visual Studio Code, the [ESLint extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) only checks the languages listed in its `eslint.validate` setting. Add `soml`. This needs an extension that registers the `soml` language for `.soml` files.

```json
{
	"eslint.validate": [
		"soml"
	]
}
```

## Writing rules

See [how to write rules for SOML files](docs/writing-rules.md).

## Related

- [soml-javascript](https://github.com/soml-lang/soml-javascript) - The reference parser and serializer for SOML
- [eslint-plugin-unicorn](https://github.com/sindresorhus/eslint-plugin-unicorn) - Powerful ESLint rules
- [eslint-package-json](https://github.com/sindresorhus/eslint-package-json) - Powerful ESLint rules for `package.json`
