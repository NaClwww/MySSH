#!/usr/bin/env node
import React, {useEffect } from 'react';
import {render} from 'ink';
import meow from 'meow';
import App from './app.js';

const cli = meow(
	`
		Usage
		  $ MySSH
	`,
	{
		importMeta: import.meta,
	},
);

process.stdout.write('\x1b[?1049h');
const {waitUntilExit} = render(<App />, {
	exitOnCtrlC: false // <--- 禁用默认的 Ctrl+C 退出行为
});
waitUntilExit().then(() => {
	process.stdout.write('\x1b[?1049l');
});