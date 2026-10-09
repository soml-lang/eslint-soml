/**
@import {SomlContext} from './rule/soml-context.js';
@import {SomlRule} from './rule/to-eslint-rule.js';
*/

const MESSAGE_ID = 'prefer-utc-instants';
const messages = {
	[MESSAGE_ID]: 'Write the instant in UTC, as `{{utc}}`.',
};

const INSTANT = /^(?<dateTime>[\d\-:T]+)(?<fraction>\.\d+)?(?<offset>[+\-]\d{2}:\d{2})$/v;

/**
@param {SomlContext} context
*/
const create = context => {
	context.on('Instant', node => {
		const text = context.sourceCode.getText(node);

		if (text.endsWith('Z')) {
			return;
		}

		// An offset is whole minutes, so only the date and time change. The fraction stays as written, so `.500` stays `.500`. A `Date` holds every instant SOML can write, and needs no `Temporal`.
		const {dateTime, fraction = '', offset} = INSTANT.exec(text).groups;
		const utc = `${new Date(dateTime + offset).toISOString().slice(0, 'YYYY-MM-DDTHH:MM:SS'.length)}${fraction}Z`;

		return {
			node,
			messageId: MESSAGE_ID,
			data: {utc},
			// The offset is not part of the value, so this keeps it.
			fix: fixer => fixer.replaceText(node, utc),
		};
	});
};

/**
@type {SomlRule}
*/
const config = {
	create,
	meta: {
		type: 'suggestion',
		docs: {
			description: 'Prefer instants in UTC.',
			recommended: false,
		},
		fixable: 'code',
		messages,
		languages: ['soml/soml'],
	},
};

export default config;
