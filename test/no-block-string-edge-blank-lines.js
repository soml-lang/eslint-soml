import outdent from 'outdent';
import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		outdent`
			text: '''
				one

				two
				'''
		`,
		outdent`
			text: """
				one\\n
				"""
		`,
		'text: \'\'\'\n\'\'\'',
		'text: \'one\'',
	],
	invalid: [
		outdent`
			text: '''

				one
				'''
		`,
		outdent`
			cert: '''
				one

				'''
		`,
		outdent`
			text: """

				one

				"""
		`,
		outdent`
			text: '''

				one
				''' # Comment
		`,
		outdent`
			[
				'''
				one

				''',
				2
			]
		`,
		// Lines of only spaces and tabs are blank too.
		'text: \'\'\'\n\t\t\n\tone\n  \n\t\'\'\'',
		'text: \'\'\'\n\n\n\'\'\'',
		outdent`
			items: [
				''''

				one
				'''

				'''',
			]
		`,
	],
});
