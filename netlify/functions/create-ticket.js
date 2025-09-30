exports.handler = async (event, context) => {
    // Handle both GET and POST requests
    if (event.httpMethod === 'GET') {
        // Handle GET request for ticket page
        const path = event.path;
        const ticketId = path.split('/ticket/')[1];
        
        if (!ticketId) {
            return {
                statusCode: 404,
                body: 'Ticket not found'
            };
        }

        // Return the ticket page HTML with the ticket ID
        const ticketPageHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fall Formal Ticket #${ticketId}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Literata:ital,opsz,wght@0,7..72,200..900;1,7..72,200..900&display=swap" rel="stylesheet">
    
    <style>
        :root {
            --dark-green: #12271d;
            --white: #ffffff;
        }

        body {
            margin: 0;
            padding: 0;
            background-color: var(--dark-green);
            font-family: "Inter", sans-serif;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            position: relative;
            overflow: hidden;
        }

        .noise-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background-image: url('noise-light.png');
            background-repeat: repeat;
            opacity: 0.3;
            pointer-events: none;
            z-index: 1;
        }

        .ticket-container {
            text-align: center;
            max-width: 400px;
            padding: 20px 15px;
            position: relative;
            z-index: 10;
            margin: 0 auto;
            width: 100%;
            box-sizing: border-box;
        }

        .ticket-title {
            font-family: "Literata", serif;
            font-size: 28px;
            color: white;
            line-height: 1.3;
            margin-bottom: 20px;
        }

        .ticket-details {
            background-color: rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 30px;
            text-align: left;
        }

        .ticket-detail-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding: 10px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }

        .ticket-detail-row:last-child {
            margin-bottom: 0;
            border-bottom: none;
        }

        .ticket-detail-label {
            font-size: 14px;
            color: white;
            opacity: 0.8;
        }

        .ticket-detail-value {
            font-size: 16px;
            color: white;
            font-weight: 600;
        }

        .ticket-id {
            font-size: 24px;
            color: white;
            font-weight: bold;
            margin: 20px 0;
            padding: 15px;
            background-color: rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            border: 2px solid rgba(255, 255, 255, 0.3);
        }

        .instructions {
            font-size: 14px;
            color: white;
            opacity: 0.8;
            line-height: 1.5;
            margin-bottom: 30px;
        }

        .back-button {
            background-color: transparent;
            color: white;
            border: 1px solid white;
            padding: 12px 30px;
            font-size: 16px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 500;
            font-family: "Inter", sans-serif;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
        }

        .back-button:hover {
            background-color: rgba(255, 255, 255, 0.1);
        }
    </style>
</head>
<body>
    <div class="noise-overlay"></div>
    
    <div class="ticket-container">
        <div class="ticket-title">Your Fall Formal Ticket</div>
        
        <div class="ticket-id">Ticket #${ticketId}</div>
        
        <div class="ticket-details">
            <div class="ticket-detail-row">
                <span class="ticket-detail-label">Event</span>
                <span class="ticket-detail-value">Fall Formal</span>
            </div>
            <div class="ticket-detail-row">
                <span class="ticket-detail-label">Date</span>
                <span class="ticket-detail-value">November 15, 2024</span>
            </div>
            <div class="ticket-detail-row">
                <span class="ticket-detail-label">Time</span>
                <span class="ticket-detail-value">7:00 PM - 11:00 PM</span>
            </div>
            <div class="ticket-detail-row">
                <span class="ticket-detail-label">Location</span>
                <span class="ticket-detail-value">Duncan Hall</span>
            </div>
        </div>
        
        <div class="instructions">
            Please show this ticket at the event entrance. Your ticket has been saved and you can return to this page anytime.
        </div>
        
        <a href="/" class="back-button">Back to Home</a>
    </div>
</body>
</html>`;

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'text/html',
                'Access-Control-Allow-Origin': '*'
            },
            body: ticketPageHtml
        };
    }

    // Handle POST requests (original functionality)
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        // Generate random 6-digit ticket ID
        const ticketId = Math.floor(100000 + Math.random() * 900000).toString();
        
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

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: JSON.stringify({
                success: true,
                ticket: ticketData,
                url: `${event.headers.origin}/ticket/${ticketId}`
            })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to create ticket' })
        };
    }
};
