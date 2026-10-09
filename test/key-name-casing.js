import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		'release-date: 1',
		'name: 1',
		'http2-port: 1',
		'404: 1',
		'logging: {sinks: {file: 1}}',
		'\'the name\': 1',
		'\'src/index.js\': 1',
		'a: \'camelCase\'',
		{
			code: 'releaseDate: 1',
			options: [{case: 'camelCase'}],
		},
		{
			code: 'release_date: 1',
			options: [{case: 'snake_case'}],
		},
		{
			code: 'ReleaseDate: 1',
			options: [{case: 'PascalCase'}],
		},
		{
			code: '_private: 1',
			options: [{ignore: ['^_']}],
		},
		{
			code: 'x-amz-date: 1\nX-Custom: 2',
			options: [{ignore: ['^X-']}],
		},
		// The patterns use the `v` flag, which needs a `-` in a class to be escaped.
		{
			code: 'X_Custom-Header: 1',
			options: [{ignore: [String.raw`^X[\w\-]+$`]}],
		},
		'[{name: 1}]',
		'a: 1 # camelCase',
		'\'fooBar\': 1',
	],
	invalid: [
		'releaseDate: 1',
		'release_date: 1',
		'_private: 1',
		'-foo: 1',
		'a--b: 1',
		'logging: {fileSink: 1}',
		'a: {B: 1}',
		{
			code: 'release-date: 1',
			options: [{case: 'camelCase'}],
		},
		{
			code: 'releaseDate: 1',
			options: [{case: 'PascalCase'}],
		},
		{
			code: 'release__date: 1',
			options: [{case: 'snake_case'}],
		},
		{
			code: '_private: 1\nfooBar: 2',
			options: [{ignore: ['^_']}],
		},
		'[{fooBar: 1}]',
	],
});
