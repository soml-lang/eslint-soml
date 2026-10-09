import {Linter} from 'eslint';
import {parse, stringify} from 'soml-lang';
import plugin from '../../index.js';

export const linter = new Linter();
export const filename = 'file.soml';

/**
A config that runs `rules` from this plugin, such as `{'soml/format': 'error'}`, on SOML files.

@param {import('eslint').Linter.RulesRecord} rules
*/
export const getConfig = rules => ({
	files: ['**/*.soml'],
	language: 'soml/soml',
	plugins: {soml: plugin},
	rules,
});

/**
Lint `code` with `rules`.

@param {string} code
@param {import('eslint').Linter.RulesRecord} rules
*/
export const lint = (code, rules) => linter.verify(code, getConfig(rules), {filename});

/**
Apply one fix or suggestion. A simple version of ESLint's `SourceCodeFixer.applyFixes()`: https://github.com/eslint/eslint/issues/14936#issuecomment-906746754

@param {string} code
@param {{fix: import('eslint').Rule.Fix}} fixOrSuggestion
*/
export const applyFix = (code, {fix}) => code.slice(0, fix.range[0]) + fix.text + code.slice(fix.range[1]);

/**
The canonical form of a document. It is unique for a value, so it compares values, including instants and durations.

@param {string} text
*/
export const canonical = text => stringify(parse(text), {canonical: true});
