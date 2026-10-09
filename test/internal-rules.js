import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import process from 'node:process';
import {Linter} from 'eslint';
import preferContextOn from '../scripts/internal-rules/prefer-context-on.js';
import noFixYieldStar from '../scripts/internal-rules/no-fix-yield-star.js';
import noRestrictedPropertyAccess from '../scripts/internal-rules/no-restricted-property-access.js';
import noTestOnly from '../scripts/internal-rules/no-test-only.js';
import fixSnapshotTest from '../scripts/internal-rules/fix-snapshot-test.js';
import noSourceCodeParameter from '../scripts/internal-rules/no-source-code-parameter.js';
import preferFixerRemoveRange from '../scripts/internal-rules/prefer-fixer-remove-range.js';
import toEslintRule from '../rules/rule/to-eslint-rule.js';
import plugin from '../index.js';
import {getTester} from './utils/test.js';

const getFixer = (name, rule) => code => new Linter().verifyAndFix(code, {
	plugins: {internal: {rules: {[name]: rule}}},
	rules: {[`internal/${name}`]: 'error'},
});

const fixPreferContextOn = getFixer('prefer-context-on', preferContextOn);
const fixNoFixYieldStar = getFixer('no-fix-yield-star', noFixYieldStar);
const fixNoRestrictedPropertyAccess = getFixer('no-restricted-property-access', noRestrictedPropertyAccess);
const fixNoTestOnly = getFixer('no-test-only', noTestOnly);
const fixFixSnapshotTest = getFixer('fix-snapshot-test', fixSnapshotTest);
const fixPreferFixerRemoveRange = getFixer('prefer-fixer-remove-range', preferFixerRemoveRange);

// Execute the retained focused-case expressions with the actual snapshot helper.
const {test: snapshotTest} = getTester(import.meta, 'format');

test('prefer-context-on leaves visitor overrides for manual migration', () => {
	for (const properties of [
		'Integer: first, Integer: second',
		'[selector]: first, Integer: second',
		'Integer: first, ...{Integer: second}',
	]) {
		const code = `const create = context => ({${properties}});`;
		const visits = [];
		const create = vm.runInNewContext(`${code}\ncreate`, {
			selector: 'Integer',
			first() {
				visits.push('first');
			},
			second() {
				visits.push('second');
			},
		});
		const {Integer: visitInteger} = create({});
		visitInteger();
		assert.deepEqual(visits, ['second']);

		const {output, messages, fixed} = fixPreferContextOn(code);
		assert.equal(output, code);
		assert.equal(fixed, false);
		assert.equal(messages.length, 1);
		assert.equal(messages[0].messageId, 'prefer-context-on');
		assert.equal(messages[0].fix, undefined);
	}
});

function getSourceCodeParameterSuggestionOutputs(code) {
	const linter = new Linter();
	const config = {
		plugins: {internal: {rules: {'no-source-code-parameter': noSourceCodeParameter}}},
		rules: {'internal/no-source-code-parameter': 'error'},
	};

	return linter.verify(code, config).flatMap(({suggestions = []}) => suggestions.map(({fix}) => code.slice(0, fix.range[0]) + fix.text + code.slice(fix.range[1])));
}

test('prefer-context-on reports returned listeners without an autofix', () => {
	const code = 'const create = context => ({String: node => {}});\n';
	const {output, messages} = fixPreferContextOn(code);
	assert.equal(output, code);
	assert.deepEqual(messages.map(({messageId}) => messageId), ['prefer-context-on']);
	assert.equal(messages[0].fix, undefined);
});

test('prefer-context-on keeps a spread in an arrow function body', () => {
	const code = 'const create = context => ({String: node => {}, ...other});\n';
	const {output, messages} = fixPreferContextOn(code);
	assert.equal(output, code);
	// The spread stays in the object for manual migration.
	assert.deepEqual(messages.map(({messageId}) => messageId), ['prefer-context-on']);
});

