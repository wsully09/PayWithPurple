const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const QRCode = require('qrcode');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Supabase configuration
const SUPABASE_URL = "https://razsrkcvecymujfmrzev.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhenNya2N2ZWN5bXVqZm1yemV2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTIwNzAzNCwiZXhwIjoyMDcwNzgzMDM0fQ.oP2KHilItRH1EZ53-eOY_Ihcyt0Kn-paa1U-jAZnUgo";

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Generate random 6-digit ticket ID
function generateTicketId() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Create a new ticket
app.post('/api/tickets', async (req, res) => {
    try {
        const ticketId = generateTicketId();
        const ticketData = {
            ticket_number: ticketId,
            created_at: new Date().toISOString(),
            status: 'active',
            event: 'Fall Formal',
            date: 'November 15, 2024',
            time: '7:00 PM - 11:00 PM',
            location: 'Duncan Hall',
            price: '$12',
            payment_approved: 'pending'
        };
        
        // Save to Supabase database
        const { data, error } = await supabase
            .from('fall_formal_orders')
            .insert([ticketData]);
        
        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to create ticket in database'
            });
        }
        
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
        console.error('Server error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create ticket'
        });
    }
});

// Get ticket by ID
app.get('/api/tickets/:id', async (req, res) => {
    try {
        const ticketId = req.params.id;
        
        // Get ticket from Supabase database
        const { data, error } = await supabase
            .from('fall_formal_orders')
            .select('*')
            .eq('ticket_number', ticketId)
            .single();
        
        if (error || !data) {
            return res.status(404).json({
                success: false,
                error: 'Ticket not found'
            });
        }
        
        res.json({
            success: true,
            ticket: data
        });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve ticket'
        });
    }
});

