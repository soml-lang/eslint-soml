import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		String.raw`dir: 'C:\new\temp'`,
		String.raw`dir: "C:\\new\\temp"`,
		String.raw`text: "line one\nline two"`,
		String.raw`text: "a:\nb"`,
		String.raw`url: "https://example.com\n"`,
		String.raw`dir: "C:\\Users\\sindre"`,
		String.raw`'C:\new': 1`,
		// A lowercase letter before a colon is more likely text than a drive.
		String.raw`text: "Step A:\nDo it"`,
		String.raw`command: "cd C:\new && run"`,
		String.raw`dir: "c:\tools"`,
		// A `\n` or `\t` that no name follows is more likely meant.
		String.raw`dir: "C:\n\u{9}"`,
		String.raw`dir: "C:\\x\t\u{a0}"`,
	],
	invalid: [
		String.raw`dir: "C:\new\temp"`,
		String.raw`dir: "D:\\Users\temp"`,
		String.raw`dir: "C:\new\\don't"`,
		String.raw`dir: "C:\new\u{a0}x"`,
		String.raw`dirs: ["C:\temp", "C:\\ok"]`,
		// A name can start with any letter.
		String.raw`dir: "C:\nøkler"`,
		String.raw`dir: "C:\new\tâches"`,
		// No suggestion, because the path also holds a real tab.
		'dir: "C:\\new\tx"',
		// No suggestion, because the `\n` at the end is more likely meant.
		String.raw`dir: "C:\new\n"`,
		// Other escapes retain their decoded value when a short escape becomes a path separator.
		String.raw`dir: "C:\new\u{1f600}\u{27}\"\\temp"`,
	],
});