test('prefer-context-on keeps a spread in a returned object', () => {
	const code = 'function create(context) {\n\treturn {String: node => {}, ...other};\n}\n';
	const {output, messages} = fixPreferContextOn(code);
	assert.equal(output, code);
	assert.deepEqual(messages.map(({messageId}) => messageId), ['prefer-context-on']);
});

test('no-fix-yield-star removes the star and one of the spaces around it', () => {
	for (const [code, expected] of [
		['function * fix(fixer) {\n\tyield * [fixer];\n}\n', 'function * fix(fixer) {\n\tyield [fixer];\n}\n'],
		['function * fix(fixer) {\n\tyield* [fixer];\n}\n', 'function * fix(fixer) {\n\tyield [fixer];\n}\n'],
		['function * fix(fixer) {\n\tyield *[fixer];\n}\n', 'function * fix(fixer) {\n\tyield [fixer];\n}\n'],
		['function * fix(fixer) {\n\tyield*[fixer];\n}\n', 'function * fix(fixer) {\n\tyield [fixer];\n}\n'],
	]) {
		const {output, messages} = fixNoFixYieldStar(code);
		assert.equal(output, expected);
		assert.deepEqual(messages, []);
	}
});

test('no-fix-yield-star leaves other iterables report-only', () => {
	for (const code of [
		'function * fix(fixer) {\n\tyield * other(fixer);\n}\n',
		'function * fix(fixer) {\n\tyield * fixes;\n}\n',
	]) {
		const {output, messages} = fixNoFixYieldStar(code);
		assert.equal(output, code);
		assert.equal(messages.length, 1);
		assert.equal(messages[0].messageId, 'no-fix-yield-star');
		assert.equal(messages[0].fix, undefined);
	}
});

test('no-fix-yield-star ignores a function without a fixer', () => {
	const code = 'function * items(list) {\n\tyield * list;\n}\n';
	assert.deepEqual(fixNoFixYieldStar(code), {fixed: false, messages: [], output: code});
});

test('no-restricted-property-access uses an initialized context parameter', () => {
	const withVariable = 'const create = context => {\n\tconst {sourceCode} = context;\n\tcontext.on(\'String\', node => node.loc);\n};\n';
	assert.equal(fixNoRestrictedPropertyAccess(withVariable).output, withVariable.replace('node.loc', 'context.sourceCode.getLoc(node)'));

	const withContext = 'const create = context => {\n\tcontext.on(\'String\', node => node.loc);\n};\n';
	assert.equal(fixNoRestrictedPropertyAccess(withContext).output, withContext.replace('node.loc', 'context.sourceCode.getLoc(node)'));

	// Neither is in scope, so there is no fix.
	const withNeither = 'const getEnd = node => node.range[1];\n';
	assert.equal(fixNoRestrictedPropertyAccess(withNeither).output, withNeither);
});

test('no-restricted-property-access does not fix where a call cannot take the place of the property', () => {
	for (const code of [
		// An optional chain would call `getRange(undefined)` instead of giving `undefined`.
		'const create = context => context.on(\'String\', node => node?.parent.range);\n',
		'const create = context => context.on(\'String\', node => {\n\tnode.range = [0, 1];\n});\n',
		'const create = context => context.on(\'String\', node => {\n\tdelete node.loc;\n});\n',
		// The comment would be removed.
		'const create = context => context.on(\'String\', node => node /* the node */ .range);\n',
	]) {
		const {output, messages} = fixNoRestrictedPropertyAccess(code);
		assert.equal(output, code);
		assert.equal(messages.length, 1);
	}
});

test('no-fix-yield-star ignores a `yield*` whose value is used', () => {
	// `yield*` gives the return value of the delegate, and `yield` gives `undefined` here.
	const code = 'function * fix(fixer) {\n\tconst moved = yield * move(fixer);\n\tif (!moved) {\n\t\treturn;\n\t}\n}\n';
	assert.deepEqual(fixNoFixYieldStar(code), {fixed: false, messages: [], output: code});
});

