#!/usr/bin/env node
import fs, {promises as fsAsync} from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import {execFileSync} from 'node:child_process';
import {isUtf8} from 'node:buffer';
import {pathToFileURL} from 'node:url';
import enquirer from 'enquirer';
import soml from '../index.js';
import * as ruleModules from '../rules/index.js';

const sourceRuleIds = Object.keys(ruleModules);
const renamableRules = sourceRuleIds.filter(ruleId => ruleId.includes('-'));
const resolveFile = file => path.resolve(import.meta.dirname, '..', file);
const isValidRuleId = ruleId => typeof ruleId === 'string' && /^[a-z][\d\-a-z]*$/v.test(ruleId);

function checkFiles(ruleId) {
	const files = [
		`docs/rules/${ruleId}.md`,
		`rules/${ruleId}.js`,
		`test/${ruleId}.js`,
		`test/snapshots/${ruleId}.js.snapshot`,
	];

	for (const file of files) {
		if (fs.existsSync(resolveFile(file))) {
			throw new Error(`\`${file}\` already exists.`);
		}
	}
}

async function renameFile(source, target) {
	source = resolveFile(source);
	target = resolveFile(target);

	if (fs.existsSync(source)) {
		await fsAsync.rename(source, target);
	}
}

function sortReadmeRuleRows(text, ruleId) {
	const lines = text.split('\n');
	const rowIndex = lines.findIndex(line => line.startsWith(`| [${ruleId}](`));
	if (rowIndex === -1) {
		return text;
	}

	const rowPattern = /^\| \[(?<ruleId>[^\]]+)\]\(/v;
	const [row] = lines.splice(rowIndex, 1);
	const ruleRowIndexes = lines
		.map((line, index) => rowPattern.test(line) ? index : undefined)
		.filter(index => index !== undefined);

	let insertAt = lines.findIndex(line => {
		const match = line.match(rowPattern);
		return match && match.groups.ruleId > ruleId;
	});
	if (insertAt === -1) {
		insertAt = ruleRowIndexes.at(-1) + 1;
	}

	lines.splice(insertAt, 0, row);
	return lines.join('\n');
}

function replaceRuleIdInRulesIndex(text, from, to) {
	const fromExportName = from.includes('-') ? `'${from}'` : from;
	const toExportName = to.includes('-') ? `'${to}'` : to;
	const fromLine = `export {default as ${fromExportName}} from './${from}.js';`;
	const toLine = `export {default as ${toExportName}} from './${to}.js';`;
	return text.replace(fromLine, () => toLine);
}

function replaceRuleId(text, from, to) {
	const pattern = new RegExp(String.raw`(?<![\w\-])${from}(?![\w\-])`, 'gv');
	return text.replaceAll(pattern, () => to);
}

async function renameRule(from, to) {
	if (!sourceRuleIds.includes(from) || !isValidRuleId(to)) {
		throw new Error('Invalid rule name.');
	}

	if (!from.includes('-')) {
		throw new Error('Rules without hyphens must be renamed manually to avoid changing unrelated code.');
	}

	const renamedFiles = new Map([
		[`docs/rules/${from}.md`, `docs/rules/${to}.md`],
		[`rules/${from}.js`, `rules/${to}.js`],
		[`test/${from}.js`, `test/${to}.js`],
		[`test/snapshots/${from}.js.snapshot`, `test/snapshots/${to}.js.snapshot`],
	]);

	for (const [source, target] of renamedFiles) {
		// eslint-disable-next-line no-await-in-loop
		await renameFile(source, target);
	}

	// Every file that git tracks or would track, because a rule is named in other docs, tests, comments, and settings too, and a new rule may not be added yet. The conformance documents are copied from the specification, so they stay as they are.
	const files = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], {cwd: resolveFile(''), encoding: 'utf8'})
		.split('\0')
		.filter(file => file !== '' && !file.startsWith('test/fixtures/'))
		.map(file => renamedFiles.get(file) ?? file);

	for (const filePath of files) {
		const file = resolveFile(filePath);

		// Git can list symbolic links and submodules; only edit regular files in this checkout.
		if (!fs.lstatSync(file, {throwIfNoEntry: false})?.isFile()) {
			continue;
		}

		// eslint-disable-next-line no-await-in-loop
		const bytes = await fsAsync.readFile(file);
		if (bytes.includes(0) || !isUtf8(bytes)) {
			continue;
		}

		const text = bytes.toString('utf8');
		let updatedText = filePath === 'rules/index.js'
			? replaceRuleIdInRulesIndex(text, from, to)
			: replaceRuleId(text, from, to);
		if (filePath === 'readme.md') {
			updatedText = sortReadmeRuleRows(updatedText, to);
		}

		if (updatedText === text) {
			continue;
		}

		// eslint-disable-next-line no-await-in-loop
		await fsAsync.writeFile(file, updatedText);
	}
}

const run = async () => {
	const ruleSelector = new enquirer.AutoComplete({
		message: 'Select the rule you want to rename:',
		limit: 10,
		choices: renamableRules,
	});
	const originalRuleId = await ruleSelector.run();

	const ruleNamePrompt = new enquirer.Input({
		message: 'New name:',
		initial: originalRuleId,
		validate: ruleId => isValidRuleId(ruleId) || 'Invalid rule name.',
	});
	const ruleId = await ruleNamePrompt.run();

	if (!ruleId || originalRuleId === ruleId) {
		return;
	}

	if (Object.hasOwn(soml.rules, ruleId)) {
		console.log(`${ruleId} already exists.`);
		return;
	}

	checkFiles(ruleId);
	await renameRule(originalRuleId, ruleId);
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	await run();
}

// Exported for unit tests.
// eslint-disable-next-line unicorn/no-exports-in-scripts
export {
	renamableRules,
	renameRule,
	replaceRuleId,
	replaceRuleIdInRulesIndex,
	sortReadmeRuleRows,
};
