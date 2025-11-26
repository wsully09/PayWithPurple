const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const QRCode = require('qrcode');

const app = express();
const PORT = process.env.PORT || 8080;

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
    return Math.floor(100000 + Math.random() * 900000);
}

// Get event configuration from Supabase
async function getEventConfig() {
    try {
        const { data, error } = await supabase
            .from('event_config')
            .select('*')
            .single();
        
        if (error) {
            console.error('Error fetching event config:', error);
            // Return default config if table doesn't exist or has no data
            return {
                event_name: 'Winter Formal',
                event_date: 'November 15, 2024',
                event_time: '7:00 PM - 11:00 PM',
                event_location: 'Duncan Hall',
                event_price: '$12',
                event_address: '825 East Washington Street',
                brand_name: 'Duncan Winter Formal'
            };
        }
        
        return data;
    } catch (error) {
        console.error('Error in getEventConfig:', error);
        // Return default config on error
        return {
            event_name: 'Winter Formal',
            event_date: 'November 15, 2024',
            event_time: '7:00 PM - 11:00 PM',
            event_location: 'Duncan Hall',
            event_price: '$12',
            event_address: '825 East Washington Street',
            brand_name: 'Duncan Winter Formal'
        };
    }
}

// Get event configuration
app.get('/api/event-config', async (req, res) => {
    try {
        const config = await getEventConfig();
        res.json({
            success: true,
            config: config
        });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve event configuration'
        });
    }
});

// Update event configuration
app.put('/api/event-config', async (req, res) => {
    try {
        const { event_name, event_date, event_time, event_location, event_price, event_address, brand_name } = req.body;
        
        // Update or insert the configuration
        const { data, error } = await supabase
            .from('event_config')
            .upsert([{
                id: 1, // Use a fixed ID for the single config record
                event_name,
                event_date,
                event_time,
                event_location,
                event_price,
                event_address,
                brand_name,
                updated_at: new Date().toISOString()
            }], {
                onConflict: 'id'
            });
        
        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to update event configuration'
            });
        }
        
        res.json({
            success: true,
            message: 'Event configuration updated successfully'
        });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update event configuration'
        });
    }
});

