import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import {execFileSync} from 'node:child_process';
import {Buffer} from 'node:buffer';
import {pathToFileURL} from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
	renamableRules,
	replaceRuleId,
	replaceRuleIdInRulesIndex,
	sortReadmeRuleRows,
} from '../scripts/rename-rule.js';

test('replaceRuleId replaces only the whole rule name', () => {
	assert.equal(replaceRuleId('`no-foo` and soml/no-foo.', 'no-foo', 'no-bar'), '`no-bar` and soml/no-bar.');
	assert.equal(replaceRuleId('docs/rules/no-foo.md', 'no-foo', 'no-bar'), 'docs/rules/no-bar.md');

	// A longer name that contains it is another rule.
	assert.equal(replaceRuleId('no-foo-bar and x-no-foo and no-foo2', 'no-foo', 'no-baz'), 'no-foo-bar and x-no-foo and no-foo2');
});

test('replaceRuleIdInRulesIndex replaces the export of the rule', () => {
	const text = 'export {default as \'no-foo\'} from \'./no-foo.js\';\nexport {default as \'no-foo-bar\'} from \'./no-foo-bar.js\';\n';
	assert.equal(replaceRuleIdInRulesIndex(text, 'no-foo', 'no-qux'), 'export {default as \'no-qux\'} from \'./no-qux.js\';\nexport {default as \'no-foo-bar\'} from \'./no-foo-bar.js\';\n');

	// A name without `-` is a plain export name.
	assert.equal(replaceRuleIdInRulesIndex('export {default as \'no-foo\'} from \'./no-foo.js\';\n', 'no-foo', 'format'), 'export {default as format} from \'./format.js\';\n');
});

test('sortReadmeRuleRows moves the row of a renamed rule to its place', () => {
	const readme = [
		'| Name | Description |',
		'| [a-rule](docs/rules/a-rule.md) | A |',
		'| [z-renamed](docs/rules/z-renamed.md) | Z |',
		'| [m-rule](docs/rules/m-rule.md) | M |',
		'',
	].join('\n');

	assert.equal(sortReadmeRuleRows(readme, 'z-renamed'), [
		'| Name | Description |',
		'| [a-rule](docs/rules/a-rule.md) | A |',
		'| [m-rule](docs/rules/m-rule.md) | M |',
		'| [z-renamed](docs/rules/z-renamed.md) | Z |',
		'',
	].join('\n'));

	assert.equal(sortReadmeRuleRows(readme, 'missing'), readme);
});

test('only rules with `-` in their name can be renamed', () => {
	assert.ok(renamableRules.length > 0);
	assert.ok(renamableRules.every(ruleId => ruleId.includes('-')));
	assert.ok(!renamableRules.includes('format'));
});

test('renameRule preserves unrelated binary files', async () => {
	const temporaryDirectory = new URL('../.ai-temporary/', import.meta.url);
	fs.mkdirSync(temporaryDirectory, {recursive: true});
	using directory = fs.mkdtempDisposableSync(new URL('rename-rule-', temporaryDirectory));
	const projectDirectory = createRenameProject(directory.path);
	const binaryFiles = new Map([
		['scratch.png', Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), Buffer.from('no-foo')])],
		['scratch.bin', Buffer.from('\0no-foo')],
	]);
	for (const [name, bytes] of binaryFiles) {
		fs.writeFileSync(path.join(projectDirectory, name), bytes);
	}

	const {renameRule} = await import(pathToFileURL(path.join(projectDirectory, 'scripts/rename-rule.js')));
	await renameRule('no-foo', 'no-bar');
	for (const [name, bytes] of binaryFiles) {
		assert.deepEqual(fs.readFileSync(path.join(projectDirectory, name)), bytes, `${name} must stay unchanged.`);
	}

	assert.equal(fs.readFileSync(path.join(projectDirectory, 'readme.md'), 'utf8'), '`no-bar`');
});

test('renameRule updates test helpers and preserves copied conformance data', async () => {
	const temporaryDirectory = new URL('../.ai-temporary/', import.meta.url);
	fs.mkdirSync(temporaryDirectory, {recursive: true});
	using directory = fs.mkdtempDisposableSync(new URL('rename-rule-', temporaryDirectory));
	const projectDirectory = createRenameProject(directory.path);
	const helper = path.join(projectDirectory, 'test/utils/helper.js');
	const fixture = path.join(projectDirectory, 'test/fixtures/conformance/example.soml');
	for (const file of [helper, fixture]) {
		fs.mkdirSync(path.dirname(file), {recursive: true});
	}

	fs.writeFileSync(helper, 'export const ruleId = \'soml/no-foo\';');
	fs.writeFileSync(fixture, 'rule: \'no-foo\'');
	const {renameRule} = await import(pathToFileURL(path.join(projectDirectory, 'scripts/rename-rule.js')));
	await renameRule('no-foo', 'no-bar');

	assert.equal(fs.readFileSync(helper, 'utf8'), 'export const ruleId = \'soml/no-bar\';');
	assert.equal(fs.readFileSync(fixture, 'utf8'), 'rule: \'no-foo\'');
});

