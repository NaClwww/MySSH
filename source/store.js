import { create } from 'zustand';
import Conf from 'conf';

// 初始化配置存储 (projectName 用于确定存储路径)
const config = new Conf({ projectName: 'myssh' });

const PageStore = create((set, get) => ({
  currentPage: 'main',
  mainCounter: 0,
  // 从本地配置加载服务器列表，如果没有则为空数组
  servers: config.get('servers') || [],

  // 增加服务器
  addServer: (server) => {
    set((state) => {
        const newServers = [...state.servers, { ...server, id: Date.now() }];
        // 同步保存到本地文件
        config.set('servers', newServers);
        return { servers: newServers };
    });
  },
  
  // 编辑服务器
  updateServer: (id, updatedData) => {
    set((state) => {
        const newServers = state.servers.map(s => s.id === id ? { ...s, ...updatedData } : s);
        config.set('servers', newServers);
        return { servers: newServers };
    });
  },

  // 删除服务器 (顺便加上这个实用的功能)
  removeServer: (id) => {
    set((state) => {
        const newServers = state.servers.filter(s => s.id !== id);
        config.set('servers', newServers);
        return { servers: newServers };
    });
  },

  // 切换页面
  setCurrentPage: (page) => {
    set({ currentPage: page });
  },
  
  // 编辑中的 Server ID
  editingServerId: null,
  setEditingServerId: (id) => set({ editingServerId: id }),

  // === 会话状态管理 (内存中) ===
  sessions: [],
  activeSessionId: null,
  sessionMap: {},

  addSession: (session) => set((state) => ({ 
    sessions: [...state.sessions, { ...session, context: session.context || {} }],
    activeSessionId: session.id 
  })),

  updateSession: (id, data) => set((state) => ({
    sessions: state.sessions.map(s => s.id === id ? { ...s, ...data } : s)
  })),

  removeSession: (sessionId) => set((state) => {
    // 查找并清理资源
    const session = state.sessions.find(s => s.id === sessionId);
    if (session && session.context) {
        if (session.context.ssh) session.context.ssh.end();
        if (session.context.term) session.context.term.dispose();
    }
    return { 
        sessions: state.sessions.filter(s => s.id !== sessionId) 
    };
  }),

  setActiveSessionId: (id) => set({ activeSessionId: id }),
  
  closeAllSessions: () => set((state) => {
    state.sessions.forEach(session => {
        if (session && session.context) {
            if (session.context.ssh) session.context.ssh.end();
            if (session.context.term) session.context.term.dispose();
        }
    });
    return { sessions: [], activeSessionId: null };
  }),
}));

export default PageStore;