// Create a new ticket
app.post('/api/tickets', async (req, res) => {
    try {
        const ticketId = generateTicketId();
        const eventConfig = await getEventConfig();
        
        const ticketData = {
            ticket_number: ticketId,
            created_at: new Date().toISOString(),
            status: 'active',
            event: eventConfig.event_name,
            date: eventConfig.event_date,
            time: eventConfig.event_time,
            location: eventConfig.event_location,
            price: eventConfig.event_price,
            payment_approved: 'pending',
            name: req.body.name || null,
            ticket_type: req.body.ticket_type || 'single'
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
        
        // Try to get ticket from winter_formal_orders first
        let { data, error } = await supabase
            .from('winter_formal_orders')
            .select('*')
            .eq('ticket_number', ticketId)
            .single();
        
        // If not found in winter_formal_orders, try fall_formal_orders
        if (error || !data) {
            const { data: fallData, error: fallError } = await supabase
                .from('fall_formal_orders')
                .select('*')
                .eq('ticket_number', ticketId)
                .single();
            
            if (fallError || !fallData) {
                return res.status(404).json({
                    success: false,
                    error: 'Ticket not found'
                });
            }
            
            data = fallData;
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

// Get all orders from fall_formal_orders table
app.get('/api/orders', async (req, res) => {
    try {
        console.log('Attempting to fetch orders from fall_formal_orders table...');
        
        const { data, error } = await supabase
            .from('fall_formal_orders')
            .select('*')
            .order('timestamp', { ascending: false });
        
        if (error) {
            console.error('Supabase error details:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });
            
            // If table doesn't exist, return empty array instead of error
            if (error.code === 'PGRST116' || error.message.includes('relation "fall_formal_orders" does not exist')) {
                console.log('fall_formal_orders table does not exist, returning empty array');
                return res.json({
                    success: true,
                    orders: []
                });
            }
            
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch orders',
                details: error.message
            });
        }
        
        console.log(`Successfully fetched ${data ? data.length : 0} orders`);
        res.json({
            success: true,
            orders: data || []
        });
    } catch (error) {
        console.error('Server error in /api/orders:', {
            message: error.message,
            stack: error.stack
        });
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve orders',
            details: error.message
        });
    }
});

// Approve payment and send ticket
app.post('/api/approve-payment', async (req, res) => {
    try {
        const { ticket_number, phone_number } = req.body;
        
        if (!ticket_number) {
            return res.status(400).json({
                success: false,
                error: 'Ticket number is required'
            });
        }
        
        // Try to update payment status in winter_formal_orders first
        let { data, error } = await supabase
            .from('winter_formal_orders')
            .update({ payment_approved: 'approved' })
            .eq('ticket_number', ticket_number)
            .select()
            .single();
        
        // If not found in winter_formal_orders, try fall_formal_orders
        if (error || !data) {
            // Check if it's a "not found" error (PGRST116) or if data is null
            const isNotFoundError = error?.code === 'PGRST116' || error?.message?.includes('No rows found') || !data;
            
            if (isNotFoundError) {
                // Try fall_formal_orders
                const { data: fallData, error: fallError } = await supabase
                    .from('fall_formal_orders')
                    .update({ payment_approved: 'approved' })
                    .eq('ticket_number', ticket_number)
                    .select()
                    .single();
                
                if (fallError) {
                    // If it's also a "not found" error, return 404
                    if (fallError.code === 'PGRST116' || fallError.message?.includes('No rows found')) {
                        return res.status(404).json({
                            success: false,
                            error: 'Ticket not found'
                        });
                    }
                    // Otherwise, it's a real error
                    console.error('Supabase error:', fallError);
                    return res.status(500).json({
                        success: false,
                        error: 'Failed to approve payment'
                    });
                }
                
                if (!fallData) {
                    return res.status(404).json({
                        success: false,
                        error: 'Ticket not found'
                    });
                }
                
                data = fallData;
            } else {
                // It's a real error from winter_formal_orders, not just "not found"
                console.error('Supabase error:', error);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to approve payment'
                });
            }
        }
        
        // Get the base URL for the ticket
        const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
        const host = req.headers['x-forwarded-host'] || req.headers.host || 'paywithpurple-production.up.railway.app';
        const baseUrl = `${protocol}://${host}`;
        const ticketUrl = `${baseUrl}/ticket/${ticket_number}`;
        
        // Send SMS with ticket link if phone number is provided
        if (phone_number) {
            try {
                const message = `Your Venmo was received. See below for your Winter Formal Ticket: ${ticketUrl}`;
                
                // Use Textbelt API to send SMS
                const smsResponse = await fetch('https://textbelt.com/text', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        phone: phone_number,
                        message: message,
                        key: '45debba6c3c5d9cad3f4c8ca12acb0b88b985490KTZaeiFqRnvU5RonIZArQHyVA'
                    })
                });
                
                const smsResult = await smsResponse.json();
                console.log('SMS sent:', smsResult);
            } catch (smsError) {
                console.error('Error sending SMS:', smsError);
                // Don't fail the payment approval if SMS fails
            }
        }
        
        
        res.json({
            success: true,
            message: 'Payment approved and ticket sent',
            ticket_url: ticketUrl
        });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to approve payment'
        });
    }
});

