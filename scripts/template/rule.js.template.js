import {outdent} from 'outdent';
import indentString from 'indent-string';

const indent = (string, count) => indentString(string, count, {indent: '\t'});

// The description goes in a `'…'` string.
const escapeString = string => string.replaceAll('\\', '\\\\').replaceAll('\'', String.raw`\'`);

const typeImports = outdent`
	/**
	@import {SomlContext} from './rule/soml-context.js';
	@import {SomlRule} from './rule/to-eslint-rule.js';
	@import {SomlRuleFixer} from './rule/to-eslint-rule-fixer.js';
	*/
`;

const createMessages = data =>
	data.hasSuggestions
		? outdent`
			const MESSAGE_ID_ERROR = '${data.id}/error';
			const MESSAGE_ID_SUGGESTION = '${data.id}/suggestion';
			const messages = {
				[MESSAGE_ID_ERROR]: 'Prefer \`{{replacement}}\` over \`{{value}}\`.',
				[MESSAGE_ID_SUGGESTION]: 'Replace \`{{value}}\` with \`{{replacement}}\`.',
			};
		`
		: outdent`
			const MESSAGE_ID = '${data.id}';
			const messages = {
				[MESSAGE_ID]: 'Prefer \`{{replacement}}\` over \`{{value}}\`.',
			};
		`;

const fix = outdent`
	/**
	@param {Parameters<SomlRuleFixer>[0]} fixer
	*/
	fix: fixer => fixer.replaceText(node, '\\'unicorn\\''),
`;

const suggestion = outdent`
	suggest: [
		{
			messageId: MESSAGE_ID_SUGGESTION,
			data: {
				value: '"unicorn"',
				replacement: '\\'unicorn\\'',
			},
	${indent(fix, 2)}
		},
	],
`;

const createRuleCreateFunction = data => outdent`
	/**
	@param {SomlContext} context
	*/
	const create = context => {
		context.on('String', node => {
			if (node.style !== 'escaped' || node.value !== 'unicorn') {
				return;
			}

			return {
				node,
				messageId: ${data.hasSuggestions ? 'MESSAGE_ID_ERROR' : 'MESSAGE_ID'},
				data: {
					value: '"unicorn"',
					replacement: '\\'unicorn\\'',
				},
	${data.fixableType ? indent(fix, 3) : ''}
	${data.hasSuggestions ? indent(suggestion, 3) : ''}
			};
		});
	};
`;

const createConfig = data => outdent`
	/**
	@type {SomlRule}
	*/
	const config = {
		create,
		meta: {
			type: '${data.type}',
			docs: {
				description: '${escapeString(data.description)}',
				recommended: 'unopinionated',
			},
			${data.fixableType ? `fixable: '${data.fixableType}',` : ''}
			${data.hasSuggestions ? 'hasSuggestions: true,' : ''}
			messages,
			languages: ['soml/soml'],
		},
	};
`;

export default function renderRuleTemplate(data) {
	return [
		typeImports,
		createMessages,
		createRuleCreateFunction,
		createConfig,
		'export default config;',
	].map(part => typeof part === 'function' ? part(data) : part).join('\n\n')
		// The parts left out leave lines with only whitespace behind.
		.replaceAll(/\n[\t ]+(?=\n)/gv, '\n')
		.replaceAll(/(?<=[,\{])\n{2,}/gv, '\n')
		.replaceAll(/\n{3,}/gv, '\n\n')
		+ '\n';
}
