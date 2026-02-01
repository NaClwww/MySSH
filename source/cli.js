#!/usr/bin/env node
import React from 'react';
import {render} from 'ink';
import meow from 'meow';
import App from './app.js';

const cli = meow(
	`
		Usage
		  $ MySSH

		Options
			--name  Your name

		Examples
		  $ MySSH --name=Jane
		  Hello, Jane
	`,
	{
		importMeta: import.meta,
	},
);


render(<App name={cli.flags.name} />);