// Serve ticket page
app.get('/ticket/:id', async (req, res) => {
    try {
        const ticketId = req.params.id;
        
        // Try to get ticket from winter_formal_orders first
        let { data: ticket, error } = await supabase
            .from('winter_formal_orders')
            .select('*')
            .eq('ticket_number', ticketId)
            .single();
        
        // If not found in winter_formal_orders, try fall_formal_orders
        if (error || !ticket) {
            const { data: fallTicket, error: fallError } = await supabase
                .from('fall_formal_orders')
                .select('*')
                .eq('ticket_number', ticketId)
                .single();
            
            if (fallError || !fallTicket) {
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
            
            ticket = fallTicket;
        }

        // Get current event configuration for dynamic display
        const eventConfig = await getEventConfig();

        // Generate QR code for the ticket number
        let qrCodeDataURL;
        try {
            qrCodeDataURL = await QRCode.toDataURL(`https://duncancompound.org/scan?t=${ticketId}`, { 
                width: 200,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });
        } catch (qrError) {
            console.error('QR Code generation error:', qrError);
            // Fallback: create a simple text-based QR placeholder
            qrCodeDataURL = 'data:image/svg+xml;base64,' + Buffer.from(`
                <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
                    <rect width="200" height="200" fill="white"/>
                    <text x="100" y="100" text-anchor="middle" fill="black" font-family="Arial" font-size="16">QR Code</text>
                    <text x="100" y="120" text-anchor="middle" fill="black" font-family="Arial" font-size="12">${ticketId}</text>
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
            <title>Winter Formal Ticket #${ticketId}</title>
            <link rel="icon" type="image/x-icon" href="/favicons/favicon.ico">
            <link rel="icon" type="image/png" sizes="32x32" href="/favicons/favicon-32x32.png">
            <link rel="icon" type="image/png" sizes="16x16" href="/favicons/favicon-16x16.png">
            <link rel="apple-touch-icon" sizes="180x180" href="/favicons/apple-touch-icon.png">
            <link rel="manifest" href="/favicons/site.webmanifest">
            <style>
                :root {
                    --black: #000000;
                }

                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                    font-family: "Inter", sans-serif;
                }

                body {
                    height: 100vh;
                    background-color: #000000; /* Black background */
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-start;
                    align-items: center;
                    padding-top: 20px;
                }

                .container {
                    background-color: white;
                    margin: 0;
                    padding: 20px 20px 0px 20px;
                    max-width: 400px;
                    width: calc(100% - 40px);
                    height: 520px;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                    border-radius: 10px;
                    box-sizing: border-box;
                    position: relative;
                }

                [flex] {
                    display: flex;
                }

                [row] {
                    flex-direction: row;
                }

                [column] {
                    flex-direction: column;
                }

                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }

                .brand {
                    font-weight: bold;
                    font-size: 18px;
                    color: #08192c;
                }

                .address {
                    font-size: 12px;
                    color: #747474;
                    margin-top: 5px;
                }

                .ticket-info {
                    text-align: right;
                }

                .ticket-label {
                    font-size: 12px;
                    color: #747474;
                    font-weight: bold;
                }

                .ticket-number {
                    font-size: 18px;
                    font-weight: bold;
                    color: var(--black);
                }

                .placeholder-image {
                    width: calc(100% + 40px);
                    margin: 15px -20px 20px -20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .banner-image {
                    width: 100%;
                    height: auto;
                    display: block;
                    pointer-events: none;
                    user-select: none;
                    -webkit-user-select: none;
                    -moz-user-select: none;
                    -ms-user-select: none;
                }

                .info-section {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 20px;
                    position: relative;
                    z-index: 10;
                }

                .info-group {
                    display: flex;
                    flex-direction: column;
                }

                .info-label {
                    font-size: 12px;
                    color: #08192c;
                    font-weight: bold;
                    margin-bottom: 5px;
                }

                .info-value {
                    font-size: 16px;
                    color: var(--black);
                    font-weight: 500;
                }

                .qr-section {
                    position: absolute;
                    bottom: 5px;
                    left: 50%;
                    transform: translateX(-50%);
                    z-index: 1;
                }

                .qr-code {
                    width: 150px;
                    height: 150px;
                    border-radius: 8px;
                    pointer-events: none;
                    user-select: none;
                    -webkit-user-select: none;
                    -moz-user-select: none;
                    -ms-user-select: none;
                }

                .qr-placeholder {
                    width: 150px;
                    height: 150px;
                    background-color: white;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    color: #666;
                    user-select: none;
                    
                }

                .share-section {
                    margin-top: 20px;
                    text-align: center;
                }

                .share-button {
                    background: white;
                    color: black;
                    border: 1px solid white;
                    padding: 12px 24px;
                    border-radius: 25px;
                    font-size: 14px;
                    cursor: pointer;
                    margin-bottom: 10px;
                }

                .share-button:hover {
                    background: #f5f5f5;
                }

            </style>
        </head>
        <body>
            <div class="container">
                <div flex row class="header">
                    <!--in top left corner-->
                    <div flex column class="brand-section">
                        <div class="brand">${eventConfig.brand_name}</div>
                        <div class="address">
                            <a href="https://m.uber.com/looking/?pickup=my_location&drop[0]=%7B%22latitude%22%3A41.676667%2C%22longitude%22%3A-86.238611%2C%22addressLine1%22%3A%22825%20E%20Washington%20St%22%2C%22addressLine2%22%3A%22South%20Bend%2C%20IN%2046617%22%7D" target="_blank" style="color: #747474; text-decoration: underline;">${eventConfig.event_address}</a>
                        </div>
                    </div>
                    <!--in top right corner, flex column-->
                    <div flex column class="ticket-info">
                        <div class="ticket-label">TICKET</div>
                        <div class="ticket-number">${ticket.ticket_number}</div>
                    </div>
                </div>
                
                <!--image banner, width of container with proper aspect ratio-->
                <div class="placeholder-image">
                    <img src="/image-banner2.png" alt="Banner Image" class="banner-image">
                </div>
                
                <div flex row class="info-section">
                    <!--align to left side-->
                    <div flex column class="info-group">
                        <div class="info-label">NAME</div>
                        <div class="info-value">${ticket.name || 'Guest'}</div>
                    </div>
                    <div flex column class="info-group">
                        <div class="info-label">TYPE</div>
                        <div class="info-value">${ticket.ticket_type === 'couple' ? 'Couple (2x)' : ticket.ticket_type === 'single' ? 'Single (1x)' : ticket.ticket_type}</div>
                    </div>
                </div>
                
                <div class="qr-section">
                    <div class="qr-placeholder">
                        <img src="${qrCodeDataURL}" alt="QR Code" class="qr-code">
                    </div>
                </div>
            </div>
            
            ${ticket.ticket_type === 'couple' ? `
                <div class="share-section">
                    <button class="share-button" id="shareButton" onclick="shareTicket()">Share Ticket With Date</button>
                </div>
            ` : ''}

            <script>
                function shareTicket() {
                    const ticketUrl = window.location.href;
                    
                    // Check if it's a mobile device (excluding iPhone)
                    if (/Android|webOS|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                        // Mobile sharing (non-iPhone)
                        if (navigator.share) {
                            navigator.share({
                                url: ticketUrl
                            }).catch(err => {
                                console.log('Error sharing:', err);
                                copyToClipboard(ticketUrl);
                            });
                        } else {
                            copyToClipboard(ticketUrl);
                        }
                    } else {
                        // Desktop or iPhone - copy to clipboard
                        copyToClipboard(ticketUrl);
                    }
                }
                
                function copyToClipboard(text) {
                    navigator.clipboard.writeText(text).then(() => {
                        const button = document.getElementById('shareButton');
                        const originalText = button.textContent;
                        button.textContent = 'Ticket Link Copied!';
                        setTimeout(() => {
                            button.textContent = originalText;
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
                        
                        const button = document.getElementById('shareButton');
                        const originalText = button.textContent;
                        button.textContent = 'Ticket Link Copied!';
                        setTimeout(() => {
                            button.textContent = originalText;
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

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/all-ordered-tickets', (req, res) => {
    res.sendFile(path.join(__dirname, 'all-ordered-tickets.html'));
});

app.get('/formal', (req, res) => {
    res.sendFile(path.join(__dirname, 'formal.html'));
});

app.get('/scan', (req, res) => {
    res.sendFile(path.join(__dirname, 'scan.html'));
});

// Serve static files for specific assets only (CSS, JS, images, etc.)
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/favicons', express.static(path.join(__dirname, 'favicons5')));
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
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`Ticket generator: http://localhost:${PORT}/ticket-generator`);
    console.log(`Railway ticket generator: http://localhost:${PORT}/ticket-generator-railway`);
    console.log(`Send page: http://localhost:${PORT}/send`);
    console.log(`QR Scanner: http://localhost:${PORT}/qr-code-scanner`);
    console.log(`Formal page: http://localhost:${PORT}/formal`);
});
