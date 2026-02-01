import React, {useState, useEffect} from 'react';
import {Text, Box, useApp, useInput} from 'ink';

export default function App({name = 'Stranger'}) {
	const [input, setInput] = useState('');
	const [prev, setPrev] = useState('');
	const [width, setWidth] = useState(0);
	const [height, setHeight] = useState(0);
	const {exit} = useApp();
	
	// 开启备用屏幕缓冲区
	process.stdout.write('\x1b[?1049h');

	useEffect(() => {

		const updateSize = () => {
			setWidth(process.stdout.columns || 80);
			setHeight(process.stdout.rows || 24);
		};
		updateSize();
		// 监听窗口大小变化
		process.stdout.on('resize', updateSize);
		
		return () => {
			process.stdout.off('resize', updateSize);
			// 组件卸载时（退出程序时）恢复主屏幕缓冲区
			process.stdout.write('\x1b[?1049l');
		};
	}, []);

	useInput((inputStr, key) => {
		if (key.ctrl && inputStr === 'c') {
			exit();
		} else if (key.return) {
			setPrev(input);
			setInput('');
		} else {
			setInput(curr => curr + inputStr);
		}
	});

	return (
		<Box
			flexDirection="column"
			padding={1}
			borderStyle="round"
			borderColor="green"
			width={width}
			height={height}
			justifyContent="center"
		>
			<Text bold color="blue">Echo TUI</Text>
			<Box marginY={1}>
				<Text>Input: {input}</Text>
			</Box>
			<Box marginY={1}>
				<Text color="cyan">Output: {prev}</Text>
			</Box>
			<Text dimColor>(Press Ctrl+C to exit)</Text>
		</Box>
	);
}


