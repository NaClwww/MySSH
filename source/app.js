import React, {useState, useEffect, useId} from 'react';
import {Text, Box, useApp, useInput} from 'ink'; // 引入 useApp
import MainPage from './pages/sshPage/main.js';
import BannerPage from './pages/banner.js';
import AddServerPage, { EditServerPage } from './pages/sshPage/edit_server.js';
import PageStore from './store.js';

const PAGE_MAP = {
	main: MainPage,
	banner: BannerPage,
	add_server: AddServerPage,
    edit_server: EditServerPage,
};

export default function App() {
	const {exit} = useApp(); // 获取退出函数
	const currentPage = PageStore((state) => state.currentPage);
	const [width, setWidth] = useState(process.stdout.columns || 80);
	const [height, setHeight] = useState(process.stdout.rows || 24);



	// 处理屏幕缓冲区和窗口大小
	useEffect(() => {

		const updateSize = () => {
			setWidth(process.stdout.columns || 80);
			setHeight(process.stdout.rows || 24);
		};

		process.stdout.on('resize', updateSize);
		
		// 2. 初始化 Store
		PageStore.getState().setCurrentPage('banner');

		return () => {
			// 3. 退出时必须执行：恢复主屏幕缓冲区
			process.stdout.off('resize', updateSize);
			process.stdout.write('\x1b[?1049l');
		};
	}, []);
	useInput((input, key) => {
		if (key.escape) {
			return;
		}
	});

	const CurrentPageComponent = PAGE_MAP[currentPage];

	return (
		<Box
			flexDirection="column"
			width={width}
			height={height}
		>
			{CurrentPageComponent && <CurrentPageComponent />}
		</Box>
	);
}