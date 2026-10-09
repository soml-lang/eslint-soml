import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		'retry-after: 1\nretry-before: 2',
		'a: {name: 1}\nb: {Name: 2}',
		'[{name: 1}, {Name: 2}]',
		'a: \'Name\'\nb: \'name\'',
		'a: 1\n\'a.b\': 2',
		'a: {x: 1}\nb: {X: 2}',
		'\'log.level\': 1\nloglevel: 2',
		'\'a.b\': 1\n\'a..b\': 2',
		'\'a.b\': 1\n\'a b\': 2',
		'\'a.b\': 1\n\'a/b\': 2',
		'a: {}\n\'a.b\': 1',
		// `ß` uppercases to two letters, so it is not case-equal to `ss`.
		'\'ß\': 1\nss: 2',
	],
	invalid: [
		'retry-after: 1\nretry_after: 2',
		'Name: 1\nname: 2',
		'\'name \': 1\nname: 2',
		'\' name\': 1\nname: 2',
		'retryAfter: 1\nRETRYAFTER: 2',
		'\'σ\': 1\n\'ς\': 2',
		'\'ΑΣ\': 1\n\'ασ\': 2',
		'\'s\': 1\n\'ſ\': 2',
		'\'i\': 1\n\'ı\': 2',
		'\'µ\': 1\n\'μ\': 2',
		'\'θ\': 1\n\'ϑ\': 2',
		// A raw bidirectional control in a key is escaped in the message.
		'\'\u{202E}A\': 1\n\'\u{202E}a\': 2',
		'a: {Content-Type: 1, content-type: 2}',
		'[{a: 1, A: 2}]',
		'x-id: 1\nX_ID: 2\nx_Id: 3',
		'\'a\u{0085}\': 1\na: 2',
		'a: {x: 1}\nA: {y: 2}',
		'"a": 1\nA: 2',
		'\'a.foo-bar\': 1\n\'A.foo_bar\': 2',
		// Programs that read settings from environment variables treat `.` as `_`.
		'\'log.level\': 1\nlog-level: 2',
		'\'log.level\': 1\nLOG_LEVEL: 2',
		'\'a.b\': 1\na_b: 2',
		'\'spring.datasource.url\': \'x\'\nSPRING_DATASOURCE_URL: \'y\'',
		String.raw`"a\u{2e}b": 1` + '\na-b: 2',
	],
});
