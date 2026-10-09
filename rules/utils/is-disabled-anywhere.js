import {ConfigCommentParser} from '@eslint/plugin-kit';

/**
@import {SomlContext} from '../rule/soml-context.js';
*/

const commentParser = new ConfigCommentParser();

/**
Whether a disable directive in the document turns off the rule of `context` anywhere, as `# eslint-disable-next-line soml/format` does, or as one without rule names does.

A rule whose one fix changes the whole document or a whole object leaves out that fix then. ESLint applies a fix when the problem that carries it is reported, even when the other problems are turned off, so the fix would change the lines that the directive keeps, and ESLint would then remove the directive as unused. A rule cannot see the `noInlineConfig` linter option, so a directive that the option turns off still counts.

@param {SomlContext} context
@returns {boolean}
*/
export default function isDisabledAnywhere(context) {
	return context.sourceCode.getDisableDirectives().directives.some(({type, value}) => type !== 'enable' && (value === '' || Object.hasOwn(commentParser.parseListConfig(value), context.id)));
}
