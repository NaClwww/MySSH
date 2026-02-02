import React, {useState, useEffect} from 'react';
import {Text, Box, useInput, useApp} from 'ink'; // 引入 useApp
import MainPage from './pages/main.js';
import BannerPage from './pages/banner.js';
import PageStore from './store.js';

const PAGE_MAP = {
	main: MainPage,
	banner: BannerPage,

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
		if (input === 'q') { 
			exit(); 
		}
		if (key.tab) {
			const pages = Object.keys(PAGE_MAP);
			const currentIndex = pages.indexOf(PageStore.getState().currentPage);
			const nextIndex = (currentIndex + 1) % pages.length;
			PageStore.setState({ currentPage: pages[nextIndex] });
		}
	});

	const CurrentPageComponent = PAGE_MAP[currentPage];

	return (
		<Box
			flexDirection="column"
			borderStyle="round"
			borderColor="green"
			width={width}
			height={height}
			justifyContent="center"
			alignItems="center"
		>
			{CurrentPageComponent && <CurrentPageComponent />}
		</Box>
	);
}