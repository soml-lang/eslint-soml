import outdent from 'outdent';
import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		'a: 1\n',
		outdent`
			# Comment

			name: 'soml'
			pool: {
				min: 2
				max: 16
			}
			labels: [
				'prod' # The default
				'eu'
			]
			empty: []
			'logging.level': 'info'
		` + '\n',
		outdent`
			[
				1
				2
			]
		` + '\n',
		outdent`
			a: {
				b:
					'''
					text
					'''
			}
		` + '\n',
		outdent`
			a: [
				'''
				text
				'''
			]
		` + '\n',
		outdent`
			a: # Note
				'''
				text
				'''
		` + '\n',
		'{}\n',
		'pool: {min: 2, max: 16}\n',
		'a: [1, /* note */ 2]\n',
		'matrix: [\n\t[1, 0]\n\t[0, 1]\n]\n',
	],
	invalid: [
		'a:1',
		'a: [1,\n2]',
		'a: {b: 1,c: 2}',
		'a: 1   ',
		'a: 1\n\n\n\nb: 2',
		'\n\na: 1',
		'a: 1\n\n',
		'a: [\n  1,\n  2\n]',
		// Commas go, also between items that a line break already separates.
		'a: [\n\t1,\n\t2,\n]',
		'a: [\n\t1\n\t2,\n]',
		'a: [1, /* note */ 2\n]',
		'{\na: 1}',
		'a:\n\t1',
		outdent`
			a: {
			    b: '''
			        text
			          more
			        ''',
			}
		`,
		outdent`
			a: [
				'''
				text
				''',
			]
		`,
		// An opening delimiter on the key's line moves to the next line.
		outdent`
			a: '''
				text
				'''
		` + '\n',
		// A container on one line stays on one line, without a trailing comma.
		'a: [1,   2,]',
		'a: [ /* note */ ]',
	],
});
