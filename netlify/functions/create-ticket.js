exports.handler = async (event, context) => {
    // Only allow POST requests
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
