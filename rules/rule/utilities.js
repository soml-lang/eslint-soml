const isIterable = object => typeof object?.[Symbol.iterator] === 'function';

/**
@import * as ESLint from 'eslint';
@import {SomlReportFixer} from './to-eslint-rule-fixer.js';
@import {SomlProblems, SomlProblem} from './to-eslint-problem.js';
*/

/**
Call `callback` for each ESLint fix or ESLint problem in `value`, flattening nested iterables.

This runs for every listener call of every rule, so it deliberately avoids generators and intermediate arrays.

@template {SomlReportFixer | SomlProblems} ValueType

@param {ValueType} value
@param {(value: ValueType extends SomlReportFixer ? ESLint.Rule.Fix : SomlProblem) => void} callback
@returns {void}
*/
export function forEachFixOrProblem(value, callback) {
	if (!isIterable(value)) {
		callback(value);
		return;
	}

	for (const element of value) {
		forEachFixOrProblem(element, callback);
	}
}
