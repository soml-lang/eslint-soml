/**
@import {RuleContext} from '@eslint/core';
@import {Node} from 'soml-lang';
@import SomlListeners from './soml-listeners.js';
@import {SomlProblems} from './to-eslint-problem.js';
*/

/**
@typedef {RuleContext} SomlRuleContext
*/

/**
@template {Node['type']} [NodeType=Node['type']]
@typedef {(node: Extract<Node, {type: NodeType}>, parent: Node | undefined) => SomlProblems} SomlRuleListener
*/

/**
@typedef {<NodeType extends Node['type']>(type: NodeType | NodeType[], listener: SomlRuleListener<NodeType>) => void} SomlRuleListen
@typedef {SomlRuleContext & {
	on: SomlRuleListen
}} SomlContext
*/

/**
Create a `Context` object with an `on` method to add listeners. It inherits everything else from the ESLint context, the way ESLint builds rule contexts itself.

@param {SomlRuleContext} eslintContext
@param {SomlListeners} listeners
@returns {SomlContext}
*/
export default function createSomlContext(eslintContext, listeners) {
	return Object.create(eslintContext, {
		on: {value: listeners.on.bind(listeners)},
	});
}
