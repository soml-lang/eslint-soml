import {escapeInvisibleCharacters, getKeyWords} from './utils/index.js';

/**
@import {SomlContext} from './rule/soml-context.js';
@import {SomlRule} from './rule/to-eslint-rule.js';
*/

const MESSAGE_ID_ERROR = 'no-sizes-as-durations/error';
const MESSAGE_ID_SUGGESTION = 'no-sizes-as-durations/suggestion';
const messages = {
	[MESSAGE_ID_ERROR]: '`{{duration}}` is a duration, in which `m` is minutes, not a size for `{{key}}`. Write a size as a string.',
	[MESSAGE_ID_SUGGESTION]: 'Write it as `\'{{size}}\'`.',
};

/*
Words that name a size on their own, as in `memory`, `mem_limit`, `heapMax`, or `cpu` (Kubernetes writes CPU in thousandths, as in `500m`).
*/
const SIZE_WORDS = new Set(['cpu', 'cpus', 'heap', 'mem', 'memory', 'memswap', 'shm']);

/*
Words that name a size at the end of a longer key, as in `max-size` or `buffer_bytes`. Alone, `size` is too general.
*/
const SIZE_ENDINGS = new Set(['bytes', 'size']);

/*
Words that make a key about time, such as `window-size`, `cpu-time`, or `cache-expiry`. A plural, such as `intervals`, counts too. `block` and `chunk` are not, because a block size or a chunk size is in bytes, as in Hadoop, Spark, RocksDB, and Fluentd, and a block or chunk duration is named with `duration`.
*/
const TIME_WORDS = new Set([
	'age',
	'backoff',
	'bucket',
	'cooldown',
	'deadline',
	'delay',
	'duration',
	'expiration',
	'expiry',
	'frequency',
	'grace',
	'interval',
	'lifetime',
	'period',
	'poll',
	'refresh',
	'retention',
	'step',
	'time',
	'timeout',
	'ttl',
	'wait',
	'window',
]);

const isTimeWord = word => TIME_WORDS.has(word) || (word.endsWith('s') && TIME_WORDS.has(word.slice(0, -1)));

/*
Whether a duration is a number and `m`, the way a size is written, as in `512m` or `1.5m`. Any other duration, such as `30s` or `1h30m`, cannot be a size by mistake.
*/
const isSizeLike = ({negative, parts}) => !negative && parts.length === 1 && parts[0].unit === 'm';

function isSizeKey(key) {
	const words = getKeyWords(key);

	if (words.some(word => isTimeWord(word))) {
		return false;
	}

	return words.some(word => SIZE_WORDS.has(word)) || (words.length > 1 && SIZE_ENDINGS.has(words.at(-1)));
}

/**
@param {SomlContext} context
*/
const create = context => {
	context.on('Member', ({key, value}) => {
		if (value.type !== 'Duration' || !isSizeLike(value) || !isSizeKey(key.value)) {
			return;
		}

		const duration = context.sourceCode.getText(value);
		// An app that reads sizes does not allow `_`, as in `1_024m`.
		const size = duration.replaceAll('_', '');

		return {
			node: value,
			messageId: MESSAGE_ID_ERROR,
			data: {
				duration,
				key: escapeInvisibleCharacters(context.sourceCode.getText(key)),
			},
			suggest: [
				{
					messageId: MESSAGE_ID_SUGGESTION,
					data: {size},
					fix: fixer => fixer.replaceText(value, `'${size}'`),
				},
			],
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
			description: 'Disallow sizes that are durations, such as `memory: 512m`.',
			recommended: 'unopinionated',
		},
		hasSuggestions: true,
		messages,
		languages: ['soml/soml'],
	},
};

export default config;
