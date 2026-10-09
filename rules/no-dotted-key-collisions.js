import {escapeInvisibleCharacters} from './utils/index.js';

/**
@import {SomlContext} from './rule/soml-context.js';
@import {SomlRule} from './rule/to-eslint-rule.js';
*/

const MESSAGE_ID = 'no-dotted-key-collisions';
const messages = {
	[MESSAGE_ID]: '`{{key}}` is a key of its own, not `{{rest}}` in the object `{{object}}`, because SOML does not split keys at `.`. Move it into `{{object}}`.',
};

/**
@param {SomlContext} context
*/
const create = context => {
	context.on('Object', function * (node) {
		// Only a sibling that is an object shows that the author nests with braces, and then expects `'a.b'` to go into `a`, as in TOML. A flat map of dotted names, such as Spark or log4j settings, or a host next to its domain, has no such object.
		const objectKeys = new Set(node.members
			.filter(member => member.value.type === 'Object')
			.map(member => member.key.value));

		for (const {key, value} of node.members) {
			const dotIndex = key.value.indexOf('.');

			// A key that starts with `.` names a file, such as `'.eslintrc'`, not a path. A key whose value is an object is more likely a name in a map of objects, such as the logger `'uvicorn.error'` next to `uvicorn`, or the host `'bastion.internal'` next to `bastion`.
			if (dotIndex <= 0 || value.type === 'Object') {
				continue;
			}

			const object = key.value.slice(0, dotIndex);

			if (!objectKeys.has(object)) {
				continue;
			}

			yield {
				node: key,
				messageId: MESSAGE_ID,
				data: {
					key: escapeInvisibleCharacters(context.sourceCode.getText(key)),
					object: escapeInvisibleCharacters(object),
					rest: escapeInvisibleCharacters(key.value.slice(dotIndex + 1)),
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
			description: 'Disallow quoted keys with a `.` that read as a path into an object next to them.',
			recommended: true,
		},
		messages,
		languages: ['soml/soml'],
	},
};

export default config;
