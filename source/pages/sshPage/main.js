import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import PageStore from '../../store.js';
import SSHSession from '../../utils/ssh.js';

export default function MainPage() {
    const { exit } = useApp();
    const [activeZone, setActiveZone] = useState('sidebar'); // 'sidebar' | 'content'
    
    // 记录 Sidebar 当前选中到了第几个
    const [sidebarIndex, setSidebarIndex] = useState(0);
    
    // 多会话管理 (Moved to Store)
    const sessions = PageStore((state) => state.sessions);
    const activeSessionId = PageStore((state) => state.activeSessionId);
    const addSession = PageStore((state) => state.addSession);
    const removeSession = PageStore((state) => state.removeSession);
    const setActiveSessionId = PageStore((state) => state.setActiveSessionId);
    const closeAllSessions = PageStore((state) => state.closeAllSessions);

    const servers = PageStore((state) => state.servers);
    const setCurrentPage = PageStore((state) => state.setCurrentPage);
    const removeServer = PageStore((state) => state.removeServer);
    const setEditingServerId = PageStore((state) => state.setEditingServerId);
    const sidebarCount = servers.length + 1; 

    // Helper: 关闭指定 Session
    const closeSession = (sessionId) => {
        const isClosingActive = (activeSessionId === sessionId);
        const currentIndex = sessions.findIndex(s => s.id === sessionId);
        
        removeSession(sessionId);

        if (isClosingActive) {
            const newSessions = sessions.filter(s => s.id !== sessionId);
            if (newSessions.length > 0) {
                 // 尝试切到前一个
                 const nextIndex = Math.max(0, currentIndex - 1);
                 const nextSession = newSessions[nextIndex];
                 setActiveSessionId(nextSession.id);
            } else {
                 // 没标签了，回首页
                 setActiveSessionId(null);
                 setActiveZone('sidebar');
            }
        }
    };

    useInput((input, key) => {
        // ===========================
        // 区域 1: 左侧 Sidebar 逻辑
        // ===========================
        if (activeZone === 'sidebar') {
            // 允许退出应用 (Ctrl+C 或 q)
            if ((key.ctrl && input === 'c') || input === 'q' || input === 'Q' || key.escape) {
                closeAllSessions();
                exit();
                return;
            }

            if (key.ctrl && key.rightArrow){
                if (sessions.length > 0) {
                    setActiveZone('content');
                }
                return;
            }

            // 处理删除操作 (Index 0 是 Add按钮，不能删)
            if ((key.delete || key.backspace) && sidebarIndex > 0) {
                const s = servers[sidebarIndex - 1];
                if (s) {
                    removeServer(s.id);
                    // 删完后向上移动
                    const newIndex = Math.max(0, sidebarIndex - 1);
                    setSidebarIndex(newIndex);
                }
                return;
            }

            if (key.rightArrow || key.return) {
                // Index 0 是 "Add Server"
                if (sidebarIndex === 0) {
                    setCurrentPage('add_server');
                    return;
                }
                
                // --- 创建新会话 ---
                // Index 1 对应 servers[0]
                const targetServer = servers[sidebarIndex - 1];
                if (targetServer) {
                    const newSessionId = Date.now();
                    const newSession = { 
                        id: newSessionId, 
                        server: targetServer, 
                        name: targetServer.name 
                    };
                    
                    addSession(newSession);
                    
                    setActiveZone('content');
                }
                return;
            }

            // Edit Server (e)
            if ((input === 'e' || input === 'E') && sidebarIndex > 0) {
                const s = servers[sidebarIndex - 1];
                if (s) {
                    setEditingServerId(s.id);
                    setCurrentPage('edit_server');
                }
                return;
            }

            if (key.downArrow) {
                const nextIndex = Math.min(sidebarIndex + 1, sidebarCount - 1);
                setSidebarIndex(nextIndex);
            }
            if (key.upArrow) {
                const prevIndex = Math.max(sidebarIndex - 1, 0);
                setSidebarIndex(prevIndex);
            }
        }

        // ===========================
        // 区域 2: 右侧 Content 逻辑
        // ===========================
        if (activeZone === 'content') {
            // 返回列表: 使用 Ctrl+Q，避免占用 SSH 的 Esc
            if ((key.ctrl && input === 'q')) {
                setActiveZone('sidebar');
                return;
            }
            
            // --- Tab 切换 ---
            if (sessions.length > 1) {
                // 查找当前 index
                const currentIndex = sessions.findIndex(s => s.id === activeSessionId);
                
                if (key.ctrl && key.rightArrow) {
                     const nextIndex = (currentIndex + 1) % sessions.length;
                     const nextId = sessions[nextIndex].id;
                     setActiveSessionId(nextId);
                     return;
                }
                if (key.ctrl && key.leftArrow) {
                     const prevIndex = (currentIndex - 1 + sessions.length) % sessions.length;
                     const prevId = sessions[prevIndex].id;
                     setActiveSessionId(prevId);
                     return;
                }
            }
            
            // 如果所有的 Session 都关了
            if (sessions.length === 0 && activeZone === 'content') {
                 setActiveZone('sidebar');
            }
        }
    });

    return (
        <Box flexDirection='row' width="100%" height="100%">
            {/* --- Left Sidebar --- */}
            <Box flexDirection="column" borderStyle="round" borderColor={activeZone === 'sidebar' ? "blue" : "gray"} width="25%" height="100%">
                <Text bold color={activeZone === 'sidebar' ? "blue" : "gray" }>SSH Servers</Text>
				<FocusServer key="add-btn" label="+ Add Server" isActiveZone={activeZone === 'sidebar'} isSpecial isSelected={sidebarIndex === 0} />
                {servers.map((server, i) => (
                    <FocusServer key={server.id} label={server.name} isActiveZone={activeZone === 'sidebar'} isSelected={sidebarIndex === i + 1} />
                ))}
            </Box>

            {/* --- Right Content --- */}
            <Box flexDirection='column' width="75%" height="100%" paddingLeft={1}>
                
                {/* --- 1. Top Tab Bar --- */}
                <Box flexDirection='row' width="100%" height={3} overflow="hidden">
                    {sessions.length === 0 ? (
                        <Text dimColor>Select a server to open a terminal tab...</Text>
                    ) : (
                        sessions.map((s) => (
                            <Box 
                                key={s.id} 
                                borderStyle="round"
                                // 选中时绿色，未选中灰色
                                borderColor={s.id === activeSessionId ? "green" : "gray"}
                                paddingX={1}
                                marginRight={1}
                            >
                                <Text color={s.id === activeSessionId ? "green" : "gray"}>
                                    {s.name}
                                </Text>
                            </Box>
                        ))
                    )}
                </Box>
                
                {/* --- 2. Shell Area --- */}
                {/* 如果没有 Session，显示占位符 */}
                {sessions.length === 0 && (
                     <Box borderStyle="round" borderColor="gray" width="100%" height="100%" padding={1}>
                        <Text dimColor>No active sessions.</Text>
                    </Box>
                )}

                {/* 渲染所有 Active 的 Session，但隐藏非 Active 的 (display: none) 以保持连接 */}
                {sessions.map(s => (
                    <Box 
                        key={s.id} 
                        display={s.id === activeSessionId ? 'flex' : 'none'} 
                        flexDirection="column" 
                        width="100%" 
                        flexGrow={1}
                    >
                         <ShellWindow 
                             sessionId={s.id}
                             server={s.server}
                             isActiveZone={activeZone === 'content'}
                             isCurrentTab={s.id === activeSessionId}
                             onClose={() => closeSession(s.id)}
                         />
                    </Box>
                ))}
            </Box>
        </Box>
    );
}

