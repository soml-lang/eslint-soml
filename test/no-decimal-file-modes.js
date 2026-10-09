import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		'mode: 0o644',
		// The decimal value of `0o644`, as Kubernetes writes it.
		'defaultMode: 420',
		'mode: 493',
		// A screen mode, not a file mode.
		'mode: 720',
		'size: 644',
		'mode: \'644\'',
		'mode: 0x1A4',
		'mode: 64',
		'mode: 644.0',
		'modem: 644',
		'commode: 644',
		// A umask lists the permissions to remove, so it is not a mode.
		'umask: 755',
		'\'display.mode\': 1080',
		'\'a.modem\': 644',
		'MODEM: 644',
		'chmodSocket: 644',
		// The number has only two digits from 0 to 7, like `mode: 64`.
		'mode: 6_4',
		// The correct decimal form of `0o644`, with a separator.
		'defaultMode: 4_20',
		// Already octal, with a separator.
		'mode: 0o6_44',
	],
	invalid: [
		'mode: 644',
		'mode: 755',
		'mode: 777',
		'mode: 600',
		// Execute alone, when the owner can execute.
		'mode: 711',
		'mode: 1777',
		'mode: 6440',
		// The spec permits `_` between digits, so these are the same numbers.
		'mode: 6_44',
		'mode: 6_440',
		'chmod: 7_55',
		'file-mode: 640',
		'dir_mode: 750',
		'defaultMode: 400',
		'permissions: 644',
		'perms: 644',
		'chmod: 755',
		'files: {config: {mode: 644}}',
		'volumes: [{path: \'/etc/x\', mode: 600}]',
		// More than `0o7777`, so not a mode, even when the low digits look like one.
		'mode: 4600',
		'mode: 6644',
		'mode: 7744',
		// A quoted key with dots, as PHP-FPM and Hadoop write their settings.
		'\'listen.mode\': 660',
		'\'dfs.datanode.data.dir.perm\': 700',
		// Any casing, as Django and MongoDB write their settings.
		'FILE_UPLOAD_PERMISSIONS: 644',
		'net: {unixDomainSocket: {filePermissions: 700}}',
		'Mode: 644',
		'DirPerms: 750',
		'\'file mode\': 644',
		'\'php_admin_value[mode]\': 600',
	],
});
