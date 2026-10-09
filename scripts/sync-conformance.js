#!/usr/bin/env node
/*
Copies the valid documents of the `soml-lang` conformance suite into `test/fixtures/conformance`, for the test that runs every rule on them. The suite is read from a checkout of the `soml` spec repository next to this one.

	npm run sync-conformance
*/
import fs from 'node:fs';
import path from 'node:path';

const source = path.join(import.meta.dirname, '../../soml/conformance/valid');

if (!fs.existsSync(source)) {
	throw new Error(`Expected the conformance suite at ${source}`);
}

const target = path.join(import.meta.dirname, '../test/fixtures/conformance');

fs.rmSync(target, {recursive: true, force: true});

const files = fs.readdirSync(source, {recursive: true})
	.filter(file => file.endsWith('.soml') && !file.endsWith('.canonical.soml') && !file.endsWith('.formatted.soml'));

for (const file of files) {
	fs.mkdirSync(path.dirname(path.join(target, file)), {recursive: true});
	fs.copyFileSync(path.join(source, file), path.join(target, file));
}

console.log(`Copied ${files.length} documents.`);
