import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		'secret: \'k3J9xQ\'',
		'note: \'replacements are allowed\'',
		'title: \'Todo\'',
		'title: \'Todo list\'',
		'note: \'yourself here\'',
		'a: \'exchange messages\'',
		'changeme: 1',
		'a: \'TODO later\'',
		// Prose is not a placeholder.
		'help: \'Set your password here\'',
		'help: \'You can change me later\'',
		// A marker is a placeholder only as the whole value.
		'note: \'\'\'\n\tTODO\n\tWrite the docs.\n\t\'\'\'',
		String.raw`note: "TODO\n"`,
		// A list of markers, as for a linter, holds them as data.
		'notes: [\'FIXME\', \'XXX\', \'TODO\']',
		'no-warning-comments: [\'warn\', {terms: [\'TODO\', \'FIXME\']}]',
		'a: \'changemeal\'',
		'a: \'replacement2\'',
	],
	invalid: [
		'secret-key: \'CHANGE_ME_TO_A_COMPLEX_RANDOM_SECRET\'',
		'password: \'changeme\'',
		'url: \'postgres://app:changeme@db/app\'',
		'token: \'REPLACE-ME\'',
		'key: \'your_api_key_here\'',
		'key: \'<your-token-here>\'',
		'owner: \'TODO\'',
		'owner: "FIXME"',
		'hosts: [\'TBD\']',
		'note: \'\'\'\n\tSet this to changeme.\n\t\'\'\'',
		// The message shows only the line with the placeholder.
		'note: \'\'\'\n\tThe key.\n\tYOUR_KEY_HERE\n\tMore text.\n\t\'\'\'',
		// A `TODO` line is not a placeholder on its own, because a marker is only one when it is the whole value.
		'note: \'\'\'\n\tTODO\n\tSet the key to changeme.\n\t\'\'\'',
		String.raw`note: "TODO\nSet the key to changeme."`,
		// A block string of only a marker.
		'owner: \'\'\'\n\tTODO\n\t\'\'\'',
		// The first line with a placeholder word.
		'note: \'\'\'\n\tFIXME\n\tSet it to changeme.\n\tOr to your_key_here.\n\t\'\'\'',
		// An escaped control or bidirectional character stays escaped in the message, so it cannot change the terminal or reorder the text.
		String.raw`a: "changeme\u{1b}[2J\u{202e}x"`,
		// One marker in a list is still a placeholder.
		'hosts: [\'db1\', \'TODO\']',
		'a: [\'TODO\', \'TODO\']',
		'a: [[\'TODO\'], \'FIXME\']',
		// Digits after the word, as a password policy asks for.
		'password: \'ChangeMe123!\'',
		'password: \'changeme1\'',
		'key: \'your_key_here2\'',
	],
});
