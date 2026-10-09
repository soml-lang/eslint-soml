import test from 'node:test';
import assert from 'node:assert/strict';
import {Linter} from 'eslint';
import plugin from '../index.js';

const linter = new Linter();

/*
Runs `create` as a rule on `code`, and returns the messages without the parts every test would repeat.
*/
function lint(code, create = () => ({})) {
	const config = {
		files: ['**/*.soml'],
		language: 'soml/soml',
		plugins: {
			soml: plugin,
			test: {
				rules: {
					rule: {
						meta: {
							type: 'problem',
							schema: [],
							messages: {message: '{{text}}'},
						},
						create,
					},
				},
			},
		},
		rules: {
			'test/rule': 'error',
		},
	};

	return linter.verify(code, config, {filename: 'file.soml'})
		.map(({ruleId, message, line, column, endLine, endColumn, fatal}) => ({
			ruleId,
			message,
			line,
			column,
			...(endLine !== undefined && {endLine, endColumn}),
			...(fatal && {fatal}),
		}));
}

/*
A rule that reports every node of `type`, with the text that `describe` returns.
*/
const reportEach = (type, describe) => context => ({
	[type](node) {
		context.report({node, messageId: 'message', data: {text: describe(node, context.sourceCode)}});
	},
});

const tokenText = token => token === null ? 'none' : token.value;

test('a valid document has no problems', () => {
	assert.deepEqual(lint('name: \'soml\'\n'), []);
});

test('a parse error is a fatal problem at its position', () => {
	assert.deepEqual(lint('a: 1\nb 2'), [{
		ruleId: null,
		message: 'Parsing error: Expected “:” after the key, but found “2”',
		line: 2,
		column: 3,
		fatal: true,
	}]);
});

test('a parse error column counts UTF-16 code units, like every other column', () => {
	const [problem] = lint('a: \'😀\' b');
	assert.equal(problem.line, 1);
	assert.equal(problem.column, 9);
});

test('a parse error at the start of a later line', () => {
	const [problem] = lint('a: 1\n\n+');
	assert.deepEqual({line: problem.line, column: problem.column}, {line: 3, column: 1});
});

test('a `.` after a key is a parse error at the `.`', () => {
	assert.deepEqual(lint('a.b: 1'), [{
		ruleId: null,
		message: 'Parsing error: A bare key cannot contain “.”. Quote it, as in \'a.b\', or use braces to nest, as in a: {b: …}',
		line: 1,
		column: 2,
		fatal: true,
	}]);

	const [problem] = lint('\'a\'.b: 1');
	assert.deepEqual({line: problem.line, column: problem.column}, {line: 1, column: 4});
});

test('a byte order mark is a parse error', () => {
	assert.deepEqual(lint('\u{FEFF}a: 1'), [{
		ruleId: null,
		message: 'Parsing error: A byte order mark (BOM) is not allowed',
		line: 1,
		column: 1,
		fatal: true,
	}]);
});

test('an empty file is a parse error', () => {
	assert.equal(lint('')[0].fatal, true);
});

test('node locations', () => {
	assert.deepEqual(lint('a: \'😀\'\nb: [1]', reportEach('Integer', node => String(node.value))), [{
		ruleId: 'test/rule',
		message: '1',
		line: 2,
		column: 5,
		endLine: 2,
		endColumn: 6,
	}]);
});

test('nodes are visited in source order, with exit visits', () => {
	const visits = [];
	lint('a: [1, {c: true}]', () => new Proxy({}, {
		get: (target, property) => node => {
			visits.push(`${property}:${node.type}`);
		},
		has: () => true,
		ownKeys: () => ['Document', 'Object', 'Member', 'Key', 'Array', 'Integer', 'Boolean', 'Array:exit'],
		getOwnPropertyDescriptor: () => ({enumerable: true, configurable: true}),
	}));
	assert.deepEqual(visits, [
		'Document:Document',
		'Object:Object',
		'Member:Member',
		'Key:Key',
		'Array:Array',
		'Integer:Integer',
		'Object:Object',
		'Member:Member',
		'Key:Key',
		'Boolean:Boolean',
		'Array:exit:Array',
	]);
});