// Serve ticket page
app.get('/ticket/:id', async (req, res) => {
    try {
        const ticketId = req.params.id;
        
        // Get ticket from Supabase database
        const { data: ticket, error } = await supabase
            .from('fall_formal_orders')
            .select('*')
            .eq('ticket_number', ticketId)
            .single();
        
        if (error || !ticket) {
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

        // Generate QR code for the ticket number
        let qrCodeDataURL;
        try {
            qrCodeDataURL = await QRCode.toDataURL(ticketId, { 
                width: 200,
                margin: 2,
                color: {
                    dark: '#FFFFFF',
                    light: '#000000'
                }
            });
        } catch (qrError) {
            console.error('QR Code generation error:', qrError);
            // Fallback: create a simple text-based QR placeholder
            qrCodeDataURL = 'data:image/svg+xml;base64,' + Buffer.from(`
                <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
                    <rect width="200" height="200" fill="transparent"/>
                    <text x="100" y="100" text-anchor="middle" fill="white" font-family="Arial" font-size="16">QR Code</text>
                    <text x="100" y="120" text-anchor="middle" fill="white" font-family="Arial" font-size="12">${ticketId}</text>
                </svg>
            `).toString('base64');
        }
    
    // Serve the ticket.html page with ticket data
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Fall Formal Ticket #${ticketId}</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                body {
                    min-height: 100vh;
                    background-color: #0e140b;
                    position: relative;
                    overflow-x: hidden;
                    font-family: Arial, sans-serif;
                    padding: 20px;
                }

                .noise-overlay {
                    position: fixed;
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
                    position: relative;
                    z-index: 10;
                    color: white;
                    max-width: 500px;
                    width: 100%;
                    margin: 0 auto;
                }

                .ticket-card {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 16px;
                    padding: 30px;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    backdrop-filter: blur(10px);
                    margin-bottom: 20px;
                }

                .event-title {
                    font-size: 32px;
                    font-weight: 700;
                    margin-bottom: 10px;
                    color: #fff;
                    text-align: center;
                }

                .ticket-id {
                    font-size: 24px;
                    font-weight: 600;
                    margin-bottom: 20px;
                    color: #4CAF50;
                    text-align: center;
                }

                .attendee-name {
                    font-size: 20px;
                    font-weight: 600;
                    margin-bottom: 20px;
                    color: #fff;
                    text-align: center;
                }

                .ticket-type {
                    font-size: 18px;
                    color: #ffd700;
                    margin-bottom: 20px;
                    text-align: center;
                    font-weight: 600;
                }

                .qr-section {
                    text-align: center;
                    margin: 30px 0;
                }

                .qr-code {
                    width: 200px;
                    height: 200px;
                    margin: 0 auto 20px;
                    border-radius: 12px;
                    background: transparent;
                    padding: 10px;
                }
                
                .qr-code img {
                    mix-blend-mode: screen;
                }

                .ticket-details {
                    font-size: 16px;
                    color: rgba(255, 255, 255, 0.8);
                    line-height: 1.6;
                    margin-bottom: 30px;
                    text-align: left;
                }

                .share-section {
                    margin-top: 20px;
                }

                .share-button {
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    border: none;
                    color: white;
                    padding: 15px 30px;
                    border-radius: 25px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    width: 100%;
                    margin-bottom: 10px;
                }

                .share-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
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
                    width: 100%;
                    text-align: center;
                }

                .back-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
                }

                .copy-feedback {
                    background: #4CAF50;
                    color: white;
                    padding: 10px;
                    border-radius: 8px;
                    margin-top: 10px;
                    text-align: center;
                    display: none;
                }

                @media (max-width: 768px) {
                    .container {
                        padding: 10px;
                    }
                    
                    .ticket-card {
                        padding: 20px;
                    }
                    
                    .qr-code {
                        width: 150px;
                        height: 150px;
                    }
                }
            </style>
        </head>
        <body>
            <div class="noise-overlay"></div>
            
            <div class="container">
                <div class="ticket-card">
                    <div class="event-title">Fall Formal</div>
                    <div class="ticket-id">Ticket #${ticket.ticket_number}</div>
                    <div class="attendee-name">${ticket.name || 'Guest'}</div>
                    <div class="ticket-type">Type: ${ticket.ticket_type === 'couple' ? 'Couple (2x)' : 'Single (1x)'}</div>
                    
                    <div class="qr-section">
                        <div class="qr-code">
                            <img src="${qrCodeDataURL}" alt="QR Code" style="width: 100%; height: 100%; object-fit: contain;">
                        </div>
                    </div>
                    
                    <div class="ticket-details">
                        <p><strong>Date:</strong> ${ticket.date || 'November 15, 2024'}</p>
                        <p><strong>Time:</strong> ${ticket.time || '7:00 PM - 11:00 PM'}</p>
                        <p><strong>Location:</strong> ${ticket.location || 'Duncan Hall'}</p>
                        <p><strong>Price:</strong> ${ticket.price || '$12'}</p>
                        <p><strong>Status:</strong> ${ticket.payment_approved || 'pending'}</p>
                    </div>
                    
                    <div class="share-section">
                        ${ticket.ticket_type === 'couple' ? `
                            <button class="share-button" onclick="shareTicket()">Share Ticket With Date</button>
                        ` : ''}
                        <div class="copy-feedback" id="copyFeedback">Ticket Link Copied!</div>
                    </div>
                    
                    <a href="/" class="back-button">Back to Home</a>
                </div>
            </div>

            <script>
                function shareTicket() {
                    const ticketUrl = window.location.href;
                    
                    // Check if it's a mobile device
                    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                        // Mobile sharing
                        if (navigator.share) {
                            navigator.share({
                                title: 'Fall Formal Ticket',
                                text: 'Check out my Fall Formal ticket!',
                                url: ticketUrl
                            }).catch(err => {
                                console.log('Error sharing:', err);
                                copyToClipboard(ticketUrl);
                            });
                        } else {
                            copyToClipboard(ticketUrl);
                        }
                    } else {
                        // Desktop - copy to clipboard
                        copyToClipboard(ticketUrl);
                    }
                }
                
                function copyToClipboard(text) {
                    navigator.clipboard.writeText(text).then(() => {
                        const feedback = document.getElementById('copyFeedback');
                        feedback.style.display = 'block';
                        setTimeout(() => {
                            feedback.style.display = 'none';
                        }, 2000);
                    }).catch(err => {
                        console.log('Error copying to clipboard:', err);
                        // Fallback for older browsers
                        const textArea = document.createElement('textarea');
                        textArea.value = text;
                        document.body.appendChild(textArea);
                        textArea.select();
                        document.execCommand('copy');
                        document.body.removeChild(textArea);
                        
                        const feedback = document.getElementById('copyFeedback');
                        feedback.style.display = 'block';
                        setTimeout(() => {
                            feedback.style.display = 'none';
                        }, 2000);
                    });
                }
            </script>
        </body>
        </html>
    `);
    } catch (error) {
        console.error('Server error:', error);
        console.error('Error details:', error.message);
        console.error('Stack trace:', error.stack);
        res.status(500).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Server Error</title>
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
                <h1>Server Error</h1>
                <p>There was an error retrieving your ticket. Please try again later.</p>
                <p>Error: ${error.message}</p>
                <a href="/" style="color: white;">Back to Home</a>
            </body>
            </html>
        `);
    }
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

app.get('/ticket', (req, res) => {
    res.sendFile(path.join(__dirname, 'ticket.html'));
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