// === Sidebar Item ===
const FocusServer = ({ label, isActiveZone, isSpecial, isSelected }) => {
    const isFocused = isSelected;
    return (
        <Box
            borderStyle={isFocused ? 'double' : 'round'}
            borderColor={isFocused ? (isActiveZone ? 'cyan' : 'blue') : 'gray'}
            paddingX={1}
            marginBottom={0}
            marginTop={isSpecial ? 1 : 0}
        >
            <Text color={isFocused ? 'white' : 'gray'}>
                {label} {isFocused && isActiveZone ? '◄' : ''}
            </Text>
        </Box>
    );
};

// === Active Shell Window ===
const ShellWindow = ({ sessionId, isActiveZone, server, isCurrentTab, onClose }) => {
    const isFocused = isCurrentTab && isActiveZone;

    return (
        <Box 
            flexDirection="column" 
            borderStyle="round" 
            borderColor={isFocused && isCurrentTab && isActiveZone ? "green" : "gray"} 
            width="100%" 
            height="100%"
            paddingX={1}
            paddingY={0}
        >
            <Box flexGrow={1}>
                <SSHSession 
                    sessionId={sessionId}
                    server={server} 
                    isFocused={isFocused && isCurrentTab && isActiveZone} 
                    onDisconnect={onClose}
                />
            </Box>
        </Box>
    );
};