test('getParent', () => {
	const messages = lint('a: [1, {b: 2}]', reportEach('Integer', (node, sourceCode) => {
		const parent = sourceCode.getParent(node);
		return `${parent.type} in ${sourceCode.getParent(parent).type}`;
	}));
	assert.deepEqual(messages.map(({message}) => message), ['Array in Member', 'Member in Object']);
	assert.deepEqual(lint('[1]', reportEach('Document', (node, sourceCode) => String(sourceCode.getParent(node)))).map(({message}) => message), ['undefined']);
});

test('getAncestors returns nodes from the root to the parent', () => {
	const messages = lint('# outer\na: [1, {/* inner */ b: 2}]', reportEach('Integer', (node, sourceCode) => sourceCode.getAncestors(node).map(ancestor => ancestor.type).join(' > ')));
	assert.deepEqual(messages.map(({message}) => message), [
		'Document > Object > Member > Array',
		'Document > Object > Member > Array > Object > Member',
	]);
	assert.deepEqual(lint('a: 1', reportEach('Document', (node, sourceCode) => String(sourceCode.getAncestors(node).length))).map(({message}) => message), ['0']);
});

test('the parent argument of a listener', () => {
	const messages = lint('a: [1]', context => ({
		Integer(node, parent) {
			context.report({node, messageId: 'message', data: {text: parent.type}});
		},
	}));
	assert.equal(messages[0].message, 'Array');
});

test('root listeners receive an undefined parent on entry and exit', () => {
	const visits = [];
	const visit = (node, parent) => {
		visits.push([node.type, parent]);
	};

	assert.deepEqual(lint('a: 1', () => ({Document: visit, 'Document:exit': visit})), []);
	assert.deepEqual(visits, [['Document', undefined], ['Document', undefined]]);
});

test('getTokenBefore and getTokenAfter', () => {
	const code = 'a: [1, /* x */ 2] # y\nb: 3';
	const describe = (node, sourceCode) => [
		tokenText(sourceCode.getTokenBefore(node)),
		tokenText(sourceCode.getTokenBefore(node, {includeComments: true})),
		tokenText(sourceCode.getTokenAfter(node)),
		tokenText(sourceCode.getTokenAfter(node, {includeComments: true})),
	].join(' | ');

	assert.deepEqual(lint(code, reportEach('Integer', describe)).map(({message}) => message), [
		'[ | [ | , | ,',
		', |  x  | ] | ]',
		': | : | none | none',
	]);

	// A node that is not a single token.
	assert.deepEqual(lint(code, reportEach('Array', describe)).map(({message}) => message), [': | : | b |  y']);
	assert.deepEqual(lint(code, reportEach('Document', describe)).map(({message}) => message), ['none | none | none | none']);
});

test('getFirstToken, getLastToken, and getTokens', () => {
	const code = 'a: { /* x */ b: 1, /* y */ }';
	const describe = (node, sourceCode) => [
		tokenText(sourceCode.getFirstToken(node)),
		tokenText(sourceCode.getLastToken(node)),
		sourceCode.getTokens(node).map(token => token.value).join(' '),
		sourceCode.getTokens(node, {includeComments: true}).map(token => token.value).join(' '),
	].join(' | ');

	assert.deepEqual(lint(code, reportEach('Object', describe)).map(({message}) => message), [
		'a | } | a : { b : 1 , } | a : {  x  b : 1 ,  y  }',
		'{ | } | { b : 1 , } | {  x  b : 1 ,  y  }',
	]);

	const firstLast = (node, sourceCode) => `${tokenText(sourceCode.getFirstToken(node, {includeComments: true}))} ${tokenText(sourceCode.getLastToken(node, {includeComments: true}))}`;
	assert.deepEqual(lint('[/* x */ 1, # y\n]', reportEach('Array', firstLast)).map(({message}) => message), ['[ ]']);
});

