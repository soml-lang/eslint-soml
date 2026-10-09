import toEslintRule from './to-eslint-rule.js';

/**
@import {RuleDefinition} from '@eslint/core';
@import {SomlRule} from './to-eslint-rule.js';
*/

/**
Convert the SOML-style rules, by rule ID, to ESLint rules.

@param {Record<string, SomlRule>} rules
@returns {Record<string, RuleDefinition>}
*/
export default function toEslintRules(rules) {
	return Object.fromEntries(Object.entries(rules).map(([ruleId, rule]) => [
		ruleId,
		toEslintRule(ruleId, rule),
	]));
}

