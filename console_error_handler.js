#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');

console.log('Starting Browser Console Error Monitor...');

const mcp = spawn('browser-tools-mcp', [], {
    stdio: ['pipe', 'pipe', 'pipe']
});

let currentId = 1;
let errors = [];
let logs = [];

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
    clientInfo: { name: "error-monitor", version: "1.0.0" }
});

let initialized = false;

function checkConsole() {
    console.log('\n=== Checking Console Status ===');
    
    // Get console errors
    setTimeout(() => sendMCPRequest("tools/call", {
        name: "getConsoleErrors",
        arguments: {}
    }), 100);
    
    // Get all console logs
    setTimeout(() => sendMCPRequest("tools/call", {
        name: "getConsoleLogs", 
        arguments: {}
    }), 200);
    
    // Get network errors
    setTimeout(() => sendMCPRequest("tools/call", {
        name: "getNetworkErrors",
        arguments: {}
    }), 300);
    
    // Get all network logs to check for issues
    setTimeout(() => sendMCPRequest("tools/call", {
        name: "getNetworkLogs",
        arguments: {}
    }), 400);
}

function analyzeAndFixErrors() {
    console.log('\n=== Error Analysis ===');
    
    if (errors.length === 0) {
        console.log('✅ No console errors detected');
    } else {
        console.log(`❌ Found ${errors.length} console errors:`);
        errors.forEach((error, index) => {
            console.log(`\nError ${index + 1}:`);
            console.log(error);
        });
    }
    
    if (logs.length === 0) {
        console.log('ℹ️  No console logs found');
    } else {
        console.log(`📝 Found ${logs.length} console logs`);
    }
    
    // Generate error report
    const report = {
        timestamp: new Date().toISOString(),
        errors: errors,
        logs: logs,
        recommendations: generateRecommendations()
    };
    
    fs.writeFileSync('console_error_report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Error report saved to console_error_report.json');
}

function generateRecommendations() {
    const recommendations = [];
    
    if (errors.length > 0) {
        recommendations.push("Check browser developer tools for detailed error stack traces");
        recommendations.push("Verify all script dependencies are properly loaded");
        recommendations.push("Check for TypeScript compilation errors");
        recommendations.push("Ensure all imported modules exist and are accessible");
    }
    
    // Add specific recommendations based on error patterns
    const errorText = errors.join(' ').toLowerCase();
    
    if (errorText.includes('network') || errorText.includes('fetch') || errorText.includes('xhr')) {
        recommendations.push("Check network connectivity and API endpoints");
        recommendations.push("Verify CORS configuration");
        recommendations.push("Check backend server status");
    }
    
    if (errorText.includes('undefined') || errorText.includes('null')) {
        recommendations.push("Add null checks and default values");
        recommendations.push("Verify data initialization");
    }
    
    if (errorText.includes('react') || errorText.includes('component')) {
        recommendations.push("Check React component lifecycle methods");
        recommendations.push("Verify prop types and component structure");
    }
    
    return recommendations;
}

mcp.stdout.on('data', (data) => {
    const responses = data.toString().trim().split('\n');
    responses.forEach(response => {
        if (response.trim()) {
            try {
                const parsed = JSON.parse(response);
                
                if (parsed.id === 1 && !initialized) {
                    // Initialization complete
                    initialized = true;
                    sendMCPNotification("notifications/initialized");
                    setTimeout(checkConsole, 1000);
                }
                
                if (parsed.result && parsed.result.content) {
                    const content = parsed.result.content[0];
                    if (content && content.text) {
                        try {
                            const data = JSON.parse(content.text);
                            if (Array.isArray(data) && data.length > 0) {
                                if (parsed.id >= 2 && parsed.id <= 5) {
                                    switch(parsed.id) {
                                        case 2: // Console errors
                                            errors = data;
                                            console.log(`Found ${data.length} console errors`);
                                            break;
                                        case 3: // Console logs  
                                            logs = data;
                                            console.log(`Found ${data.length} console logs`);
                                            break;
                                        case 4: // Network errors
                                            if (data.length > 0) {
                                                console.log(`Found ${data.length} network errors`);
                                                errors = errors.concat(data);
                                            }
                                            break;
                                        case 5: // All network logs
                                            console.log(`Found ${data.length} network requests`);
                                            // Filter for failed requests
                                            const failedRequests = data.filter(req => 
                                                req.status >= 400 || req.status === 0
                                            );
                                            if (failedRequests.length > 0) {
                                                console.log(`Found ${failedRequests.length} failed requests`);
                                                errors = errors.concat(failedRequests);
                                            }
                                            break;
                                    }
                                }
                            }
                        } catch (e) {
                            // Not JSON data, treat as string
                            if (content.text !== '[]') {
                                console.log('Non-JSON response:', content.text);
                            }
                        }
                    }
                }
                
                // After all checks complete, analyze results
                if (parsed.id === 5) {
                    setTimeout(() => {
                        analyzeAndFixErrors();
                        mcp.kill();
                    }, 500);
                }
                
            } catch (e) {
                // Raw output from server
                if (response.includes('error') || response.includes('Error')) {
                    console.log('Server message:', response);
                }
            }
        }
    });
});

mcp.stderr.on('data', (data) => {
    const message = data.toString();
    if (!message.includes('Successfully') && !message.includes('Attempting')) {
        console.error('MCP Error:', message);
    }
});

mcp.on('close', (code) => {
    console.log('\n=== Console Error Check Complete ===');
    process.exit(code || 0);
});

// Timeout after 15 seconds
setTimeout(() => {
    console.log('Timeout - completing check...');
    analyzeAndFixErrors();
    mcp.kill();
}, 15000);