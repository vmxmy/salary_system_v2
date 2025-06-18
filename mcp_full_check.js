#!/usr/bin/env node

const { spawn } = require('child_process');

// Spawn the browser-tools-mcp process
console.log('Starting browser-tools-mcp...');

const mcp = spawn('browser-tools-mcp', [], {
    stdio: ['pipe', 'pipe', 'pipe']
});

let currentId = 1;

function sendMCPRequest(method, params = {}) {
    const request = {
        jsonrpc: "2.0",
        id: currentId++,
        method: method,
        params: params
    };
    console.log(`Sending ${method}...`);
    mcp.stdin.write(JSON.stringify(request) + '\n');
    return request.id;
}

function sendMCPNotification(method, params = {}) {
    const notification = {
        jsonrpc: "2.0",
        method: method,
        params: params
    };
    console.log(`Sending ${method} notification...`);
    mcp.stdin.write(JSON.stringify(notification) + '\n');
}

// Send MCP initialize request
sendMCPRequest("initialize", {
    protocolVersion: "2024-11-05",
    capabilities: {
        experimental: {},
        sampling: {}
    },
    clientInfo: {
        name: "console-checker",
        version: "1.0.0"
    }
});

let step = 0;

mcp.stdout.on('data', (data) => {
    const responses = data.toString().trim().split('\n');
    responses.forEach(response => {
        if (response.trim()) {
            try {
                const parsed = JSON.parse(response);
                console.log('=== MCP Response ===');
                console.log(JSON.stringify(parsed, null, 2));
                console.log('');
                
                // Handle step-by-step execution
                if (parsed.id === 1 && step === 0) {
                    // Initialize completed, send initialized notification
                    step = 1;
                    setTimeout(() => {
                        sendMCPNotification("notifications/initialized");
                        
                        // Take a screenshot first to see what's on the page
                        setTimeout(() => {
                            step = 2;
                            sendMCPRequest("tools/call", {
                                name: "takeScreenshot",
                                arguments: {}
                            });
                        }, 1000);
                    }, 500);
                } else if (step === 2 && parsed.id === 2) {
                    // Screenshot taken, now get console logs
                    step = 3;
                    setTimeout(() => {
                        sendMCPRequest("tools/call", {
                            name: "getConsoleLogs",
                            arguments: {}
                        });
                    }, 500);
                } else if (step === 3 && parsed.id === 3) {
                    // Got console logs, now get console errors
                    step = 4;
                    setTimeout(() => {
                        sendMCPRequest("tools/call", {
                            name: "getConsoleErrors",
                            arguments: {}
                        });
                    }, 500);
                } else if (step === 4 && parsed.id === 4) {
                    // Got console errors, now get network logs
                    step = 5;
                    setTimeout(() => {
                        sendMCPRequest("tools/call", {
                            name: "getNetworkErrors",
                            arguments: {}
                        });
                    }, 500);
                } else if (step === 5 && parsed.id === 5) {
                    // Done with all checks
                    console.log('=== All checks completed ===');
                    setTimeout(() => {
                        mcp.kill();
                    }, 1000);
                }
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
    process.exit(code || 0);
});

// Cleanup after 30 seconds max
setTimeout(() => {
    console.log('Timeout - terminating MCP process...');
    mcp.kill();
}, 30000);