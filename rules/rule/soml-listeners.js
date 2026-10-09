import toEslintListener from './to-eslint-listener.js';

/**
@import {RuleVisitor} from '@eslint/core';
@import {Node} from 'soml-lang';
@import {SomlRuleContext, SomlRuleListener} from './soml-context.js';
*/

/**
The listeners that a rule adds with `context.on()`, by node type.
*/
export default class SomlListeners {
	#context;
	#listeners = new Map();

	/**
	@param {SomlRuleContext} context
	*/
	constructor(context) {
		this.#context = context;
	}

	/**
	@template {Node['type']} NodeType
	@param {NodeType | NodeType[]} selectorOrSelectors
	@param {SomlRuleListener<NodeType>} listener
	*/
	on(selectorOrSelectors, listener) {
		for (const selector of [selectorOrSelectors].flat()) {
			if (this.#listeners.has(selector)) {
				this.#listeners.get(selector).push(listener);
			} else {
				this.#listeners.set(selector, [listener]);
			}
		}
	}

	/**
	@returns {RuleVisitor}
	*/
	toEslintListeners() {
		const eslintListeners = {};

		for (const [selector, listeners] of this.#listeners) {
			eslintListeners[selector] = toEslintListener(this.#context, listeners);
		}

		return eslintListeners;
	}
}
