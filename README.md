# PayWithPurple Backend

A simple Node.js backend for ticket generation and validation.

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm start
```

For development with auto-restart:
```bash
npm run dev
```

### 3. Access the Application
- **Main site**: http://localhost:3000
- **Ticket Generator**: http://localhost:3000/ticket-generator.html
- **Example Ticket**: http://localhost:3000/ticket/123456

## How It Works

### Backend Features:
- **POST /api/tickets** - Creates a new ticket with random 6-digit ID
- **GET /api/tickets/:id** - Retrieves ticket data by ID
- **GET /ticket/:id** - Serves the ticket page with full details
- **In-memory storage** - Tickets stored in server memory (resets on restart)

### Frontend Features:
- **Ticket Generator** - Creates real tickets via API calls
- **Real URLs** - Generated URLs actually work and show ticket details
- **Copy to Clipboard** - Easy sharing of ticket URLs

## API Endpoints

### Create Ticket
```bash
POST /api/tickets
```
Response:
```json
{
  "success": true,
  "ticket": {
    "id": "395722",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "status": "active",
    "event": "Fall Formal",
    "date": "November 15, 2024",
    "time": "7:00 PM - 11:00 PM",
    "location": "Duncan Hall",
    "price": "$12"
  },
  "url": "http://localhost:3000/ticket/395722"
}
```

### Get Ticket
```bash
GET /api/tickets/395722
```
Response:
```json
{
  "success": true,
  "ticket": { ... }
}
```

## Production Deployment

For production, you'll want to:
1. Use a real database (MongoDB, PostgreSQL, etc.)
2. Add authentication/authorization
3. Add ticket validation logic
4. Deploy to a cloud service (Heroku, AWS, etc.)

## File Structure
```
├── server.js              # Express server
├── package.json           # Dependencies
├── ticket-generator.html   # Frontend ticket generator
├── index.html             # Main page
└── README.md              # This file
```