function createRenameProject(directory) {
	const projectDirectory = path.join(directory, 'project');
	fs.mkdirSync(projectDirectory);
	for (const name of ['scripts', 'rules']) {
		fs.mkdirSync(path.join(projectDirectory, name));
	}

	fs.copyFileSync(new URL('../scripts/rename-rule.js', import.meta.url), path.join(projectDirectory, 'scripts/rename-rule.js'));
	for (const [name, text] of [
		['package.json', '{"type":"module"}'],
		['index.js', 'export default {rules: {}};'],
		['rules/index.js', 'export {default as \'no-foo\'} from \'./no-foo.js\';'],
		['rules/no-foo.js', 'export default {};'],
		['readme.md', '`no-foo`'],
	]) {
		fs.writeFileSync(path.join(projectDirectory, name), text);
	}

	execFileSync('git', ['init', '--quiet'], {cwd: projectDirectory});
	return projectDirectory;
}

test('renameRule does not write through symbolic links', async () => {
	const temporaryDirectory = new URL('../.ai-temporary/', import.meta.url);
	fs.mkdirSync(temporaryDirectory, {recursive: true});
	using directory = fs.mkdtempDisposableSync(new URL('rename-rule-', temporaryDirectory));
	const projectDirectory = createRenameProject(directory.path);
	const externalFile = path.join(directory.path, 'external.txt');
	const original = 'External reference: no-foo\n| [z-rule](z.md) | Z |\n| [no-bar](no-bar.md) | B |\n| [a-rule](a.md) | A |';
	fs.writeFileSync(externalFile, original);
	fs.symlinkSync(externalFile, path.join(projectDirectory, 'linked.txt'));
	fs.symlinkSync('../external.txt', path.join(projectDirectory, 'relative-link.txt'));
	fs.renameSync(path.join(projectDirectory, 'readme.md'), path.join(projectDirectory, 'original-readme.md'));
	fs.symlinkSync(externalFile, path.join(projectDirectory, 'readme.md'));

	const {renameRule} = await import(pathToFileURL(path.join(projectDirectory, 'scripts/rename-rule.js')));
	await renameRule('no-foo', 'no-bar');

	assert.equal(fs.readFileSync(externalFile, 'utf8'), original);
	assert.equal(fs.readlinkSync(path.join(projectDirectory, 'linked.txt')), externalFile);
	assert.equal(fs.readFileSync(path.join(projectDirectory, 'original-readme.md'), 'utf8'), '`no-bar`');
});

test('renameRule treats Git paths as filenames rather than URL syntax', async () => {
	const temporaryDirectory = new URL('../.ai-temporary/', import.meta.url);
	fs.mkdirSync(temporaryDirectory, {recursive: true});
	using directory = fs.mkdtempDisposableSync(new URL('rename-rule-', temporaryDirectory));
	const projectDirectory = createRenameProject(directory.path);
	const names = ['notes#draft.txt', 'notes%20draft.txt', 'notes%ZZ.txt', 'notes%2fdraft.txt', 'notes with spaces.txt', 'résumé.txt'];
	// Windows does not allow question marks in filenames.
	if (process.platform !== 'win32') {
		names.push('notes?draft.txt');
	}

	for (const name of names) {
		fs.writeFileSync(path.join(projectDirectory, name), 'Reference: no-foo');
	}

	execFileSync('git', ['add', '--', names[0]], {cwd: projectDirectory});
	const {renameRule} = await import(pathToFileURL(path.join(projectDirectory, 'scripts/rename-rule.js')));
	await renameRule('no-foo', 'no-bar');

	for (const name of names) {
		assert.equal(fs.readFileSync(path.join(projectDirectory, name), 'utf8'), 'Reference: no-bar', name);
	}
});

test('renameRule sorts the renamed README row and skips submodule directories', async () => {
	const temporaryDirectory = new URL('../.ai-temporary/', import.meta.url);
	fs.mkdirSync(temporaryDirectory, {recursive: true});
	using directory = fs.mkdtempDisposableSync(new URL('rename-rule-', temporaryDirectory));
	const projectDirectory = createRenameProject(directory.path);
	const readmeFile = path.join(projectDirectory, 'readme.md');
	fs.writeFileSync(readmeFile, '| [a-rule](a.md) | A |\n| [no-foo](no-foo.md) | F |\n| [z-rule](z.md) | Z |\n');
	fs.mkdirSync(path.join(projectDirectory, 'vendor'));
	const submoduleFile = path.join(projectDirectory, 'vendor', 'reference.txt');
	fs.writeFileSync(submoduleFile, 'no-foo');
	// A Git submodule is listed as a directory, rather than its individual files.
	execFileSync('git', ['update-index', '--add', '--cacheinfo', `160000,${'1'.repeat(40)},vendor`], {cwd: projectDirectory});

	const {renameRule} = await import(pathToFileURL(path.join(projectDirectory, 'scripts/rename-rule.js')));
	await renameRule('no-foo', 'zz-new');

	assert.equal(fs.readFileSync(readmeFile, 'utf8'), '| [a-rule](a.md) | A |\n| [z-rule](z.md) | Z |\n| [zz-new](zz-new.md) | F |\n');
	assert.equal(fs.readFileSync(submoduleFile, 'utf8'), 'no-foo');
	assert.equal(fs.existsSync(path.join(projectDirectory, 'rules', 'zz-new.js')), true);
});
