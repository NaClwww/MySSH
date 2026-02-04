import React from 'react';
import {Box, Text, useInput, useApp} from 'ink';
import pageStore from '../store.js';

export default function BannerPage() {
	const {exit} = useApp();

	useInput((input) => {
		if (input === 'q') {
			exit();
		} else {
			pageStore.setState({ currentPage: 'main' });
		}
	});

	return (
		<Box flexDirection="column" alignItems="center">
			<Text color="green" bold>
				Current Page: BANNER
			</Text>
			<Text>
				Welcome to the Banner Page!
			</Text>
			<Text dimColor>
				Press any key to continue...
			</Text>
		</Box>
	);
}
