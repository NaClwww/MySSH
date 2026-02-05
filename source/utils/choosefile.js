import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useStdout } from 'ink';
import SelectInput from 'ink-select-input';
import fs from 'node:fs';
import path from 'node:path';

const ChooseFile = ({ onSelect, onCancel,onUnSelect}) => {
	const { stdout } = useStdout();
	const [currentPath, setCurrentPath] = useState(process.cwd());
	const [items, setItems] = useState([]);
	const [limit, setLimit] = useState(10);

	// 监听窗口大小变化调整 limit
	useEffect(() => {
		const updateLimit = () => {
			// 减去头部(3行)、底部(1行)、边框padding(2行)的占用 = 约 6~7 行
			setLimit(Math.max(5, stdout.rows - 8));
		};
		
		updateLimit();
		stdout.on('resize', updateLimit);
		return () => stdout.off('resize', updateLimit);
	}, [stdout]);

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
				<SelectInput items={items} onSelect={handleSelect} limit={limit} />
			</Box>
			<Text color="gray">Press Enter to select/navigate, Esc to cancel</Text>
		</Box>
	);
};

const ChooseMultiFiles = ({ onSelect, onCancel }) => {
	const { stdout } = useStdout();
	const [currentPath, setCurrentPath] = useState(process.cwd());
	const [items, setItems] = useState([]);
	const [limit, setLimit] = useState(10);
	const [selectedPaths, setSelectedPaths] = useState(new Set());
	const [highlightedItem, setHighlightedItem] = useState(null);

	// Limit resize logic
	useEffect(() => {
		const updateLimit = () => {
			setLimit(Math.max(5, stdout.rows - 8));
		};
		updateLimit();
		stdout.on('resize', updateLimit);
		return () => stdout.off('resize', updateLimit);
	}, [stdout]);

	// Load items
	useEffect(() => {
		try {
			const files = fs.readdirSync(currentPath);
			const fileItems = files.map(file => {
				const fullPath = path.join(currentPath, file);
				let isDirectory = false;
				try {
					isDirectory = fs.statSync(fullPath).isDirectory();
				} catch (e) {}

				const isSelected = selectedPaths.has(fullPath);
				const prefix = isDirectory ? '' : (isSelected ? '[X] ' : '[ ] ');

				return {
					label: prefix + file + (isDirectory ? '/' : ''),
					value: fullPath,
					isDirectory,
					rawLabel: file // Keep raw label for identifying?
				};
			});

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
	}, [currentPath, selectedPaths]);

	const handleSelect = (item) => {
		if (item.isDirectory) {
			setCurrentPath(item.value);
		} else {
			// If we have selections, confirm all.
			// If not, treat Enter as "Select this and confirm"
			const finalSelection = new Set(selectedPaths);
			if (!finalSelection.has(item.value)) {
				finalSelection.add(item.value);
			}
			onSelect(Array.from(finalSelection));
		}
	};

	useInput((input, key) => {
		if (key.escape && onCancel) {
			onCancel();
		}
		// Space to toggle
		if (input === ' ' && highlightedItem && !highlightedItem.isDirectory) {
			const newSet = new Set(selectedPaths);
			if (newSet.has(highlightedItem.value)) {
				newSet.delete(highlightedItem.value);
			} else {
				newSet.add(highlightedItem.value);
			}
			setSelectedPaths(newSet);
		}
	});

	return (
		<Box flexDirection="column" borderStyle="single" borderColor="cyan" padding={1}>
			<Text bold color="green">Select Files (Multi)</Text>
			<Text color="yellow">Path: {currentPath}</Text>
			<Text color="blue">Selected: {selectedPaths.size}</Text>
			<Box marginY={1}>
				<SelectInput 
					items={items} 
					onSelect={handleSelect} 
					onHighlight={setHighlightedItem}
					limit={limit} 
				/>
			</Box>
			<Text color="gray">Enter: Confirm/Open | Space: Toggle | Esc: Cancel</Text>
		</Box>
	);
};

export default ChooseFile;