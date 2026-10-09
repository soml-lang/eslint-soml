import {forEachFixOrProblem} from './utilities.js';

/**
@import {RuleTextEditor} from '@eslint/core';
@import {Node} from 'soml-lang';
@import {EslintProblem} from './to-eslint-problem.js';
*/

class FixAbortError extends Error {
	name = 'FixAbortError';
}

const fixOptions = {
	abort() {
		throw new FixAbortError('Fix aborted.');
	},
};

/**
@typedef {NonNullable<EslintProblem['fix']>} EslintRuleFixer
@typedef {RuleTextEditor<Node>} SomlFixer
@typedef {ReturnType<SomlFixer['replaceText']> | void} EslintReportFixer
@typedef {EslintReportFixer | Iterable<EslintReportFixer>} SomlReportFixer
@typedef {(fixer: SomlFixer, options: typeof fixOptions) => SomlReportFixer} SomlRuleFixer
*/

/**
Convert a SOML-style fix function, which may yield its fixes and call `abort()` to give up, to an ESLint-style fix function, which returns an array of fixes. An aborted fix returns no fixes, so ESLint reports the problem without a fix.

@param {SomlRuleFixer} fix
@returns {EslintRuleFixer}
*/
export default function toEslintRuleFixer(fix) {
	/**
	@param {SomlFixer} fixer
	*/
	return fixer => {
		const eslintReport = [];

		try {
			const somlReport = fix(fixer, fixOptions);
			forEachFixOrProblem(somlReport, eslintFix => {
				// ESLint fails on an `undefined` among several fixes.
				if (eslintFix) {
					eslintReport.push(eslintFix);
				}
			});

			return eslintReport;
		} catch (error) {
			if (error instanceof FixAbortError) {
				return [];
			}

			throw error;
		}
	};
}
