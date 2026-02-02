import React from 'react';
import {Box, Text, useInput} from 'ink';
import pageStore from '../store.js';

export default function MainPage() {
	const mainCounter = pageStore((state) => state.mainCounter);
	
	useInput((input) => {
		// 页面级别的输入处理
		if (input === '+') {
			pageStore.setState({ mainCounter: mainCounter + 1 });
		}
		if (input === '-') {
			pageStore.setState({ mainCounter: mainCounter - 1 });
		}
		if (input === 'b') {
			pageStore.setState({ currentPage: 'banner' });
		}
	});

	return (
		<Box flexDirection='row' width="100%" height="100%" flex>
			<Box flexDirection="column" borderStyle="round" borderColor="blue" justifyContent="center" width="20vh" height="100%">
				{Array.from({ length: 10 }, (_, i) => (
					<Text key={i}>• Item {i + 1}</Text>
				))}
			</Box>
			<Box flexDirection='column' alignItems="center" justifyContent="flex-start" width="80vh" height="100%">
                <Box marginBottom={0} flexDirection='row' justifyContent="flex-start" width="100%" gap={0}>
                    {Array.from({ length: 4 }, (_, i) => (
                        <Box key={i} borderStyle="round" borderColor="yellow" marginRight={1}>
                            <Text>screen{i + 1}</Text>
                        </Box>
                    ))}
                </Box>
                <Box flexDirection="column" alignItems="center" justifyContent="center" flex={1} width="100%" height="100%" borderStyle="round" borderColor="cyan">
                    <Text color="green" bold>
                        Current Page: MAIN
                    </Text>
                    <Text>Counter: {mainCounter}</Text>
                </Box>
			</Box>
		</Box>
	);
}
