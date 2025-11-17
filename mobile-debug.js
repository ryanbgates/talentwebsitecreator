// Simple mobile debugging server
// Add this to your existing server or run separately

const http = require('http');
const url = require('url');

// Store logs in memory (you could also write to file)
const mobileLogs = [];

function handleMobileLog(req, res) {
    let body = '';
    
    req.on('data', chunk => {
        body += chunk.toString();
    });
    
    req.on('end', () => {
        try {
            const logData = JSON.parse(body);
            const timestamp = new Date().toLocaleTimeString();
            
            // Log to console with timestamp
            console.log(`\n📱 [${timestamp}] MOBILE LOG:`);
            console.log(`   Message: ${logData.message}`);
            if (logData.data) {
                console.log(`   Data:`, logData.data);
            }
            console.log(`   User Agent: ${logData.userAgent.includes('Mobile') ? 'MOBILE' : 'DESKTOP'}`);
            
            // Store for later review
            mobileLogs.push({...logData, serverTimestamp: timestamp});
            
            // Keep only last 100 logs
            if (mobileLogs.length > 100) {
                mobileLogs.shift();
            }
            
        } catch (e) {
            console.log('📱 Invalid mobile log data received');
        }
        
        // Send response
        res.writeHead(200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        res.end(JSON.stringify({success: true}));
    });
}

// Simple server to receive mobile logs
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(200, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        res.end();
        return;
    }
    
    if (req.method === 'POST' && parsedUrl.pathname === '/api/mobile-log') {
        handleMobileLog(req, res);
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`📱 Mobile debug server running on http://localhost:${PORT}`);
    console.log('Waiting for mobile logs...\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n📱 Mobile debug server shutting down...');
    console.log(`Total logs received: ${mobileLogs.length}`);
    process.exit();
});