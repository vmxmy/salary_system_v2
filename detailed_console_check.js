#!/usr/bin/env node

const { spawn } = require('child_process');

console.log('Starting detailed console error check...');

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

// Initialize MCP
sendMCPRequest("initialize", {
    protocolVersion: "2024-11-05",
    capabilities: { experimental: {}, sampling: {} },
    clientInfo: { name: "detailed-error-checker", version: "1.0.0" }
});

let initialized = false;
let detailedErrors = [];

mcp.stdout.on('data', (data) => {
    const responses = data.toString().trim().split('\n');
    responses.forEach(response => {
        if (response.trim()) {
            try {
                const parsed = JSON.parse(response);
                
                if (parsed.id === 1 && !initialized) {
                    initialized = true;
                    sendMCPNotification("notifications/initialized");
                    
                    // Wait a bit then check console errors
                    setTimeout(() => {
                        console.log('Checking for detailed console errors...');
                        sendMCPRequest("tools/call", {
                            name: "getConsoleErrors",
                            arguments: {}
                        });
                    }, 1000);
                }
                
                if (parsed.result && parsed.result.content && parsed.id === 2) {
                    const content = parsed.result.content[0];
                    if (content && content.text) {
                        try {
                            const errors = JSON.parse(content.text);
                            if (Array.isArray(errors) && errors.length > 0) {
                                console.log(`\\n=== Found ${errors.length} Console Errors ===\\n`);
                                errors.forEach((error, index) => {
                                    console.log(`Error ${index + 1}:`);
                                    console.log(`Level: ${error.level}`);
                                    console.log(`Type: ${error.type}`);
                                    console.log(`Timestamp: ${new Date(error.timestamp)}`);
                                    console.log(`Message:\\n${error.message}`);
                                    console.log('-'.repeat(80));
                                    
                                    // Parse stack trace for exact line numbers
                                    if (error.message.includes('DepartmentCostCard')) {
                                        console.log('🔍 DepartmentCostCard error detected');
                                        detailedErrors.push({
                                            component: 'DepartmentCostCard',
                                            error: error,
                                            possibleCause: 'Missing key prop in list rendering'
                                        });
                                    }
                                    
                                    if (error.message.includes('EmployeeTypeCard')) {
                                        console.log('🔍 EmployeeTypeCard error detected');
                                        detailedErrors.push({
                                            component: 'EmployeeTypeCard', 
                                            error: error,
                                            possibleCause: 'Missing key prop in list rendering'
                                        });
                                    }
                                });
                                
                                // Provide specific fixes
                                console.log('\\n=== Recommended Fixes ===\\n');
                                detailedErrors.forEach(errorInfo => {
                                    console.log(`Component: ${errorInfo.component}`);
                                    console.log(`Issue: ${errorInfo.possibleCause}`);
                                    console.log(`Fix: Add unique key prop to each mapped element`);
                                    console.log('');
                                });
                            } else {
                                console.log('✅ No console errors found!');
                            }
                        } catch (e) {
                            console.log('Raw error content:', content.text);
                        }
                    }
                    
                    // Clean up and exit
                    setTimeout(() => {
                        mcp.kill();
                    }, 1000);
                }
                
            } catch (e) {
                // Raw output
                if (response.includes('error') || response.includes('Error')) {
                    console.log('Raw server message:', response);
                }
            }
        }
    });
});

mcp.stderr.on('data', (data) => {
    const message = data.toString();
    if (message.includes('error') || message.includes('Error')) {
        console.error('MCP Error:', message);
    }
});

mcp.on('close', (code) => {
    console.log('\\n=== Console Error Check Complete ===');
    process.exit(code || 0);
});

// Timeout
setTimeout(() => {
    console.log('Timeout - exiting...');
    mcp.kill();
}, 10000);