import outdent from 'outdent';
import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		'\'logging.level\': \'debug\'',
		'logging: {level: \'debug\'}',
		// Only a sibling that is an object counts.
		'logging: \'info\'\n\'logging.level\': \'debug\'',
		'logging: [\'console\']\n\'logging.level\': 1',
		'logging: null\n\'logging.level\': 1',
		'logging: true\n\'logging.level\': 1',
		'logging: [{}]\n\'logging.level\': 1',
		'\'example.com\': 1\nexample: \'x\'',
		// Flat maps of names with `.`.
		'\'spark.executor.memory\': \'4g\'\n\'spark.executor.cores\': 2',
		'\'log4j.appender.A1\': \'x\'\n\'log4j.appender.A1.layout\': \'y\'',
		'dependencies: {\'socket.io\': \'^4\', socket: \'^1\'}',
		// A key whose value is an object is a name in a map of objects.
		outdent`
			loggers: {
				uvicorn: {handlers: ['default'], level: 'INFO'}
				'uvicorn.error': {level: 'INFO'}
				'uvicorn.access': {handlers: ['access'], level: 'INFO'}
			}
		`,
		'bastion: {user: \'admin\'}\n\'bastion.internal\': {user: \'root\'}',
		'a: {}\n\'a.b\': {}',
		// Only the part before the first `.` counts.
		'\'a.b\': {}\n\'a.b.c\': 1',
		// Keys are compared exactly.
		'logging: {}\n\'Logging.level\': 1',
		'logging: {}\n\'logging-level\': 1',
		'logging: {}\n\' logging.level\': 1',
		// A key that starts with `.` is a file name.
		'\'\': {}\n\'.eslintrc\': 1',
		// Keys in other objects.
		'a: {}\nb: {\'a.x\': 1}',
		'a: {\'a.x\': 1}',
		'[{a: {}}, {\'a.b\': 1}]',
		'a: {b: {}}\n\'b.c\': 1',
		// A bare key cannot have a `.`, and a value is not a key.
		'a: {}\nb: \'a.b\'',
		'a: {}\nb: [\'a.b\']',
	],
	invalid: [
		'logging: {format: \'json\'}\n\'logging.level\': \'debug\'',
		'\'logging.level\': \'debug\'\nlogging: {format: \'json\'}',
		'server: {}\n\'server.tls.enabled\': true',
		'logging: {}\n"logging.level": 1',
		'logging: {}\n' + String.raw`"logging\u{2e}level": 1`,
		'\'a\': {}\n\'a.b\': 1',
		'"a": {}\n\'a.b\': 1',
		'a: {}\n\'a.b\': 1\n\'a.c\': 2',
		'a: {}\nb: {}\n\'a.x\': 1\n\'b.y\': 2',
		'a: {}\n\'a.b\': 1\n\'a.b.c\': 2',
		'outer: {inner: {x: 1}, \'inner.y\': 2}',
		// Only a value that is an object is skipped.
		'a: {}\n\'a.b\': [{c: 1}]',
		'a: {}\n\'a.b\': null',
		'a: {}\n\'a.b\': \'\'\'\n\tx\n\t\'\'\'',
		'[{a: {}, \'a.b\': 1}]',
		'{a: {}, \'a.b\': 1}',
		'a: {} # object\n\'a.b\': 1 # key',
		'a: {}\n\'a.b\u{A0}c\': 1',
		'404: {}\n\'404.html\': \'x\'',
		outdent`
			server: {
				port: 8080
			}
			'server.host': 'localhost'
		`,
		outdent`
			database: {
				pool: {min: 2}
				'pool.max': 16
			}
		`,
	],
});