test('getTokens puts leading, consecutive, and trailing comments in source order', () => {
	const code = '# a\n/* b */ x: 1 /* c */ # d\ny: [/* e */ /* f */] # g\n/* h */';
	const describe = (node, sourceCode) => sourceCode.getTokens(node, {includeComments: true}).map(token => token.value.trim()).join(' ');

	assert.deepEqual(lint(code, reportEach('Document', describe)).map(({message}) => message), ['a b x : 1 c d y : [ e f ] g h']);
});

test('getLocFromIndex', () => {
	const describe = (node, sourceCode) => [0, 4, 5, 9, 10, 12].map(index => {
		const {line, column} = sourceCode.getLocFromIndex(index);
		return `${line}:${column}`;
	}).join(' ');

	// The last line has no line feed at the end, and the last offset is the end of the text.
	assert.deepEqual(lint('a: 1\nb: [\n2]', reportEach('Document', describe)).map(({message}) => message), ['1:0 1:4 2:0 2:4 3:0 3:2']);

	const errors = (node, sourceCode) => [-1, 13, '1'].map(index => {
		try {
			sourceCode.getLocFromIndex(index);
		} catch (error) {
			return error.name;
		}

		return 'none';
	}).join(' ');

	assert.deepEqual(lint('a: 1\nb: [\n2]', reportEach('Document', errors)).map(({message}) => message), ['RangeError RangeError TypeError']);
});

test('getIndexFromLoc validates line and column bounds with and without a final LF', () => {
	for (const code of ['a: 1\nb: []', 'a: 1\nb: []\n']) {
		const messages = lint(code, reportEach('Document', (node, sourceCode) => {
			assert.equal(sourceCode.getIndexFromLoc({line: 1, column: 0}), 0);
			assert.equal(sourceCode.getIndexFromLoc({line: 1, column: 4}), 4);
			assert.equal(sourceCode.getIndexFromLoc({line: 2, column: 0}), 5);
			assert.equal(sourceCode.getIndexFromLoc({line: 2, column: 5}), 10);
			assert.equal(sourceCode.getIndexFromLoc(sourceCode.getLoc(node).end), code.length);

			for (const location of [undefined, null, {}, {line: 1}, {line: '1', column: 0}, {line: 1, column: '0'}]) {
				assert.throws(() => sourceCode.getIndexFromLoc(location), TypeError);
			}

			const lastLine = sourceCode.getLoc(node).end.line;
			for (const location of [{line: 0, column: 0}, {line: lastLine + 1, column: 0}, {line: 1, column: -1}, {line: 1, column: 5}, {line: 2, column: 6}, {line: lastLine, column: 99}]) {
				assert.throws(() => sourceCode.getIndexFromLoc(location), RangeError);
			}

			return 'checked';
		}));
		assert.deepEqual(messages.map(({message}) => message), ['checked']);
	}
});

test('parserServices marks the source code as SOML', () => {
	const messages = lint('a: 1', reportEach('Document', (node, sourceCode) => String(sourceCode.parserServices.isSOML)));
	assert.deepEqual(messages.map(({message}) => message), ['true']);
});

test('getFirstToken and getLastToken skip the comments at the ends of the document, and take a node of one token', () => {
	const describe = (node, sourceCode) => [
		sourceCode.getFirstToken(node),
		sourceCode.getLastToken(node),
		sourceCode.getFirstToken(node, {includeComments: true}),
	].map(token => tokenText(token)).join(' ');

	assert.deepEqual(lint('# first\na: 1\n# last', reportEach('Document', describe)).map(({message}) => message), ['a 1  first']);
	assert.deepEqual(lint('a: 1', reportEach('Integer', describe)).map(({message}) => message), ['1 1 1']);
});

test('getAllComments', () => {
	const messages = lint('# one\na: 1 /* two */', reportEach('Document', (node, sourceCode) => sourceCode.getAllComments().map(comment => `${comment.type}:${comment.value}`).join(',')));
	assert.equal(messages[0].message, 'Line: one,Block: two ');
});