test('no-test-only leaves focused cases for manual removal', () => {
	for (const code of [
		'const valid = [test.only(\'a: 1\')];\n',
		'const valid = [test.only({code: \'a: 1\'})];\n',
	]) {
		const {output, messages, fixed} = fixNoTestOnly(code);
		assert.equal(output, code);
		assert.equal(fixed, false);
		assert.deepEqual(messages.map(({messageId}) => messageId), ['no-test-only']);
		assert.equal(messages[0].fix, undefined);
	}

	// A `node:test` callback, an expression that needs its parentheses, and a spread are reported without a fix.
	for (const code of [
		'test.only(async () => {\n\tassert.ok(true);\n});\n',
		'const x = test.only(a ? b : c).code;\n',
		'test.only(...cases);\n',
	]) {
		const {output, messages} = fixNoTestOnly(code);
		assert.equal(output, code);
		assert.equal(messages.length, 1);
		assert.equal(messages[0].messageId, 'no-test-only');
		assert.equal(messages[0].fix, undefined);
	}
});

test('no-test-only preserves node:test registrations without callbacks', () => {
	for (const invocation of ['test.only({todo: \'missing coverage\'})', 'test.only(\'unfinished test\')']) {
		const code = `import test from 'node:test';\n${invocation};`;
		const {output, messages} = fixNoTestOnly(code);

		// An omitted callback is valid, and an options-only call can register a TODO test.
		for (const source of [code, output]) {
			const report = execFileSync(process.execPath, ['--test-only', '--test-reporter=tap', '--input-type=module', '--eval', source], {
				encoding: 'utf8',
				// Run independently of the parent test runner's IPC reporter.
				env: {...process.env, NODE_TEST_CONTEXT: undefined},
			});
			assert.match(report, /^# tests 1$/mv);
			if (invocation.includes('todo:')) {
				assert.match(report, /^# todo 1$/mv);
			}
		}

		assert.equal(output, code);
		assert.equal(messages.length, 1);
		assert.equal(messages[0].messageId, 'no-test-only');
		assert.equal(messages[0].fix, undefined);
	}
});

test('prefer-context-on does not fix a return that is not directly in the function body', () => {
	// The listeners would no longer depend on the condition.
	const code = 'function create(context) {\n\tif (x) return {String: node => {}};\n}\n';
	const {output, messages} = fixPreferContextOn(code);
	assert.equal(output, code);
	assert.equal(messages.length, 1);
});

test('prefer-context-on keeps a computed key as an expression', () => {
	const code = 'const create = context => ({[selector]: node => {}});\n';
	const {output, messages} = fixPreferContextOn(code);
	assert.equal(output, code);
	assert.deepEqual(messages.map(({messageId}) => messageId), ['prefer-context-on']);
});

test('prefer-context-on keeps an async method async and leaves a getter', () => {
	const code = 'const create = context => ({async String(node) {\n\tawait x;\n}});\n';
	const {output, messages} = fixPreferContextOn(code);
	assert.equal(output, code);
	assert.deepEqual(messages.map(({messageId}) => messageId), ['prefer-context-on']);

	// A getter stays in the object for manual migration too.
	const getter = 'const create = context => ({get String() {\n\treturn f;\n}});\n';
	assert.equal(fixPreferContextOn(getter).output, getter);
});

test('prefer-context-on keeps the parentheses around a returned object', () => {
	const code = 'function create(context) {\n\treturn ({String: node => {}});\n}\n';
	const {output, messages} = fixPreferContextOn(code);
	assert.equal(output, code);
	assert.deepEqual(messages.map(({messageId}) => messageId), ['prefer-context-on']);
});

test('prefer-context-on keeps comments inside the parentheses around a returned object', () => {
	for (const code of [
		'function create(context) { return (/* keep rationale */ {String: node => {}}); }',
		'function create(context) { return ({String: node => {}} /* keep rationale */); }',
		'const create = context => (/* keep rationale */ {String: node => {}});',
	]) {
		const {output, messages} = fixPreferContextOn(code);
		assert.equal(output, code);
		assert.equal(messages.length, 1);
		assert.equal(messages[0].fix, undefined);
	}
});

test('prefer-context-on ignores an arrow function that calls `context.on()`', () => {
	const code = 'const create = context => context.on(\'String\', node => {});\n';
	assert.deepEqual(fixPreferContextOn(code), {fixed: false, messages: [], output: code});
});

test('prefer-context-on does not fix when a comment would be lost', () => {
	for (const code of [
		'const create = context => ({String: /* keep */ node => {}});\n',
		'const create = context => ({String: node => {}, // trailing\n});\n',
	]) {
		const {output, messages} = fixPreferContextOn(code);
		assert.equal(output, code);
		assert.equal(messages.length, 1);
	}

	// A comment before a listener stays with it for manual migration.
	const code = 'const create = context => ({\n\t// About strings\n\tString: node => {},\n});\n';
	assert.equal(fixPreferContextOn(code).output, code);
});

test('fix-snapshot-test turns an object with only `code` into a string', () => {
	assert.equal(fixFixSnapshotTest('test.snapshot({invalid: [{code: \'a\'}]});\n').output, 'test.snapshot({invalid: [\'a\']});\n');

	// A comment between the key and the value would be lost, and a method has no value to keep.
	for (const code of [
		'test.snapshot({invalid: [{code: /* note */ \'a\'}]});\n',
		'test.snapshot({invalid: [{code() {}}]});\n',
	]) {
		const {output, messages} = fixFixSnapshotTest(code);
		assert.equal(output, code);
		assert.equal(messages.length, 1);
	}
});

test('no-source-code-parameter suggestions give code that parses', () => {
	const linter = new Linter();

	for (const code of [
		'export const f = sourceCode => ({text: sourceCode.text});\n',
		'export function f(node, sourceCode) {\n\treturn {node, sourceCode};\n}\n',
		'export function f(context, sourceCode) {\n\treturn sourceCode.text;\n}\n',
		// The `(` before the parameter is the call, not the parentheses of the arrow function.
		'foo(sourceCode => sourceCode.text);\n',
		'foo(async sourceCode => sourceCode.text);\n',
	]) {
		const outputs = getSourceCodeParameterSuggestionOutputs(code);
		assert.ok(outputs.length > 0);

		for (const output of outputs) {
			assert.deepEqual(linter.verify(output, {}).filter(({fatal}) => fatal), [], output);
		}
	}

	assert.deepEqual(getSourceCodeParameterSuggestionOutputs('export const f = sourceCode => ({text: sourceCode.text});\n'), [
		'export const f = ({sourceCode}) => ({text: sourceCode.text});\n',
	]);
});

test('prefer-context-on ignores a function that returns `context.on()`', () => {
	const code = 'function create(context) {\n\treturn context.on(\'String\', node => {});\n}\n';
	assert.deepEqual(fixPreferContextOn(code), {fixed: false, messages: [], output: code});
});

test('prefer-context-on does not copy a comment when the object stays', () => {
	// The object and its comment stay together for manual migration.
	const code = 'const create = context => ({\n\t// About strings\n\tString: node => {},\n\t...other,\n});\n';
	const {output, messages} = fixPreferContextOn(code);
	assert.equal(output, code);
	assert.equal(messages.length, 1);
});

test('no-source-code-parameter only offers a suggestion that preserves bindings and defaults', () => {
	for (const code of [
		'function f(sourceCode) { const context = {}; return sourceCode.text; }',
		'function f(sourceCode, {context} = {}) { return sourceCode.text; }',
		'function f(sourceCode, text = sourceCode.text) { return text; }',
		'function f(sourceCode) { var sourceCode; return sourceCode.text; }',
	]) {
		const outputs = getSourceCodeParameterSuggestionOutputs(code);
		assert.equal(outputs.length, 1, code);
		for (const output of outputs) {
			const callback = vm.runInNewContext(`${output}\nf`);
			assert.equal(callback({sourceCode: {text: 'value'}}), 'value', output);
		}
	}
});

test('no-restricted-property-access does not rewrite assignment targets in patterns or loops', () => {
	for (const body of [
		'for (node.range of nodes) {}',
		'for (node.loc in nodes) {}',
		'[node.range] = nodes;',
		'({value: node.range} = other);',
		'[...node.range] = nodes;',
		'({value: node.range = fallback} = other);',
	]) {
		const code = `function f(context, node, nodes, other, fallback) { ${body} }`;
		const {output, messages} = fixNoRestrictedPropertyAccess(code);
		assert.equal(output, code);
		assert.equal(messages.length, 1);
		assert.equal(messages[0].messageId, 'no-restricted-property-access');
		assert.equal(messages[0].fix, undefined);
	}
});

test('no-fix-yield-star keeps fixes when a line break follows the star', () => {
	for (const separator of ['\n', '\r\n', '\u{2028}', '\u{2029}', ' /* rationale\n */ ']) {
		const code = `function * fix(fixer) { yield*${separator}[fixer]; }`;
		const {output, messages} = fixNoFixYieldStar(code);
		assert.equal(output, code);
		assert.equal(messages.length, 1);
		assert.equal(messages[0].messageId, 'no-fix-yield-star');
		assert.equal(messages[0].fix, undefined);
		assert.deepEqual(messages.filter(({fatal}) => fatal), []);
		const callback = vm.runInNewContext(`${output}\nfix`);
		assert.deepEqual([...callback(1)], [1], output);
	}
});

test('no-fix-yield-star preserves catching errors from delegated generators', () => {
	const code = 'function * fix(fixer, node) { try { yield* getFixes(); } catch { yield fixer.replaceText(node, \'2\'); } }';
	const {output, messages} = fixNoFixYieldStar(code);

	for (const source of [code, output]) {
		const fix = vm.runInNewContext(`${source}\nfix`, {
			* getFixes() {
				yield undefined;
				throw new Error('Cannot build these fixes.');
			},
		});
		const rule = toEslintRule('test', {
			meta: {fixable: 'code', languages: ['soml/soml']},
			create(context) {
				context.on('Integer', node => ({node, message: 'Number.', fix: fixer => fix(fixer, node)}));
			},
		});
		const [message] = new Linter().verify('a: 1', {
			files: ['**/*.soml'],
			language: 'soml/soml',
			plugins: {soml: plugin, test: {rules: {rule}}},
			rules: {'test/rule': 'error'},
		}, {filename: 'file.soml'});
		assert.deepEqual(message.fix, {range: [3, 4], text: '2'});
	}

	assert.equal(output, code);
	assert.equal(messages.length, 1);
	assert.equal(messages[0].fix, undefined);
});

test('prefer-context-on does not introduce an undefined context binding', () => {
	for (const code of [
		'const create = () => ({String: node => {}});',
		'function create() { return {String: node => {}}; }',
		'const create = ruleContext => ({String: node => ruleContext.report(node)});',
	]) {
		const {output, messages} = fixPreferContextOn(code);
		assert.equal(output, code);
		assert.equal(messages.length, 1);
		assert.equal(messages[0].messageId, 'prefer-context-on');
		assert.equal(messages[0].fix, undefined);
	}
});

test('no-test-only preserves focused object expressions', () => {
	for (const code of [
		'const f = code => test.only({code});',
		'const f = code => test.only({code},);',
		'const f = code => test.only({code}).code;',
	]) {
		const {output, messages} = fixNoTestOnly(code);
		assert.equal(output, code);
		assert.deepEqual(messages.map(({messageId}) => messageId), ['no-test-only']);
		assert.equal(messages[0].fix, undefined);
		const callback = vm.runInNewContext(`${output}\nf`, {test: snapshotTest});
		const value = callback('a: 1');
		assert.equal(typeof value === 'string' ? value : value?.code, 'a: 1', output);
	}
});

test('no-test-only does not turn a parenthesized template tag into invalid JavaScript', () => {
	for (const code of [
		'(test.only)`a: 1`;',
		'((test.only))`a: 1`;',
	]) {
		const {output, messages} = fixNoTestOnly(code);
		assert.equal(output, code);
		assert.deepEqual(messages.map(({messageId}) => messageId), ['no-test-only']);
		assert.equal(messages[0].fix, undefined);
		assert.equal(vm.runInNewContext(output, {test: snapshotTest}).code, 'a: 1', output);
	}
});

test('no-test-only keeps comments in the callee or its parentheses', () => {
	for (const code of [
		'const cases = [test /* keep rationale */ .only(\'a: 1\')];',
		'(test.only /* keep rationale */)`a: 1`;',
	]) {
		const {output, messages} = fixNoTestOnly(code);
		assert.equal(output, code);
		assert.equal(messages.length, 1);
		assert.equal(messages[0].messageId, 'no-test-only');
		assert.equal(messages[0].fix, undefined);
	}
});

test('no-source-code-parameter leaves defaulted parameters without a suggestion', () => {
	const code = 'function f(sourceCode = {text: \'default\'}) { return sourceCode.text; }';
	const linter = new Linter();
	const messages = linter.verify(code, {
		plugins: {internal: {rules: {'no-source-code-parameter': noSourceCodeParameter}}},
		rules: {'internal/no-source-code-parameter': 'error'},
	});
	assert.equal(messages.length, 1);
	assert.equal(messages[0].messageId, 'no-source-code-parameter');
	assert.equal(messages[0].suggestions, undefined);
	assert.equal(vm.runInNewContext(`${code}\nf`)(), 'default');
});

test('no-restricted-property-access still fixes reads inside patterns and loops', () => {
	for (const [body, expected] of [
		['const [value = node.range] = []; return value;', 'key'],
		['const {value = node.range} = {}; return value;', 'key'],
		['const {[node.range]: value} = {key: \'value\'}; return value;', 'value'],
		['for (const value of node.range) { return value; }', 'k'],
	]) {
		const code = `function f(context, node) { ${body} }`;
		const {output, messages} = fixNoRestrictedPropertyAccess(code);
		assert.equal(output, code.replace('node.range', 'context.sourceCode.getRange(node)'));
		assert.deepEqual(messages, []);
		const callback = vm.runInNewContext(`${output}\nf`);
		assert.equal(callback({sourceCode: {getRange: node => node.range}}, {range: 'key'}), expected);
	}
});

test('no-restricted-property-access does not read a binding before initialization', () => {
	for (const body of [
		'const value = node.range; const {sourceCode} = getContext(); return value;',
		'const sourceCode = getContext(node.range).sourceCode; return sourceCode.getRange(node);',
		'const value = node.range; const context = getContext(); return value;',
	]) {
		const code = `function f(node, getContext) { ${body} }`;
		const {output, messages} = fixNoRestrictedPropertyAccess(code);
		assert.equal(output, code);
		assert.equal(messages.length, 1);
		assert.equal(messages[0].messageId, 'no-restricted-property-access');
		assert.equal(messages[0].fix, undefined);
		const range = [1, 2];
		const callback = vm.runInNewContext(`${output}\nf`);
		assert.equal(callback({range}, () => ({sourceCode: {getRange: node => node.range}})), range, output);
	}
});

test('no-restricted-property-access fixes initialized source code parameters', () => {
	const sourceCode = {getRange: node => node.range};
	for (const [code, argument] of [
		['function f(sourceCode, node) { return node.range; }', sourceCode],
		['const f = (sourceCode, node) => node.range;', sourceCode],
		['function f({sourceCode}, node) { return node.range; }', {sourceCode}],
	]) {
		const {output, messages, fixed} = fixNoRestrictedPropertyAccess(code);
		assert.equal(fixed, true);
		assert.deepEqual(messages, []);
		const range = [1, 2];
		assert.equal(vm.runInNewContext(`${output}\nf`)(argument, {range}), range);
	}
});

test('no-restricted-property-access leaves parameter defaults and captured local bindings report-only', () => {
	for (const code of [
		'function f(node, getContext, sourceCode = getContext(node.range).sourceCode) { return sourceCode.getRange(node); }',
		'function f(node, getContext, context = getContext(node.range)) { return context.sourceCode.getRange(node); }',
		'function f(node, getContext) { const value = read(); const {sourceCode} = getContext(); function read() { return node.range; } return value; }',
	]) {
		const {output, messages} = fixNoRestrictedPropertyAccess(code);
		assert.equal(output, code);
		assert.equal(messages.length, 1);
		assert.equal(messages[0].messageId, 'no-restricted-property-access');
		assert.equal(messages[0].fix, undefined);
		const range = [1, 2];
		assert.equal(vm.runInNewContext(`${output}\nf`)({range}, () => ({sourceCode: {getRange: node => node.range}})), range);
	}
});

test('no-fix-yield-star keeps same-line comments while removing delegation', () => {
	const code = 'function * fix(fixer) { yield* /* rationale */ [fixer]; }';
	const {output, messages, fixed} = fixNoFixYieldStar(code);
	assert.equal(fixed, true);
	assert.deepEqual(messages, []);
	assert.equal(output.includes('/* rationale */'), true);
	const callback = vm.runInNewContext(`${output}\nfix`);
	assert.deepEqual([...callback(1)].flat(), [1]);
});

test('no-test-only preserves comments inside focused test cases', () => {
	const code = 'const f = () => test.only(/* keep rationale */ {code: \'a: 1\'});';
	const {output, messages} = fixNoTestOnly(code);
	assert.equal(output, code);
	assert.deepEqual(messages.map(({messageId}) => messageId), ['no-test-only']);
	assert.equal(messages[0].fix, undefined);
	assert.equal(output.includes('/* keep rationale */'), true);
	assert.equal(vm.runInNewContext(`${output}\nf`, {test: snapshotTest})().code, 'a: 1');
});

test('no-test-only keeps expressions grouped across line breaks', () => {
	for (const expression of [
		'test.only(\n\'a: 1\')',
		'test.only\n(\'a: 1\')',
		'test.only\n`a: 1`',
		'test.only /* rationale\n */ `a: 1`',
	]) {
		const code = `function f() { return ${expression}; }`;
		const {output, messages} = fixNoTestOnly(code);
		assert.equal(output, code);
		assert.deepEqual(messages.map(({messageId}) => messageId), ['no-test-only']);
		assert.equal(messages[0].fix, undefined);
		assert.equal(vm.runInNewContext(`${output}\nf`, {test: snapshotTest})().code, 'a: 1', output);

		const throwingCode = code.replace('return', 'throw');
		const throwing = fixNoTestOnly(throwingCode);
		assert.equal(throwing.output, throwingCode);
		assert.deepEqual(throwing.messages.map(({messageId}) => messageId), ['no-test-only']);
		assert.equal(throwing.messages[0].fix, undefined);
		assert.throws(() => vm.runInNewContext(`${throwing.output}\nf`, {test: snapshotTest})(), error => error.code === 'a: 1' && error.only === true);
	}
});

test('fix-snapshot-test preserves parentheses around a code expression', () => {
	const code = 'test.snapshot({invalid: [{code: (prepare(), \'a: 1\')}]});';
	const {output, messages} = fixFixSnapshotTest(code);
	assert.deepEqual(messages, []);
	let cases;
	let preparations = 0;
	vm.runInNewContext(output, {
		prepare() {
			preparations++;
		},
		test: {
			snapshot(value) {
				cases = value;
			},
		},
	});
	assert.equal(preparations, 1);
	assert.equal(cases.invalid.length, 1);
	assert.equal(cases.invalid[0], 'a: 1');
});

test('prefer-fixer-remove-range preserves parentheses and argument comments', () => {
	for (const [code, comment] of [
		['fixer.replaceTextRange((range), ((\'\')), /* keep trailing */);', '/* keep trailing */'],
		['fixer.replaceTextRange(range, (/* keep */ \'\'),);', '/* keep */'],
		['fixer.replaceTextRange(range, // keep\n(\'\'));', '// keep'],
	]) {
		const {output, messages} = fixPreferFixerRemoveRange(code);
		assert.deepEqual(messages, []);
		assert.equal(output.includes(comment), true);
		const range = [1, 2];
		const calls = [];
		vm.runInNewContext(output, {
			range,
			fixer: {
				removeRange(value) {
					calls.push(value);
				},
			},
		});
		assert.equal(calls.length, 1);
		assert.equal(calls[0], range);
	}
});

test('prefer-context-on preserves grouped selector and listener expressions', () => {
	for (const [property, expectedPreparations] of [
		['[(prepare(), \'String\')]: listener', 1],
		['String: (prepare(), listener)', 1],
		['[(prepare(), \'String\')]: (prepare(), listener)', 2],
		['[((prepare(), \'String\'))]: ((prepare(/* rationale */), listener))', 2],
	]) {
		const code = `const create = context => ({${property}});`;
		const {output, messages} = fixPreferContextOn(code);
		assert.equal(output, code);
		assert.deepEqual(messages.map(({messageId}) => messageId), ['prefer-context-on']);
		let preparations = 0;
		const listener = () => {};
		const create = vm.runInNewContext(`${output}\ncreate`, {
			listener,
			prepare() {
				preparations++;
			},
		});
		assert.equal(create({}).String, listener);
		assert.equal(preparations, expectedPreparations);
		if (property.includes('/* rationale */')) {
			assert.equal(output.includes('/* rationale */'), true);
		}
	}
});

for (const [property, isGenerator] of [
	['String(node) { return node; }', false],
	['async String(node) { return node; }', false],
	['* String(node) { yield node; }', true],
	['async * String(node) { yield node; }', true],
]) {
	test(`prefer-context-on preserves listener method ${property}`, async () => {
		const code = `const create = context => ({${property}});`;
		const {output, messages} = fixPreferContextOn(code);
		assert.equal(output, code);
		assert.deepEqual(messages.map(({messageId}) => messageId), ['prefer-context-on']);
		const {String: listener} = vm.runInNewContext(`${output}\ncreate`, {})({});
		const value = listener('value');
		const result = await (isGenerator ? value.next() : value);
		assert.equal(isGenerator ? result.value : result, 'value');
	});
}

test('no-source-code-parameter does not suggest invalid parameters for a use strict directive', () => {
	for (const code of [
		'function f(sourceCode) { \'use strict\'; return sourceCode.text; }',
		'const f = sourceCode => { \'use strict\'; return sourceCode.text; };',
		'const object = {f(sourceCode) { \'custom\'; \'use strict\'; return sourceCode.text; }};',
		'async function f(sourceCode) { \'use strict\'; return sourceCode.text; }',
		'function * f(sourceCode) { \'use strict\'; yield sourceCode.text; }',
		'class Reader { f(sourceCode) { \'use strict\'; return sourceCode.text; } }',
	]) {
		const messages = new Linter().verify(code, {
			plugins: {internal: {rules: {'no-source-code-parameter': noSourceCodeParameter}}},
			rules: {'internal/no-source-code-parameter': 'error'},
		});
		assert.equal(messages.length, 1);
		assert.equal(messages[0].messageId, 'no-source-code-parameter');
		assert.equal(messages[0].suggestions, undefined);
	}
});

test('no-source-code-parameter still suggests destructuring for nested directives and ordinary strings', () => {
	for (const code of [
		'function f(sourceCode) { const read = () => { \'use strict\'; return sourceCode.text; }; return read(); }',
		'function f(sourceCode) { void 0; \'use strict\'; return sourceCode.text; }',
		'function f(sourceCode) { (\'use strict\'); return sourceCode.text; }',
	]) {
		const outputs = getSourceCodeParameterSuggestionOutputs(code);
		assert.equal(outputs.length, 1);
		const callback = vm.runInNewContext(`${outputs[0]}\nf`);
		assert.equal(callback({sourceCode: {text: 'value'}}), 'value');
	}
});
