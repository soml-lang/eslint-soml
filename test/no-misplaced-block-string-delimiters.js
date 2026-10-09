import assert from 'node:assert/strict';
import {test as nodeTest} from 'node:test';
import outdent from 'outdent';
import {lint} from './utils/lint.js';
import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		outdent`
			motd: '''
			Welcome!
			'''
		`,
		// In the middle of a line, the run is plain content.
		outdent`
			text: '''
			Say '''hi''' to everyone.
			'''
		`,
		// At the end of a line, the run closes a quote that the line opened.
		outdent`
			text: '''
			Say '''hi'''
			'''
		`,
		outdent`
			text: """
			say """hi""",
			"""
		`,
		outdent`
			script: '''
			greeting = '''hello''' + '''world'''
			'''
		`,
		// An escaped quote is not part of the run, so two quotes are left.
		outdent`
			text: """
			He said \\"""
			"""
		`,
		outdent`
			text: """
			He said \\\\\\"""
			"""
		`,
		// Two pairs on one line.
		outdent`
			text: '''
			Say '''a''' and '''b'''
			'''
		`,
		// A pair before a comma.
		outdent`
			text: '''
			Say '''hi''',
			'''
		`,
		// A pair with a longer run between, which opens no quote.
		outdent`
			text: '''
			Say '''x''''y'''
			'''
		`,
		// A longer delimiter lets a line end with three quotes.
		outdent`
			code: ''''
			x = '''
			''''
		`,
		// A longer run is content.
		outdent`
			text: '''
			x''''
			'''
		`,
		// The other quote character is content.
		outdent`
			text: '''
			x"""
			'''
		`,
		'text: "x\'\'\'"',
		// An escaped quote and a run as long as the delimiter, in a literal block, is a longer run.
		outdent`
			text: '''
			x\\''''
			'''
		`,
		// An escaped quote before a longer run.
		outdent`
			text: """
			x\\"""""
			"""
		`,
		// A closed quote before a comment.
		'text: \'\'\'\nSay \'\'\'hi\'\'\' # x\n\'\'\'',
		// Text after the run, so it is content.
		'text: \'\'\'\nSay \'\'\' to all\n\'\'\'',
		'text: """\nHe said \\""" # x\n"""',
		// The escaped quote leaves three quotes, which open a quote that the trailing run closes.
		'text: """\nSay \\"""" and """\n"""',
	],
	invalid: [
		outdent`
			motd: '''
			Welcome!'''
			port: 8080
			banner: '''
			Bye
			'''
		`,
		outdent`
			motd: """
			Welcome!"""
			port: 8080
			banner: """
			Bye
			"""
		`,
		outdent`
			server: {
				motd: '''
				Welcome!'''
				port: 8080
				banner: '''
				Bye
				'''
			}
		`,
		outdent`
			items: [
				'''
				one''',
				'''
			]
		`,
		outdent`
			[
				'''
				one'''
				'''
			]
		`,
		// The run closes no quote: the line opens and closes one before it.
		outdent`
			text: '''
			Say '''hi''' then'''
			port: 8080
			banner: '''
			Bye
			'''
		`,
		// A longer run before it opens no quote.
		outdent`
			text: '''
			x'''' y'''
			port: 8080
			banner: '''
			Bye
			'''
		`,
		// An escaped backslash does not escape the quote after it.
		outdent`
			motd: """
			C:\\\\"""
			port: 8080
			banner: """
			Bye
			"""
		`,
		// Two escaped backslashes, so the quote after them is not escaped.
		outdent`
			motd: """
			x\\\\\\\\"""
			port: 8080
			banner: """
			Bye
			"""
		`,
		// A backslash in a literal block escapes nothing.
		outdent`
			motd: '''
			Welcome!\\'''
			port: 8080
			banner: '''
			Bye
			'''
		`,
		// Whitespace after the run.
		'motd: \'\'\'\nWelcome!\'\'\' \t\nport: 8080\nbanner: \'\'\'\nBye\n\'\'\'',
		outdent`
			code: ''''
			x = ''''
			y
			''''
		`,
		// An escaped quote before the run is not part of it.
		outdent`
			motd: """
			He said "hi\\""""
			port: 8080
			banner: """
			Bye
			"""
		`,
		outdent`
			motd: """"
			x\\""""",
			port: 8080
			""""
		`,
		outdent`
			motd: """
			x\\\\\\""""
			port: 8080
			"""
		`,
		// A comment, a closing bracket, or both after the run, as after a closing delimiter.
		'motd: \'\'\'\nWelcome!\'\'\' # greeting\nport: 8080\nbanner: \'\'\'\nBye\n\'\'\'',
		'a: {m: \'\'\'\nHi\'\'\'}\nb: {n: \'\'\'\nx\n\'\'\'}',
		'a: ["""\nx"""]\nb: ["""\ny\n"""]',
		'motd: [\n\t\'\'\'\n\tWelcome!\'\'\', # c\n\tport\n\t\'\'\'\n]',
		'motd: \'\'\'\nWelcome!\'\'\' /* c */\nport: 8080\n\'\'\'',
		// On a later content line, so the location counts the lines before it.
		'motd: \'\'\'\nWelcome!\nto the server\nBye!\'\'\'\nport: 8080\nbanner: \'\'\'\nx\n\'\'\'',
		// The escaped quote leaves two quotes, so the trailing run closes nothing.
		'text: """\nHe said \\""" and """\n"""',
		'text: """\nHe said \\""" and """,\n"""',
		// The run after the escaped quote opens a quote that the next run closes, so the trailing run is unpaired.
		'text: """\nSay \\"""" and """ and """\n"""',
	],
});

nodeTest('Unicode separators inside a trailing comment do not hide a misplaced delimiter', () => {
	for (const separator of ['\u{2028}', '\u{2029}']) {
		for (const delimiter of ['\'\'\'', '"""']) {
			for (const tail of ['# before', '/* before']) {
				const code = `text: ${delimiter}\nHi${delimiter} ${tail}${separator}after\n${delimiter}`;
				const messages = lint(code, {'soml/no-misplaced-block-string-delimiters': 'error'});
				assert.equal(messages.length, 1);
				assert.equal(messages[0].messageId, 'no-misplaced-block-string-delimiters');
				assert.equal(messages[0].line, 2);
				assert.equal(messages[0].column, 3);
				assert.equal(messages[0].endColumn, 6);
			}
		}
	}
});
