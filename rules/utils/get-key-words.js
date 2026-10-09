/**
The words of a key, in lowercase: `maxHeapSize`, `max-heap-size`, and `max_heap_size` all give `max`, `heap`, and `size`. An acronym is a word too, so `maxRAMSize` gives `max`, `ram`, and `size`. A word after an acronym has at least two lowercase letters, so a plural acronym, as in `maxCPUs`, stays one word. Every character that is not a letter or a digit separates words, so a quoted key works too, as in `'spark.executor.memory'` (Spark) or `'php_admin_value[memory_limit]'` (PHP-FPM). A separator at an end or next to another one makes no empty word, so `_size` is one word.

@param {string} key
@returns {string[]}
*/
export default function getKeyWords(key) {
	return key.split(/[^\p{Letter}\p{Number}]|(?<=[\da-z])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z]{2})/v)
		.filter(word => word !== '')
		.map(word => word.toLowerCase());
}
