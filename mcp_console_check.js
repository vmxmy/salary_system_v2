#!/usr/bin/env node

const { spawn } = require('child_process');

// Spawn the browser-tools-mcp process
console.log('Starting browser-tools-mcp...');

const mcp = spawn('browser-tools-mcp', [], {
    stdio: ['pipe', 'pipe', 'pipe']
});

// Send MCP initialize request
const initializeRequest = {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
        protocolVersion: "2024-11-05",
        capabilities: {
            experimental: {},
            sampling: {}
        },
        clientInfo: {
            name: "console-checker",
            version: "1.0.0"
        }
    }
};

console.log('Sending initialize request...');
mcp.stdin.write(JSON.stringify(initializeRequest) + '\n');

// Send initialized notification
const initializedNotification = {
    jsonrpc: "2.0",
    method: "notifications/initialized"
};

setTimeout(() => {
    console.log('Sending initialized notification...');
    mcp.stdin.write(JSON.stringify(initializedNotification) + '\n');
    
    // Call getConsoleLogs tool after initialization
    setTimeout(() => {
        const getLogsRequest = {
            jsonrpc: "2.0",
            id: 2,
            method: "tools/call",
            params: {
                name: "getConsoleLogs",
                arguments: {}
            }
        };
        
        console.log('Calling getConsoleLogs...');
        mcp.stdin.write(JSON.stringify(getLogsRequest) + '\n');
    }, 1000);
}, 1000);

mcp.stdout.on('data', (data) => {
    const responses = data.toString().trim().split('\n');
    responses.forEach(response => {
        if (response.trim()) {
            try {
                const parsed = JSON.parse(response);
                console.log('=== MCP Response ===');
                console.log(JSON.stringify(parsed, null, 2));
                console.log('');
            } catch (e) {
                console.log('Raw output:', response);
            }
        }
    });
});

mcp.stderr.on('data', (data) => {
    console.error('MCP Error:', data.toString());
});

mcp.on('close', (code) => {
    console.log(`MCP process exited with code ${code}`);
    process.exit(code);
});

// Cleanup after 10 seconds
setTimeout(() => {
    console.log('Terminating MCP process...');
    mcp.kill();
}, 10000);