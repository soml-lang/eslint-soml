import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		'memory: \'512m\'',
		'memory: 536870912',
		'cpu: 0.5',
		'timeout: 5m',
		// A time word makes the key about time.
		'window-size: 5m',
		'cache-ttl: 5m',
		'cpu-time: 10m',
		'heapDumpInterval: 1h',
		'chunk-size: 2h',
		'memory-cache-expiry: 5m',
		'memory-cache-lifetime: 30m',
		'cpu-stats-retention: 30m',
		'heap-dump-frequency: 10m',
		'memory_killer_shutdown_wait: 1m',
		'memoryBackoff: 1m',
		'cpu-cooldown: 5m',
		'heap-grace-period: 1m',
		'memory-refresh: 5m',
		'cpu-poll: 1m',
		'cpu-deadline: 10m',
		// A plural is a time word too.
		'memory-timeouts: 5m',
		'memoryCheckIntervals: 1m',
		'heap-dump-ttls: 5m',
		'\'spark.network.timeout\': 2m',
		'\'spark.memory.timeout\': 5m',
		'\'memory.backoff\': 5m',
		// `size` alone is too general.
		'size: 5m',
		// Only the key of the duration names it.
		'memory: {timeout: 5m}',
		'mem: [5m]',
		'memoryless: 5m',
		'conf: {\'spark.executor.memory.timeout\': 5m}',
		'conf: {\'spark.memory.window-size\': 5m}',
		// Only `m` comes from a size, so another unit is meant as a time.
		'heap-size: 30s',
		'cpu-profile: 1h30m',
		'memory-check: 500ms',
		// A size has no sign.
		'memory: -512m',
		// A leading or doubled separator does not make a second word.
		'_size: 5m',
		'-size: 5m',
		'\'.size\': 5m',
		'__size: 5m',
		'maxRAMTimeout: 5m',
		'\'storage.tsdb.max-block-duration\': 5m',
		'\'memory[timeout]\': 5m',
	],
	invalid: [
		'memory: 512m',
		'resources: {limits: {memory: 1m, cpu: 1m}}',
		'mem_limit: 512m',
		'shm_size: 64m',
		'maxHeapSize: 2m',
		'max-size: 10m',
		'log: {max_bytes: 1m}',
		'\'memory\': 512m',
		'memory: 512m # Comment',
		'heap: 1.5m',
		'memory: 1_024m',
		// A quoted key with dots, as Spark and Flink write their settings, is one key of several words.
		'sparkConf: {\'spark.executor.memory\': 512m}',
		'flink: {\'taskmanager.memory.process.size\': 1728m}',
		'\'spark.executor.memoryOverhead\': 384m',
		'\'spark.executor.cpus\': 1m',
		'"docker.shm-size": 64m',
		// Only the key of the duration counts, and its words.
		'timeout: {\'spark.executor.memory\': 512m}',
		'max__size: 5m',
		'_max_size: 5m',
		// An acronym is a word of its own.
		'maxRAMSize: 5m',
		'JVMHeapSize: 5m',
		'SHMSize: 64m',
		// A block size is in bytes, as in Spark, Hadoop, and RocksDB.
		'\'spark.broadcast.blockSize\': 4m',
		'\'fs.s3a.block.size\': 32m',
		'\'state.backend.rocksdb.block.cache-size\': 8m',
		// Any character that is not a letter or a digit separates words.
		'\'php_admin_value[memory_limit]\': 256m',
		'\'max memory\': 512m',
		'\'limits/memory\': 1m',
		// A chunk size is in bytes, as in Fluentd and Fluent Bit.
		'buffer: {chunk_limit_size: 8m}',
		'Buffer_Chunk_Size: 1m',
		// A plural acronym is one word.
		'maxCPUs: 500m',
		'CPUs: 1m',
		// A raw bidirectional control in a key is escaped in the message.
		'\'cpu\u{202E}\': 512m',
	],
});
