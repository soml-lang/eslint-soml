import {forEachFixOrProblem} from './utilities.js';
import toEslintProblem from './to-eslint-problem.js';

/**
@import {RuleVisitor} from '@eslint/core';
@import {Node} from 'soml-lang';
@import {SomlRuleContext, SomlRuleListener} from './soml-context.js';
*/

/**
@typedef {(node: Node, parent: Node | undefined) => void} EslintListener
*/

/**
Combine the listeners of a rule for one node type into one ESLint listener, which reports every problem they return or yield.

@param {SomlRuleContext} context
@param {SomlRuleListener[]} listeners
@returns {EslintListener}
*/
export default function toEslintListener(context, listeners) {
	const reportProblem = somlProblem => {
		if (somlProblem) {
			context.report(toEslintProblem(somlProblem));
		}
	};

	/*
	Declared with fixed arity rather than rest arguments, since this runs for every node visit of every rule and a per-call rest array is measurable.
	Listeners receive the node and its parent.
	*/
	return (node, parent) => {
		for (const listener of listeners) {
			const somlProblems = listener(node, parent);

			// Listeners report nothing on the vast majority of nodes, so keep that path free of iterator allocation.
			if (!somlProblems) {
				continue;
			}

			forEachFixOrProblem(somlProblems, reportProblem);
		}
	};
}
