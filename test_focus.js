import React, { useState, useEffect } from 'react';
import { render, Box, Text, useInput, useFocus, useFocusManager } from 'ink';

const Child = () => {
    const { isFocused } = useFocus({ autoFocus: true });
    
    useInput((input, key) => {
        if (key.escape) {
            // handle
        }
    });

    return <Text>{isFocused ? 'Focused' : 'Blured'}</Text>;
};

const App = () => {
    const { disableFocus } = useFocusManager();
    useEffect(() => {
        disableFocus();
    }, []);

    useInput((input, key) => {
        if (input === 'q') process.exit(0);
    });

    return <Child />;
};

render(<App />);
