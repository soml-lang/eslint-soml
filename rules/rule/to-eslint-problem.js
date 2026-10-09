import toEslintFixer from './to-eslint-rule-fixer.js';

/**
@import {SomlRuleContext} from './soml-context.js';
@import {SomlRuleFixer} from './to-eslint-rule-fixer.js';
*/

/**
@typedef {Parameters<SomlRuleContext['report']>[0]} EslintProblem
*/

/**
@template {NonNullable<EslintProblem['suggest']>[number]} [Suggestion=NonNullable<EslintProblem['suggest']>[number]]
@typedef {Suggestion extends unknown ? Omit<Suggestion, 'fix'> & {fix: SomlRuleFixer} : never} SomlSuggestion
*/

/**
@template {EslintProblem} [Problem=EslintProblem]
@typedef {Problem extends unknown ? Omit<Problem, 'fix' | 'suggest'> & {fix?: SomlRuleFixer, suggest?: SomlSuggestion[]} : never} SomlProblem
*/

/**
@typedef {SomlProblem | void | Iterable<SomlProblem | void>} SomlProblems
*/

/**
Convert a problem from a listener to an ESLint problem. A suggestion gets the `data` of its problem, so its message can use the same placeholders.

@param {SomlProblem} somlProblem
@returns {EslintProblem}
*/
export default function toEslintProblem(somlProblem) {
	const {fix, suggest, ...problem} = somlProblem;

	/**
	@type {EslintProblem}
	*/
	const eslintProblem = problem;

	if (fix) {
		eslintProblem.fix = toEslintFixer(fix);
	}

	if (suggest) {
		eslintProblem.suggest = suggest.map(somlSuggest => ({
			...somlSuggest,
			fix: toEslintFixer(somlSuggest.fix),
			data: {
				...somlProblem.data,
				...somlSuggest.data,
			},
		}));
	}

	return eslintProblem;
}
