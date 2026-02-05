import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import PageStore from '../../store.js';
import ChooseFile from '../../utils/choosefile.js';

export default function AddServerPage() {
    const [name, setName] = useState('');
    const [host, setHost] = useState('');
    const [user, setUser] = useState('root');
    const [port, setPort] = useState('22');
    const [password, setPassword] = useState('');
    const [privateKey, setPrivateKey] = useState('');
    const [showFileSelector, setShowFileSelector] = useState(false);
    
    // 0: Name, 1: Host, 2: User, 3: Port, 4: Password, 5: Private Key, 6: Submit Button
    const [activeField, setActiveField] = useState(0); 

    const addServer = PageStore((state) => state.addServer);
    const setCurrentPage = PageStore((state) => state.setCurrentPage);

    useInput((input, key) => {
        if (showFileSelector) return;

        if (key.return) {
             if (activeField === 6) { // Submit button
                 if (!name || !host) return; // Simple validation
                 addServer({ name, host, username: user, port, password, privateKey });
                 setCurrentPage('main');
             } else if (activeField === 5) {
                 setShowFileSelector(true);
             } else {
                 setActiveField(Math.min(6, activeField + 1));
             }
        }
        
        if (key.escape) {
            setCurrentPage('main');
        }

        if (key.upArrow) {
            setActiveField(Math.max(0, activeField - 1));
        }
        
        if (key.downArrow) {
            setActiveField(Math.min(6, activeField + 1));
        }
        
        if (key.tab) {
             setActiveField((activeField + 1) % 7);
        }

        if (key.space && activeField === 5) {
            setShowFileSelector(true);
        }
    });

    if (showFileSelector) {
        return (
            <ChooseFile 
                onSelect={(path) => {
                    setPrivateKey(path);
                    setShowFileSelector(false);
                }} 
                onCancel={() => setShowFileSelector(false)} 
            />
        );
    }

    return (
        <Box flexDirection="column" padding={1} borderStyle="single" alignItems="center" height="100%">
            <Text bold>Add New Server</Text>
            
            <Box flexDirection="column" marginTop={1} gap={1} alignItems="center">
                <Box>
                    <Text color={activeField === 0 ? 'green' : 'white'}>Name: </Text>
                    <TextInput 
                        value={name} 
                        onChange={setName} 
                        focus={activeField === 0} 
                        placeholder="My Server"
                    />
                </Box>
                <Box>
                    <Text color={activeField === 1 ? 'green' : 'white'}>Host: </Text>
                    <TextInput 
                        value={host} 
                        onChange={setHost} 
                        focus={activeField === 1} 
                        placeholder="192.168.1.1"
                    />
                </Box>
                <Box>
                    <Text color={activeField === 2 ? 'green' : 'white'}>User: </Text>
                    <TextInput 
                        value={user} 
                        onChange={setUser} 
                        focus={activeField === 2} 
                        placeholder="root"
                    />
                </Box>
                <Box>
                    <Text color={activeField === 3 ? 'green' : 'white'}>Port: </Text>
                    <TextInput 
                        value={port} 
                        onChange={setPort} 
                        focus={activeField === 3} 
                        placeholder="22"
                    />
                </Box>
                <Box>
                    <Text color={activeField === 4 ? 'green' : 'white'}>Password: </Text>
                    <TextInput 
                        value={password} 
                        onChange={setPassword} 
                        focus={activeField === 4} 
                        placeholder=""
                        mask="*"
                    />
                </Box>
                <Box>
                    <Text color={activeField === 5 ? 'green' : 'white'}>Private Key: </Text>
                    <Text color={privateKey ? 'white' : 'gray'}>{privateKey || '(None)'}</Text>
                    {activeField === 5 && <Text color="gray"> (Press Space/Enter)</Text>}
                </Box>
                <Box marginTop={1}>
                    <Text 
                        color={activeField === 6 ? 'black' : 'green'} 
                        backgroundColor={activeField === 6 ? 'green' : undefined}
                    > [ Save Server ] </Text>
                </Box>
            </Box>
            
            <Box marginTop={1}>
                <Text color="gray">Use Up/Down to navigate, Enter to submit, Esc to cancel</Text>
            </Box>
        </Box>
    );
}

