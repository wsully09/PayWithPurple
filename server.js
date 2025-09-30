const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// In-memory storage for tickets (in production, use a database)
const tickets = new Map();

// Generate random 6-digit ticket ID
function generateTicketId() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Create a new ticket
app.post('/api/tickets', (req, res) => {
    try {
        const ticketId = generateTicketId();
        const ticketData = {
            id: ticketId,
            createdAt: new Date().toISOString(),
            status: 'active',
            event: 'Fall Formal',
            date: 'November 15, 2024',
            time: '7:00 PM - 11:00 PM',
            location: 'Duncan Hall',
            price: '$12'
        };
        
        tickets.set(ticketId, ticketData);
        
        // Get the actual domain from the request
        const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
        const host = req.headers['x-forwarded-host'] || req.headers.host || 'paywithpurple-production.up.railway.app';
        const baseUrl = `${protocol}://${host}`;
        
        res.json({
            success: true,
            ticket: ticketData,
            url: `${baseUrl}/ticket/${ticketId}`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to create ticket'
        });
    }
});

// Get ticket by ID
app.get('/api/tickets/:id', (req, res) => {
    const ticketId = req.params.id;
    const ticket = tickets.get(ticketId);
    
    if (!ticket) {
        return res.status(404).json({
            success: false,
            error: 'Ticket not found'
        });
    }
    
    res.json({
        success: true,
        ticket: ticket
    });
});

// Serve ticket page
app.get('/ticket/:id', (req, res) => {
    const ticketId = req.params.id;
    const ticket = tickets.get(ticketId);
    
    if (!ticket) {
        return res.status(404).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Ticket Not Found</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        text-align: center; 
                        padding: 50px;
                        background-color: #0e140b;
                        color: white;
                    }
                </style>
            </head>
            <body>
                <h1>Ticket Not Found</h1>
                <p>This ticket ID is not valid or has expired.</p>
                <a href="/" style="color: white;">Back to Home</a>
            </body>
            </html>
        `);
    }
    
    // Serve the ticket.html page with ticket data
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Ticket #${ticketId}</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                body {
                    height: 100vh;
                    background-color: #0e140b;
                    position: relative;
                    overflow: hidden;
                    font-family: Arial, sans-serif;
                }

                .noise-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-image: url('noise-light.png');
                    background-repeat: repeat;
                    opacity: 0.3;
                    pointer-events: none;
                    z-index: 1;
                }

                .container {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    text-align: center;
                    z-index: 10;
                    color: white;
                    max-width: 500px;
                    width: 90%;
                }

                .ticket-card {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 16px;
                    padding: 40px 30px;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    backdrop-filter: blur(10px);
                }

                .ticket-id {
                    font-size: 28px;
                    font-weight: 700;
                    margin-bottom: 20px;
                    color: #fff;
                }

                .ticket-status {
                    font-size: 18px;
                    color: #4CAF50;
                    margin-bottom: 30px;
                    font-weight: 600;
                }

                .ticket-details {
                    font-size: 16px;
                    color: rgba(255, 255, 255, 0.8);
                    line-height: 1.6;
                    margin-bottom: 30px;
                    text-align: left;
                }

                .back-button {
                    background: linear-gradient(135deg, #ffffff, #f8f8f8);
                    border: 2px solid rgba(255, 255, 255, 0.8);
                    color: #333;
                    padding: 12px 30px;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-decoration: none;
                    display: inline-block;
                }

                .back-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
                }
            </style>
        </head>
        <body>
            <div class="noise-overlay"></div>
            
            <div class="container">
                <div class="ticket-card">
                    <div class="ticket-id">Ticket #${ticket.id}</div>
                    <div class="ticket-status">✓ Valid Ticket</div>
                    <div class="ticket-details">
                        <p><strong>Event:</strong> ${ticket.event}</p>
                        <p><strong>Date:</strong> ${ticket.date}</p>
                        <p><strong>Time:</strong> ${ticket.time}</p>
                        <p><strong>Location:</strong> ${ticket.location}</p>
                        <p><strong>Price:</strong> ${ticket.price}</p>
                        <p><strong>Created:</strong> ${new Date(ticket.createdAt).toLocaleDateString()}</p>
                    </div>
                    <a href="/" class="back-button">Back to Home</a>
                </div>
            </div>
        </body>
        </html>
    `);
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Pretty URL routes for HTML files (without .html extension)
app.get('/ticket-generator', (req, res) => {
    res.sendFile(path.join(__dirname, 'ticket-generator.html'));
});

app.get('/ticket-generator-railway', (req, res) => {
    res.sendFile(path.join(__dirname, 'ticket-generator-railway.html'));
});

app.get('/send', (req, res) => {
    res.sendFile(path.join(__dirname, 'send.html'));
});

app.get('/qr-code-scanner', (req, res) => {
    res.sendFile(path.join(__dirname, 'qr-code-scanner.html'));
});

// Serve static files for specific assets only (CSS, JS, images, etc.)
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/favicons', express.static(path.join(__dirname, 'favicons')));
app.use(express.static(path.join(__dirname, '.'), {
    // Only serve files with these extensions as static files
    setHeaders: (res, path) => {
        if (path.endsWith('.css') || path.endsWith('.js') || path.endsWith('.png') || 
            path.endsWith('.jpg') || path.endsWith('.jpeg') || path.endsWith('.gif') || 
            path.endsWith('.svg') || path.endsWith('.ico') || path.endsWith('.woff') || 
            path.endsWith('.woff2') || path.endsWith('.ttf') || path.endsWith('.eot')) {
            res.setHeader('Cache-Control', 'public, max-age=31536000');
        }
    }
}));

// Catch-all handler for any remaining routes (fallback to index.html for SPA behavior)
app.get('*', (req, res) => {
    // If it's an API route, return 404
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    // Check if it's a request for a static file that doesn't exist
    const filePath = path.join(__dirname, req.path);
    const ext = path.extname(req.path);
    
    // If it has an extension and the file doesn't exist, return 404
    if (ext && !fs.existsSync(filePath)) {
        return res.status(404).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>404 - File Not Found</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        text-align: center; 
                        padding: 50px;
                        background-color: #0e140b;
                        color: white;
                    }
                </style>
            </head>
            <body>
                <h1>404 - File Not Found</h1>
                <p>The requested file could not be found.</p>
                <a href="/" style="color: white;">Back to Home</a>
            </body>
            </html>
        `);
    }
    
    // For all other routes, serve index.html (useful for client-side routing)
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Ticket generator: http://localhost:${PORT}/ticket-generator`);
    console.log(`Railway ticket generator: http://localhost:${PORT}/ticket-generator-railway`);
    console.log(`Send page: http://localhost:${PORT}/send`);
    console.log(`QR Scanner: http://localhost:${PORT}/qr-code-scanner`);
});
