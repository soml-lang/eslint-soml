import {escapeInvisibleCharacters} from './utils/index.js';

/**
@import {SomlContext} from './rule/soml-context.js';
@import {SomlRule} from './rule/to-eslint-rule.js';
*/

const MESSAGE_ID = 'no-placeholder-values';
const messages = {
	[MESSAGE_ID]: '`{{value}}` looks like a placeholder. Set the real value, or leave the member out.',
};

/*
Words that a placeholder uses to label itself, as a whole token, so that `replacements` does not match: `changeme`, `CHANGE_ME`, `replace-me`, and `your_api_key_here`. Digits may follow, as in `ChangeMe123!`, because a password policy often asks for them. The words are joined by `-` or `_`, not a space, so that prose such as "Set your password here" does not match. The part between `your` and `here` is limited, so a long string cannot make the search slow.
*/
const PLACEHOLDER_WORDS = /(?:^|[^\da-z])(?:(?:change|replace)[\-_]?me|your[\-_][\w\-]{0,40}?[\-_]here)(?:$|[^a-z])/iv;

/*
A whole value that marks missing work. In uppercase only, because `Todo` is also a word.
*/
const MARKER = /^(?:FIXME|TBD|TODO)$/v;

/**
@param {SomlContext} context
*/
const create = context => {
	/*
	Whether each array is a list of markers, found once per array.
	*/
	const markerLists = new WeakMap();

	/*
	Whether an array holds two different markers, as a linter's list of comment tags does, such as `['TODO', 'FIXME']`. Then the markers are data, not placeholders.
	*/
	const isMarkerList = array => {
		if (!markerLists.has(array)) {
			const markers = new Set(array.elements.filter(element => element.type === 'String' && MARKER.test(element.value)).map(element => element.value));
			markerLists.set(array, markers.size > 1);
		}

		return markerLists.get(array);
	};

	context.on('String', (node, parent) => {
		const {value} = node;
		const isMarker = MARKER.test(value);

		if (!isMarker && !PLACEHOLDER_WORDS.test(value)) {
			return;
		}

		if (isMarker && parent.type === 'Array' && isMarkerList(parent)) {
			return;
		}

		return {
			node,
			messageId: MESSAGE_ID,
			// A placeholder word never spans lines, so the message shows only its line of a block string. A marker counts only as the whole value, so a `TODO` line is not that line.
			data: {value: escapeInvisibleCharacters(isMarker ? value : value.split('\n').find(line => PLACEHOLDER_WORDS.test(line)))},
		};
	});
};

/**
@type {SomlRule}
*/
const config = {
	create,
	meta: {
		type: 'problem',
		docs: {
			description: 'Disallow placeholder values, such as `\'changeme\'`.',
			recommended: true,
		},
		messages,
		languages: ['soml/soml'],
	},
};

export default config;
