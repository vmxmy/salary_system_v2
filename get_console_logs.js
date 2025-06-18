#!/usr/bin/env node

const WebSocket = require('ws');

// Chrome DevTools WebSocket URL from the browser tab
const wsUrl = 'ws://localhost:53332/devtools/page/14D7383CFA5B118B45A14FF93D683D15';

console.log('Connecting to Chrome DevTools...');

const ws = new WebSocket(wsUrl);

let messageId = 1;

ws.on('open', function() {
    console.log('Connected to Chrome DevTools');
    
    // Enable Runtime domain to capture console logs
    ws.send(JSON.stringify({
        id: messageId++,
        method: 'Runtime.enable'
    }));
    
    // Enable Log domain to capture console logs
    ws.send(JSON.stringify({
        id: messageId++,
        method: 'Log.enable'
    }));
    
    // Get existing console logs
    setTimeout(() => {
        ws.send(JSON.stringify({
            id: messageId++,
            method: 'Runtime.evaluate',
            params: {
                expression: 'console.log("Test: Getting console logs..."); "Console logs retrieved"'
            }
        }));
    }, 1000);
});

ws.on('message', function(data) {
    try {
        const message = JSON.parse(data);
        
        if (message.method === 'Runtime.consoleAPICalled') {
            console.log('=== Console Log ===');
            console.log('Type:', message.params.type);
            console.log('Timestamp:', new Date(message.params.timestamp));
            console.log('Args:', message.params.args.map(arg => arg.value || arg.description || arg.objectId));
            console.log('');
        } else if (message.method === 'Log.entryAdded') {
            console.log('=== Log Entry ===');
            console.log('Level:', message.params.entry.level);
            console.log('Text:', message.params.entry.text);
            console.log('Timestamp:', new Date(message.params.entry.timestamp));
            console.log('');
        } else if (message.result) {
            console.log('Command result:', message.result);
        }
    } catch (e) {
        console.error('Error parsing message:', e);
    }
});

ws.on('error', function(error) {
    console.error('WebSocket error:', error);
});

ws.on('close', function() {
    console.log('Connection closed');
    process.exit(0);
});

// Keep the connection alive for a few seconds to capture logs
setTimeout(() => {
    console.log('Closing connection...');
    ws.close();
}, 5000);