import React, { useState, useEffect, useRef } from 'react';
import { Box, Text, useStdout, useStdin, useInput } from 'ink';
import { Client } from 'ssh2';
import xtermHeadless from '@xterm/headless';
import fs from 'node:fs';
import PageStore from '../store.js';

const { Terminal } = xtermHeadless;

export default function SSHSession({ sessionId, server, isFocused, onDisconnect }) {
    const { stdout } = useStdout();
    const updateSession = PageStore(state => state.updateSession);
    const sessions = PageStore(state => state.sessions);
    const sessionObj = sessions.find(s => s.id === sessionId);

    // Dynamic Sizing
    const getTermSize = () => ({
        cols: Math.max(10, Math.floor(stdout.columns * 0.75) - 4),
        rows: Math.max(5, stdout.rows - 5)
    });
    const [dims, setDims] = useState(getTermSize());

    useEffect(() => {
        const onResize = () => setDims(getTermSize());
        stdout.on('resize', onResize);
        return () => stdout.off('resize', onResize);
    }, [stdout]);

    // If context exists, we are connected
    // Fix: context is initialized as {}, so we must check for a property like .ssh
    const [status, setStatus] = useState((sessionObj?.context?.ssh) ? 'connected' : 'initializing');
    const [logs, setLogs] = useState([]);
    const [termLines, setTermLines] = useState([]);
    const [cursor, setCursor] = useState({ x: 0, y: 0 });

    // Effect: Handle Resizing of Active Session
    useEffect(() => {
        if (status === 'connected' && sessionObj?.context) {
            const { term, stream } = sessionObj.context;
            if (term) term.resize(dims.cols, dims.rows);
            if (stream && typeof stream.setWindow === 'function') {
                stream.setWindow(dims.rows, dims.cols, 0, 0);
            }
        }
    }, [dims, status, sessionObj]);

    // Effect 1: Configure / Restore Connection
    useEffect(() => {
        if (!sessionObj) return;

        // If already connected in store, ensure local status matches
        // Fix: Check specific property, not just context object
        if (sessionObj.context && sessionObj.context.ssh) {
            if (status !== 'connected') setStatus('connected');
            return;
        }getTermSize

        // --- Start New Connection ---
        setStatus('connecting');
        const conn = new Client();
        const term = new Terminal({
            cols: dims.cols,
            rows: dims.rows,
            allowProposedApi: true
        });

        conn.on('ready', () => {
            setLogs(l => [...l, 'Connection ready...']);
            conn.shell({ term: 'xterm-color', cols: dims.cols, rows: dims.rows }, (err, stream) => {
                if (err) {
                    setLogs(l => [...l, 'Shell error: ' + err.message]);
                    conn.end();
                    return;
                }

                // 1. Permanent Pipe: Stream -> Terminal State
                // This must persist even if UI unmounts
                stream.on('data', (data) => {
                    term.write(data);
                });

                // 2. Handle Closure
                stream.on('close', () => {
                   if (onDisconnect) onDisconnect();
                });

                // 3. Save to Store
                updateSession(sessionId, {
                    context: {
                        ssh: conn,
                        term: term,
                        stream: stream
                    }
                });
                
                setStatus('connected');
            });
        });

        conn.on('error', (err) => {
            setLogs(l => [...l, 'Error: ' + err.message]);
            setStatus('error');
        });
        
        conn.on('close', () => {
             // If connection closes unexpectedly
             // We might want to update status if we are still looking at it
        });

        try {
            setLogs(l => [...l, `Connecting to ${server.host}...`]);
            
            let privateKeyContent;
            if (server.privateKey) {
                try {
                    privateKeyContent = fs.readFileSync(server.privateKey);
                } catch (err) {
                     setLogs(l => [...l, 'Error loading private key: ' + err.message]);
                     setStatus('error');
                     return;
                }
            }

            conn.connect({
                host: server.host,
                port: parseInt(server.port || 22),
                username: server.username || server.user,
                password: server.password, 
                ...(privateKeyContent ? { privateKey: privateKeyContent } : {})
            });
        } catch (e) {
             setLogs(l => [...l, 'Connect Exception: ' + e.message]);
             setStatus('error');
        }

    }, [sessionId]); // Run once for this session ID
    
    // Effect 2: UI Updates (Subscribe to stream data)
    useEffect(() => {
        if (status !== 'connected' || !sessionObj?.context) return;
        
        const { stream, term } = sessionObj.context;
        if (!stream || !term) return;
        
        const updateUI = () => {
            if (!term) return;
            // Get visible lines from buffer
            const buffer = term.buffer.active;
            const lines = [];
            // Fix: Standard loop to avoid infinite loops and maintain layout
            for (let i = 0; i < term.rows; i++) {
                const line = buffer.getLine(buffer.baseY + i);
                if (line) {
                    const text = line.translateToString(true);
                    if (text.trim() === '') {
                        lines.push(' ');
                    } else {
                        lines.push(text);
                    }
                } else {
                    lines.push(' ');
                }
            }
            setTermLines(lines);
            setCursor({ x: buffer.cursorX, y: buffer.cursorY });
        };
        
        // Initial render
        updateUI();
        
        // Listener for new data to trigger re-render
        // Throttle UI updates to avoid freezing (Main Thread Blocking) on fast output
        let updateTimer = null;
        const scheduleUpdate = () => {
            if (!updateTimer) {
                updateTimer = setTimeout(() => {
                    updateUI();
                    updateTimer = null;
                }, 16); 
            }
        };
        
        stream.on('data', scheduleUpdate);
        
        // Also listen to cursor moves directly from xterm
        // This ensures cursor updates are captured even if data processing is batched
        const cursorDisposable = term.onCursorMove ? term.onCursorMove(scheduleUpdate) : { dispose: () => {} };

        return () => {
            stream.removeListener('data', scheduleUpdate);
            cursorDisposable.dispose();
            if (updateTimer) clearTimeout(updateTimer);
        };
    }, [status, sessionObj, dims]); // Re-run if status matches or sessionObj reference updates (it shouldn't drastically)

    // Effect 3: User Input (Raw Mode)
    const { stdin, setRawMode } = useStdin();

    useEffect(() => {
        if (!isFocused || status !== 'connected' || !sessionObj?.context) return;

        const { stream } = sessionObj.context;
        if (setRawMode) setRawMode(true);

        const onData = (data) => {
            stream.write(data);
        };

        stdin.on('data', onData);
        return () => {
            stdin.off('data', onData);
        };
    }, [isFocused, status, sessionObj, stdin, setRawMode]);

    // Handle input when not connected (Error/Connecting state)
    useInput((input, key) => {
        if (!isFocused) return;
        
        // If not connected (e.g. error), allow Ctrl+C to close
        if (status == 'error') {
            if ((key.ctrl && input === 'c')) {
                if (onDisconnect) onDisconnect();
            }
        }
    });

    if (status === 'connected') {
        return (
            <Box flexDirection="column" width="100%" height="100%" overflow="hidden">
                 {termLines.map((line, i) => {
                     if (i === cursor.y) {
                         let paddedLine = line;
                         if (paddedLine.length <= cursor.x) {
                             paddedLine = paddedLine.padEnd(cursor.x + 1, ' ');
                         }
                         const pre = paddedLine.slice(0, cursor.x);
                         const char = paddedLine[cursor.x] || ' ';
                         const post = paddedLine.slice(cursor.x + 1);
                         
                         return (
                            <Box key={i} flexDirection="row">
                                <Text>{pre}</Text>
                                <Text backgroundColor="white" color="black">{char}</Text>
                                <Text>{post}</Text>
                            </Box>
                         );
                     }
                     return <Text key={i} wrap="truncate-end">{line}</Text>;
                 })}
            </Box>
        );
    }
    
    return (
        <Box flexDirection="column" padding={1}>
            <Text>Status: {status}</Text>
            {logs.map((l, i) => <Text key={i} color="gray">{l}</Text>)}
            {status === 'error' && (
                <Text dimColor>Press Ctrl+C to close this session.</Text>
            )}
        </Box>
    );
}

