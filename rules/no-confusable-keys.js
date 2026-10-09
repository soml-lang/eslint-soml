import {escapeInvisibleCharacters, trimWhitespace} from './utils/index.js';

/**
@import {SomlContext} from './rule/soml-context.js';
@import {SomlRule} from './rule/to-eslint-rule.js';
*/

const MESSAGE_ID = 'no-confusable-keys';
const messages = {
	[MESSAGE_ID]: '`{{key}}` and `{{otherKey}}` are one key to a program that ignores case or surrounding whitespace, or that treats `-`, `_`, and `.` as the same.',
};

/*
What many programs compare keys by: case-insensitive, with `-`, `_`, and `.` the same, and without surrounding whitespace. Libraries that read settings from environment variables treat `.` as `_`: Spring reads `LOG_LEVEL` as `log.level`, and Viper, with its usual replacer, as both `log.level` and `log-level`.
*/
const foldCharacter = character => {
	const upper = character.toUpperCase();
	const lower = upper.toLowerCase();
	// A form that is more than one code point, such as the `SS` that `ß` uppercases to, is not a case of one letter, so keep the character as it is.
	return [...upper].length === 1 && [...lower].length === 1 ? lower : character;
};

/*
Lowercasing alone leaves some case variants apart, because several code points can share one uppercase form: `ς` (final sigma) does not lowercase to `σ`, `ſ` does not lowercase to `s`, and `ı` does not lowercase to `i`. Uppercasing and lowercasing each code point again reaches the form the others share. Lowercase first, so a document that a JavaScript `toLowerCase()` reader would merge, such as `İ` and `i̇`, still folds together.
*/
const fold = key => [...trimWhitespace(key).toLowerCase().replaceAll(/[\-.]/gv, '_')]
	.map(character => foldCharacter(character))
	.join('');

/**
@param {SomlContext} context
*/
const create = context => {
	context.on('Object', function * (node) {
		/*
		The first key seen for each folded key.
		*/
		const firstKeys = new Map();

		for (const {key} of node.members) {
			const folded = fold(key.value);
			const firstKey = firstKeys.get(folded);

			if (firstKey === undefined) {
				firstKeys.set(folded, key);
				continue;
			}

			yield {
				node: key,
				messageId: MESSAGE_ID,
				// The source text shows the quotes, so a key with whitespace stays readable, and a bidirectional control is escaped.
				data: {
					key: escapeInvisibleCharacters(context.sourceCode.getText(key)),
					otherKey: escapeInvisibleCharacters(context.sourceCode.getText(firstKey)),
				},
			};
		}
	});
};

/**
@type {SomlRule}
*/
const config = {
	create,
	meta: {
		type: 'problem',
		docs: {
			description: 'Disallow keys that differ only in case, `-`, `_`, and `.`, or surrounding whitespace.',
			recommended: 'unopinionated',
		},
		messages,
		languages: ['soml/soml'],
	},
};

export default config;