export function EditServerPage() {
    const servers = PageStore((state) => state.servers);
    const editingServerId = PageStore((state) => state.editingServerId);
    const updateServer = PageStore((state) => state.updateServer);
    const setCurrentPage = PageStore((state) => state.setCurrentPage);
    const setEditingServerId = PageStore((state) => state.setEditingServerId);

    const targetServer = servers.find(s => s.id === editingServerId);

    const [name, setName] = useState(targetServer?.name || '');
    const [host, setHost] = useState(targetServer?.host || '');
    const [user, setUser] = useState(targetServer?.username || 'root');
    const [port, setPort] = useState(targetServer?.port || '22');
    const [password, setPassword] = useState(targetServer?.password || '');
    const [privateKey, setPrivateKey] = useState(targetServer?.privateKey || '');
    
    // 如果没有找到 Server (比如页面刷新了状态丢失)，回退
    if (!targetServer && editingServerId) {
         // 这里不能直接调用 setCurrentPage 因为会导致 render 时的 state update
         // 可以在 useEffect 里处理，或者直接渲染错误
    }

    const [showFileSelector, setShowFileSelector] = useState(false);
    
    // 0: Name, 1: Host, 2: User, 3: Port, 4: Password, 5: Private Key, 6: Submit Button
    const [activeField, setActiveField] = useState(0); 

    useInput((input, key) => {
        if (showFileSelector) return;

        if (key.return) {
             if (activeField === 6) { // Submit button
                 if (!name || !host) return; 
                 updateServer(editingServerId, { name, host, username: user, port, password, privateKey });
                 setEditingServerId(null);
                 setCurrentPage('main');
             } else if (activeField === 5) {
                 setShowFileSelector(true);
             } else {
                 setActiveField(Math.min(6, activeField + 1));
             }
        }
        
        if (key.escape) {
            setEditingServerId(null);
            setCurrentPage('main');
        }

        if (key.upArrow) {
            setActiveField(Math.max(0, activeField - 1));
        }
        
        if (key.downArrow) {
            setActiveField(Math.min(6, activeField + 1));
        }
        
        if (key.tab) {
             setActiveField((activeField + 1) % 7);
        }

        if (key.space && activeField === 5) {
            setShowFileSelector(true);
        }
    });

    if (!targetServer) {
        return <Text color="red">Error: Server not found.</Text>;
    }

    if (showFileSelector) {
        return (
            <ChooseFile 
                onSelect={(path) => {
                    setPrivateKey(path);
                    setShowFileSelector(false);
                }} 
                onCancel={() => setShowFileSelector(false)} 
            />
        );
    }

    return (
        <Box flexDirection="column" padding={1} borderStyle="single" alignItems="center" height="100%">
            <Text bold>Edit Server: {targetServer.name}</Text>
            
            <Box flexDirection="column" marginTop={1} gap={1} alignItems="center">
                <Box>
                    <Text color={activeField === 0 ? 'green' : 'white'}>Name: </Text>
                    <TextInput 
                        value={name} 
                        onChange={setName} 
                        focus={activeField === 0} 
                        placeholder="My Server"
                    />
                </Box>
                <Box>
                    <Text color={activeField === 1 ? 'green' : 'white'}>Host: </Text>
                    <TextInput 
                        value={host} 
                        onChange={setHost} 
                        focus={activeField === 1} 
                        placeholder="192.168.1.1"
                    />
                </Box>
                <Box>
                    <Text color={activeField === 2 ? 'green' : 'white'}>User: </Text>
                    <TextInput 
                        value={user} 
                        onChange={setUser} 
                        focus={activeField === 2} 
                        placeholder="root"
                    />
                </Box>
                <Box>
                    <Text color={activeField === 3 ? 'green' : 'white'}>Port: </Text>
                    <TextInput 
                        value={port} 
                        onChange={setPort} 
                        focus={activeField === 3} 
                        placeholder="22"
                    />
                </Box>
                <Box>
                    <Text color={activeField === 4 ? 'green' : 'white'}>Password: </Text>
                    <TextInput 
                        value={password} 
                        onChange={setPassword} 
                        focus={activeField === 4} 
                        placeholder="••••••"
                        mask="*"
                    />
                </Box>
                <Box>
                    <Text color={activeField === 5 ? 'green' : 'white'}>Private Key: </Text>
                    <Text color={privateKey ? 'white' : 'gray'}>{privateKey || '(None)'}</Text>
                    {activeField === 5 && <Text color="gray"> (Press Space/Enter)</Text>}
                </Box>
                <Box marginTop={1}>
                    <Text 
                        color={activeField === 6 ? 'black' : 'green'} 
                        backgroundColor={activeField === 6 ? 'green' : undefined}
                    > [ Update Server ] </Text>
                </Box>
            </Box>
            
            <Box marginTop={1}>
                <Text color="gray">Use Up/Down to navigate, Enter to save, Esc to cancel</Text>
            </Box>
        </Box>
    );
}