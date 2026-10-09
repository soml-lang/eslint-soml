import path from 'node:path';
import url from 'node:url';
import assert from 'node:assert/strict';
import test, {snapshot} from 'node:test';
import plugin from '../../index.js';
import SnapshotRuleTester, {getVerifyConfig, verify} from './snapshot-rule-tester.js';

// Store the formatted snapshot strings as they are, in `test/snapshots/`.
snapshot.setDefaultSnapshotSerializers([value => value]);
snapshot.setResolveSnapshotPath(testFile => path.join(path.dirname(testFile), 'snapshots', `${path.basename(testFile)}.snapshot`));

const normalizeTestCase = testCase => typeof testCase === 'string' ? {code: testCase} : testCase;

function assertNoManualEmptyFileTestCases(ruleId, testCases) {
	if (testCases.some(({code}) => code === '')) {
		throw new Error(`Do not add empty file test cases for \`${ruleId}\`. An empty file is not a SOML document, so it is a parse error.`);
	}
}

// https://github.com/tc39/proposal-array-is-template-object
const isTemplateObject = value => Array.isArray(value?.raw);
// https://github.com/tc39/proposal-string-cooked
const cooked = (raw, ...substitutions) => String.raw({raw}, ...substitutions);

/*
Supported forms:

```js
only`code`;
only('code');
only({code: 'code'});
```
*/
function only(...arguments_) {
	if (isTemplateObject(arguments_[0])) {
		return {code: cooked(...arguments_), only: true};
	}

	return {...normalizeTestCase(arguments_[0]), only: true};
}

/*
The smallest documents should be a no-op for every rule.
*/
function runEmptyCollectionsTest(ruleId, rule) {
	test(`empty collections: ${ruleId}`, () => {
		for (const code of ['{}\n', '[]\n']) {
			assert.deepEqual(verify(code, getVerifyConfig(ruleId, rule, {})), []);
		}
	});
}

function getTester(importMeta, ruleId = path.basename(url.fileURLToPath(importMeta.url), '.js')) {
	const rule = plugin.rules[ruleId];
	runEmptyCollectionsTest(ruleId, rule);

	const snapshotTest = ({valid, invalid}) => {
		valid = valid.map(testCase => normalizeTestCase(testCase));
		invalid = invalid.map(testCase => normalizeTestCase(testCase));
		assertNoManualEmptyFileTestCases(ruleId, [...valid, ...invalid]);
		new SnapshotRuleTester(test).run(ruleId, rule, {valid, invalid});
	};

	return {
		ruleId,
		rule,
		test: {snapshot: snapshotTest, only},
	};
}

export {getTester};
