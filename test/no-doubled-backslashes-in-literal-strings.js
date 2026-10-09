import outdent from 'outdent';
import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		String.raw`include: '\.pyi?$'`,
		String.raw`pattern: '^v\d+$'`,
		// An escaped string, where `\\` is one backslash.
		String.raw`pattern: "^\\d+$"`,
		// A Windows network path starts with two backslashes.
		String.raw`share: '\\server\share'`,
		// JSON text in a string.
		String.raw`json: '{"ignore": ["\\W"]}'`,
		// Not every backslash is doubled.
		String.raw`pattern: '\\\d'`,
		String.raw`pattern: '\\d \s'`,
		// Not before a regex escape.
		String.raw`pattern: 'a\\(b'`,
		'key: 1',
		String.raw`'^\\d+$': 1`,
		// Code with single-quoted strings in a block string, which doubles its backslashes on purpose.
		outdent`
			script: '''
				const isTs = new RegExp('\\\\.ts$');
				'''
		`,
		outdent`
			query: '''
				WHERE phone REGEXP '^\\\\d{3}$'
				'''
		`,
	],
	invalid: [
		String.raw`include: '\\.pyi?$'`,
		String.raw`tag-pattern: '^v\\d+\\.\\d+\\.\\d+$'`,
		String.raw`pattern: '^\\s+Compiling (\\S+)'`,
		String.raw`path: 'C:\\Windows\\System32'`,
		String.raw`pattern: '\\bword\\b'`,
		String.raw`patterns: ['\\d', '\\w']`,
		String.raw`server: {pattern: '\\d'}`,
		String.raw`pattern: '\\\\d'`,
		outdent`
			pattern: '''
				^\\\\d+
				\\\\s*$
				'''
		`,
		outdent`
			pattern: ''''
				^\\\\d+
				''''
		`,
	],
});
