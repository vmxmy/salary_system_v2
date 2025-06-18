#!/usr/bin/env node

const { spawn } = require('child_process');

console.log('Refreshing browser and checking for console errors...');

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
    mcp.stdin.write(JSON.stringify(request) + '\n');
    return request.id;
}

function sendMCPNotification(method, params = {}) {
    const notification = {
        jsonrpc: "2.0",
        method: method,
        params: params
    };
    mcp.stdin.write(JSON.stringify(notification) + '\n');
}

let initialized = false;
let step = 0;

mcp.stdout.on('data', (data) => {
    const responses = data.toString().trim().split('\n');
    responses.forEach(response => {
        if (response.trim()) {
            try {
                const parsed = JSON.parse(response);
                
                if (parsed.id === 1 && !initialized) {
                    initialized = true;
                    sendMCPNotification("notifications/initialized");
                    
                    // Step 1: Clear console logs
                    setTimeout(() => {
                        console.log('Step 1: Clearing console logs...');
                        step = 1;
                        sendMCPRequest("tools/call", {
                            name: "wipeLogs",
                            arguments: {}
                        });
                    }, 1000);
                }
                
                if (parsed.id === 2 && step === 1) {
                    // Step 2: Wait a moment then check again
                    step = 2;
                    setTimeout(() => {
                        console.log('Step 2: Checking console after clearing...');
                        sendMCPRequest("tools/call", {
                            name: "getConsoleErrors",
                            arguments: {}
                        });
                    }, 2000);
                }
                
                if (parsed.id === 3 && step === 2) {
                    // Final check results
                    const content = parsed.result && parsed.result.content && parsed.result.content[0];
                    if (content && content.text) {
                        try {
                            const errors = JSON.parse(content.text);
                            if (Array.isArray(errors)) {
                                console.log(`\\n=== Final Console Status ===`);
                                if (errors.length === 0) {
                                    console.log('✅ No console errors found! All issues have been fixed.');
                                } else {
                                    console.log(`❌ Still found ${errors.length} console errors:`);
                                    errors.forEach((error, index) => {
                                        console.log(`Error ${index + 1}: ${error.message.substring(0, 100)}...`);
                                    });
                                }
                            }
                        } catch (e) {
                            console.log('Response:', content.text);
                        }
                    }
                    
                    setTimeout(() => {
                        mcp.kill();
                    }, 1000);
                }
                
            } catch (e) {
                // Raw output
            }
        }
    });
});

mcp.stderr.on('data', (data) => {
    // Ignore
});

mcp.on('close', (code) => {
    console.log('\\n=== Check Complete ===');
    process.exit(code || 0);
});

// Initialize
sendMCPRequest("initialize", {
    protocolVersion: "2024-11-05",
    capabilities: { experimental: {}, sampling: {} },
    clientInfo: { name: "refresh-checker", version: "1.0.0" }
});

// Timeout
setTimeout(() => {
    console.log('Timeout - exiting...');
    mcp.kill();
}, 15000);