test('disable directives in line comments', () => {
	const reportIntegers = reportEach('Integer', node => String(node.value));
	assert.deepEqual(lint('# eslint-disable-next-line test/rule\na: 1\nb: 2', reportIntegers).map(({message}) => message), ['2']);
	assert.deepEqual(lint('a: 1 # eslint-disable-line test/rule\nb: 2', reportIntegers).map(({message}) => message), ['2']);
	assert.deepEqual(lint('# eslint-disable test/rule\na: 1\n# eslint-enable test/rule\nb: 2', reportIntegers).map(({message}) => message), ['2']);
	assert.deepEqual(lint('a: 1 # eslint-disable-line -- because\nb: 2', reportIntegers).map(({message}) => message), ['2']);
});

test('disable directives in block comments', () => {
	const reportIntegers = reportEach('Integer', node => String(node.value));
	assert.deepEqual(lint('/* eslint-disable-next-line test/rule */\na: 1\nb: 2', reportIntegers).map(({message}) => message), ['2']);
	assert.deepEqual(lint('a: 1 /* eslint-disable-line test/rule */\nb: 2', reportIntegers).map(({message}) => message), ['2']);
	assert.deepEqual(lint('/* eslint-disable */\na: 1\nb: 2', reportIntegers), []);
});

test('a multi-line eslint-disable-line comment is a problem', () => {
	const messages = lint('a: 1 /* eslint-disable-line\n*/', reportEach('Integer', node => String(node.value)));
	assert.deepEqual(messages.map(({ruleId, message}) => ({ruleId, message})), [
		{ruleId: 'test/rule', message: '1'},
		{ruleId: null, message: 'eslint-disable-line comment should not span multiple lines.'},
	]);
});

test('inline rule configuration', () => {
	const reportIntegers = reportEach('Integer', node => String(node.value));
	assert.deepEqual(lint('# eslint test/rule: off\na: 1', reportIntegers), []);

	const [problem] = lint('# eslint test/rule: [\na: 1', reportIntegers);
	assert.equal(problem.ruleId, null);
	assert.match(problem.message, /test\/rule/v);
});

test('a line comment that starts with eslint but holds no rule configuration is not a directive', () => {
	const reportIntegers = reportEach('Integer', node => String(node.value));
	assert.deepEqual(lint('eslint: {\n\t# eslint version to install\n\tversion: 10\n}', reportIntegers).map(({message}) => message), ['10']);
	assert.deepEqual(lint('# eslint config lives in eslint.config.js\na: 1', reportIntegers).map(({message}) => message), ['1']);
	assert.deepEqual(lint('# eslint\na: 1', reportIntegers).map(({message}) => message), ['1']);
	// A `:` in the justification is not part of a rule configuration.
	assert.deepEqual(lint('# eslint version -- note: x\na: 1', reportIntegers).map(({message}) => message), ['1']);

	// A block comment is a directive, as in JavaScript.
	const [problem] = lint('/* eslint version to install */\na: 1', reportIntegers);
	assert.equal(problem.ruleId, null);
});

test('a comment that mentions eslint later is not a directive', () => {
	assert.equal(lint('# see eslint-disable docs\na: 1', reportEach('Integer', node => String(node.value))).length, 1);
});

test('locations round trip every UTF-16 offset while only LF starts a new line', () => {
	const code = '# first\na: [\'😀\u{2028}x\u{2029}y\', 1]\nb: "x\\ny"\n';
	let wasVisited = false;
	lint(code, context => ({
		Document() {
			wasVisited = true;
			for (let index = 0; index <= code.length; index++) {
				const location = context.sourceCode.getLocFromIndex(index);
				const before = code.slice(0, index);
				assert.deepEqual(location, {line: before.split('\n').length, column: index - before.lastIndexOf('\n') - 1});
				assert.equal(context.sourceCode.getIndexFromLoc(location), index);
			}
		},
	}));
	assert.equal(wasVisited, true);
});
