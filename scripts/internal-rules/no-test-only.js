import path from 'node:path';
import {fileURLToPath} from 'node:url';

const messageId = path.basename(fileURLToPath(import.meta.url), '.js');

const config = {
	create(context) {
		if (path.basename(context.physicalFilename) === 'snapshot-rule-tester.js') {
			return {};
		}

		return {
			MemberExpression(node) {
				if (
					!(
						!node.computed
						&& !node.optional
						&& node.object.type === 'Identifier'
						&& node.object.name === 'test'
						&& node.property.type === 'Identifier'
						&& node.property.name === 'only'
					)
				) {
					return;
				}

				// Both the snapshot helper and `node:test` take strings or objects, so removing the call is left to manual review.
				// Keep grouping and line breaks intact, including expressions with trailing commas.
				context.report({node, messageId});
			},
		};
	},
	meta: {
		messages: {
			[messageId]: '`test.only` should only be used for debugging purposes. Please remove it before committing.',
		},
	},
};

export default config;
