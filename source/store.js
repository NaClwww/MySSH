import { create } from 'zustand'

const PageStore = create((set, get) => ({
  currentPage: 'main',
  mainCounter: 0,
  
  // 切换页面
  setCurrentPage: (page) => {
    set({ currentPage: page });
  },
  
  // 更新计数器
  setMainCounter: (counter) => {
    set({ mainCounter: counter });
  },
  
}));

export default PageStore