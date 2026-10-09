import packageJson from '../../package.json' with {type: 'json'};

const repositoryUrl = 'https://github.com/soml-lang/eslint-soml';

/**
The URL of a rule's documentation, for the version of this package.

@param {string} ruleName The rule's name, such as `sort-keys`.
@returns {string}
*/
export default function getDocumentationUrl(ruleName) {
	return `${repositoryUrl}/blob/v${packageJson.version}/docs/rules/${ruleName}.md`;
}
