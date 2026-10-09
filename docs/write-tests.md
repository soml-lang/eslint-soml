# Writing tests

Tests are in the `/test` directory.

A rule test file should look like this:

```js
import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		// Valid test cases go here
	],
	invalid: [
		// Invalid test cases go here
	],
});
```

The test harness parses every test case as SOML with this plugin's language. A test case must be a valid SOML document, because a parse error fails the test.

An autofix must keep the value of the document. The snapshot tester checks this for every autofix, by comparing the canonical form of the input and the output.

## `test.snapshot()`

This runs [`SnapshotRuleTester`](../test/utils/snapshot-rule-tester.js), which auto-generates the snapshot for test results, including error messages, error locations, autofix result, and suggestions. All you have to do is check the snapshot and make sure the results are expected before committing.

It's recommended to use this approach as it simplifies test writing.

```js
import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		'name: \'soml\'',
	],
	invalid: [
		'name: "soml"',
	],
});
```

## Focus on one rule

We use the [Node.js test runner](https://nodejs.org/api/test.html). To focus on a specific rule test, you can:

```console
node --test test/rule-name.js
```

To update snapshots in `test/snapshots/`, add [`--test-update-snapshots`](https://nodejs.org/api/cli.html#--test-update-snapshots):

```console
node --test --test-update-snapshots test/rule-name.js
```

## Focus on one test case

To focus on a single test case, you can:

```js
test.snapshot({
	valid: [],
	invalid: [
		// Wrap test case with `test.only`
		test.only({
			code: 'name: "soml"',
			options: [{checkFoo: true}],
		}),

		// Use `only: true`
		{
			code: 'name: "soml"',
			options: [{checkFoo: true}],
			only: true,
		},
	],
});
```

Then run the file with [`--test-only`](https://nodejs.org/api/cli.html#--test-only):

```console
node --test --test-only test/rule-name.js
```

**Please remove `test.only` and `only: true` before committing.**
