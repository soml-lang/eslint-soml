import {compareKeys} from 'soml-lang';
import {escapeInvisibleCharacters, isDisabledAnywhere, reorderMembers} from './utils/index.js';

/**
@import {SomlContext} from './rule/soml-context.js';
@import {SomlRule} from './rule/to-eslint-rule.js';
@import {MemberNode} from 'soml-lang';
*/

const MESSAGE_ID = 'sort-keys';
const messages = {
	[MESSAGE_ID]: 'Expected keys to be in {{sortName}} case-{{sensitivity}} {{direction}} order. `{{thisName}}` should be before `{{previousName}}`.',
};

const isDigit = character => character >= '0' && character <= '9';

/*
The end of the run of digits that starts at `index`.
*/
function getDigitsEnd(text, index) {
	while (index < text.length && isDigit(text[index])) {
		index++;
	}

	return index;
}

/*
Compares two keys by code point, as canonical form does, except that two runs of digits at the same place are compared by their value, so `a2` comes before `a10` and `a9` before `a010`. A value has any number of digits, so the runs are compared as text, without their leading zeros. When only the leading zeros differ, as in `a01` and `a1`, code point order decides, so two different keys are never equal.
*/
function compareNatural(first, second) {
	let firstIndex = 0;
	let secondIndex = 0;

	while (firstIndex < first.length && secondIndex < second.length) {
		if (isDigit(first[firstIndex]) && isDigit(second[secondIndex])) {
			const firstEnd = getDigitsEnd(first, firstIndex);
			const secondEnd = getDigitsEnd(second, secondIndex);
			const firstNumber = first.slice(firstIndex, firstEnd).replace(/^0+/v, '');
			const secondNumber = second.slice(secondIndex, secondEnd).replace(/^0+/v, '');

			if (firstNumber.length !== secondNumber.length) {
				return firstNumber.length - secondNumber.length;
			}

			if (firstNumber !== secondNumber) {
				return firstNumber < secondNumber ? -1 : 1;
			}

			firstIndex = firstEnd;
			secondIndex = secondEnd;
			continue;
		}

		const firstCodePoint = first.codePointAt(firstIndex);
		const secondCodePoint = second.codePointAt(secondIndex);

		if (firstCodePoint !== secondCodePoint) {
			return firstCodePoint - secondCodePoint;
		}

		// The two code points are equal, so a surrogate pair is followed by the same low surrogate in both.
		firstIndex++;
		secondIndex++;
	}

	// A key that ends first comes first, as `a` before `a1`.
	return (first.length - firstIndex) - (second.length - secondIndex) || compareKeys(first, second);
}

/**
@param {SomlContext} context
*/
const create = context => {
	const {sourceCode} = context;
	const [direction, {caseSensitive, natural, minKeys, allowLineSeparatedGroups}] = context.options;
	// Keys are in the order of canonical form, by code point. The `<` operator compares UTF-16 code units, which puts an emoji before U+FF61.
	const compare = natural ? compareNatural : compareKeys;
	const normalize = caseSensitive ? name => name : name => name.toLowerCase();
	const sign = direction === 'asc' ? 1 : -1;

	/*
	The lines that hold a comment, which are not blank even when they are empty inside a block comment. They are found once per file, when they are first needed.
	*/
	let commentLines;

	const getCommentLines = () => {
		commentLines ??= new Set(sourceCode.getAllComments().flatMap(comment => {
			const {start, end} = sourceCode.getLoc(comment);
			return Array.from({length: end.line - start.line + 1}, (_, index) => start.line + index);
		}));

		return commentLines;
	};

	// Whether the fix is allowed, found once per file, because the directives would be parsed again for every object.
	let isFixable;

	/**
	Whether a blank line separates two members. A line in a comment is not blank.

	@param {MemberNode} previous
	@param {MemberNode} member
	*/
	function isLineSeparated(previous, member) {
		const previousEndLine = sourceCode.getLoc(previous).end.line;
		const lines = sourceCode.lines.slice(previousEndLine, sourceCode.getLoc(member).start.line - 1);
		return lines.some((line, index) => line.trim() === '' && !getCommentLines().has(previousEndLine + index + 1));
	}

	context.on('Object', function * (node) {
		if (node.members.length < minKeys) {
			return;
		}

		/*
		The decoded keys, so `'a'` and `a` sort the same.
		*/
		const keys = new Map(node.members.map(member => [member, normalize(member.key.value)]));

		const compareMembers = (first, second) => sign * compare(keys.get(first), keys.get(second));

		// A blank line starts a group that is sorted on its own, when that is allowed.
		const groups = [];

		for (const [index, member] of node.members.entries()) {
			const previous = node.members[index - 1];

			if (previous === undefined || (allowLineSeparatedGroups && isLineSeparated(previous, member))) {
				groups.push([]);
			}

			groups.at(-1).push(member);
		}

		let isFirst = true;

		for (const group of groups) {
			for (const [index, member] of group.entries()) {
				const previous = group[index - 1];

				if (previous === undefined || compareMembers(previous, member) <= 0) {
					continue;
				}

				yield {
					node: member.key,
					messageId: MESSAGE_ID,
					data: {
						thisName: escapeInvisibleCharacters(sourceCode.getText(member.key)),
						previousName: escapeInvisibleCharacters(sourceCode.getText(previous.key)),
						direction: direction === 'asc' ? 'ascending' : 'descending',
						sensitivity: caseSensitive ? 'sensitive' : 'insensitive',
						sortName: natural ? 'natural' : 'code point',
					},
					// The fix sorts the whole object at once, so one run of `--fix` is enough, and only the first problem carries it. Giving every problem the same fix would build it once per problem.
					fix: isFirst && (isFixable ??= !isDisabledAnywhere(context)) ? reorderMembers(context, node.members, groups.flatMap(group => group.toSorted(compareMembers))) : undefined,
				};

				isFirst = false;
			}
		}
	});
};

/**
@type {SomlRule}
*/
const config = {
	create,
	meta: {
		type: 'suggestion',
		docs: {
			description: 'Require object keys to be sorted.',
			recommended: false,
		},
		fixable: 'code',
		schema: [
			{
				enum: ['asc', 'desc'],
				description: 'The sort direction.',
			},
			{
				type: 'object',
				additionalProperties: false,
				properties: {
					caseSensitive: {
						type: 'boolean',
						description: 'Whether uppercase and lowercase letters are sorted apart.',
					},
					natural: {
						type: 'boolean',
						description: 'Whether numbers in keys are sorted by their value, so `a2` comes before `a10`.',
					},
					minKeys: {
						type: 'integer',
						minimum: 2,
						description: 'The number of keys from which an object must be sorted.',
					},
					allowLineSeparatedGroups: {
						type: 'boolean',
						description: 'Whether a blank line starts a new group that is sorted on its own.',
					},
				},
			},
		],
		defaultOptions: [
			'asc',
			{
				caseSensitive: true,
				natural: false,
				minKeys: 2,
				allowLineSeparatedGroups: false,
			},
		],
		messages,
		languages: ['soml/soml'],
	},
};

export default config;
