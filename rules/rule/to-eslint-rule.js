import getDocumentationUrl from '../utils/get-documentation-url.js';
import toEslintCreate from './to-eslint-create.js';

/**
@import {RuleDefinition} from '@eslint/core';
@import {SomlCreate} from './to-eslint-create.js';
*/

/**
@typedef {Omit<RuleDefinition, 'create'> & {
	create: SomlCreate
}} SomlRule
*/

/**
Convert a SOML-style rule to an ESLint rule, and add the URL of its documentation.

@param {string} ruleId
@param {SomlRule} somlRule
@returns {RuleDefinition}
*/
export default function toEslintRule(ruleId, somlRule) {
	return {
		meta: {
			// If there are no options, add `[]` so ESLint can validate that no data is passed to the rule.
			// https://github.com/not-an-aardvark/eslint-plugin-eslint-plugin/blob/master/docs/rules/require-meta-schema.md
			schema: [],
			...somlRule.meta,
			docs: {
				...somlRule.meta.docs,
				url: getDocumentationUrl(ruleId),
			},
		},
		create: toEslintCreate(somlRule.create),
	};
}
