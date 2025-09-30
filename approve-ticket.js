#!/usr/bin/env node

// Script to manually approve a specific ticket and send SMS
const { approvePaymentAndSendSMS } = require('./auto-approve');

// Get command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
    console.log('Usage: node approve-ticket.js <ticket_number> <phone_number>');
    console.log('Example: node approve-ticket.js 12345 9179006733');
    process.exit(1);
}

const ticketNumber = args[0];
const phoneNumber = args[1];

console.log(`Approving ticket ${ticketNumber} and sending SMS to ${phoneNumber}...`);

approvePaymentAndSendSMS(ticketNumber, phoneNumber, 'https://paywithpurple-production.up.railway.app')
    .then(result => {
        if (result.success) {
            console.log('✅ Success!', result.message);
            console.log('🎫 Ticket URL:', result.ticket_url);
        } else {
            console.error('❌ Error:', result.error);
        }
    })
    .catch(error => {
        console.error('❌ Error:', error.message);
    });
