import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import fs from 'node:fs';
import path from 'node:path';

const ChooseFile = ({ onSelect, onCancel }) => {
	const [currentPath, setCurrentPath] = useState(process.cwd());
	const [items, setItems] = useState([]);

	useEffect(() => {
		try {
			const files = fs.readdirSync(currentPath);
			const fileItems = files.map(file => {
				const fullPath = path.join(currentPath, file);
				let isDirectory = false;
				try {
					isDirectory = fs.statSync(fullPath).isDirectory();
				} catch (e) {
					// Ignore files we can't stat
				}
				return {
					label: file + (isDirectory ? '/' : ''),
					value: fullPath,
					isDirectory
				};
			});

			// Sort directories first
			fileItems.sort((a, b) => {
				if (a.isDirectory === b.isDirectory) {
					return a.label.localeCompare(b.label);
				}
				return a.isDirectory ? -1 : 1;
			});

			const navItems = [];
			const parentDir = path.dirname(currentPath);
			if (parentDir !== currentPath) {
				navItems.push({
					label: '..',
					value: parentDir,
					isDirectory: true
				});
			}

			setItems([...navItems, ...fileItems]);
		} catch (error) {
			setItems([{
				label: '.. (Error accessing directory)', 
				value: path.dirname(currentPath), 
				isDirectory: true
			}]);
		}
	}, [currentPath]);

	const handleSelect = (item) => {
		if (item.isDirectory) {
			setCurrentPath(item.value);
		} else {
			onSelect(item.value);
		}
	};

	useInput((input, key) => {
		if (key.escape && onCancel) {
			onCancel();
		}
	});

	return (
		<Box flexDirection="column" borderStyle="single" borderColor="cyan" padding={1}>
			<Text bold color="green">Select File</Text>
			<Text color="yellow">Current Path: {currentPath}</Text>
			<Box marginY={1}>
				<SelectInput items={items} onSelect={handleSelect} limit={10} />
			</Box>
			<Text color="gray">Press Enter to select/navigate, Esc to cancel</Text>
		</Box>
	);
};

export default ChooseFile;