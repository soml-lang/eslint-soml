/**
@import {SomlContext} from './rule/soml-context.js';
@import {SomlRule} from './rule/to-eslint-rule.js';
*/

const MESSAGE_ID = 'key-name-casing';
const messages = {
	[MESSAGE_ID]: 'The key `{{key}}` is not in {{case}}.',
};

/*
Digits are allowed anywhere, so `http2-port` is kebab-case, and `404` passes in every case.
*/
const CASES = {
	'kebab-case': /^[\da-z]+(?:-[\da-z]+)*$/v,
	camelCase: /^[\da-z][\dA-Za-z]*$/v,
	// eslint-disable-next-line camelcase -- The name of the case is the option value.
	snake_case: /^[\da-z]+(?:_[\da-z]+)*$/v,
	PascalCase: /^[\dA-Z][\dA-Za-z]*$/v,
};

/**
@param {SomlContext} context
*/
const create = context => {
	const [{case: keyCase, ignore}] = context.options;
	const pattern = CASES[keyCase];
	const ignorePatterns = ignore.map(source => new RegExp(source, 'v'));

	context.on('Key', node => {
		// A quoted key holds data rather than a name, such as a path or a URL, so it is not checked.
		if (
			node.style !== 'bare'
			|| pattern.test(node.value)
			|| ignorePatterns.some(ignorePattern => ignorePattern.test(node.value))
		) {
			return;
		}

		return {
			node,
			messageId: MESSAGE_ID,
			data: {
				key: node.value,
				case: keyCase,
			},
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
			description: 'Enforce a casing style for keys.',
			recommended: false,
		},
		schema: [
			{
				type: 'object',
				additionalProperties: false,
				properties: {
					case: {
						enum: Object.keys(CASES),
						description: 'The casing style keys must use.',
					},
					ignore: {
						type: 'array',
						uniqueItems: true,
						items: {
							type: 'string',
						},
						description: 'Regular expressions for keys to ignore.',
					},
				},
			},
		],
		defaultOptions: [
			{
				case: 'kebab-case',
				ignore: [],
			},
		],
		messages,
		languages: ['soml/soml'],
	},
};

export default config;
