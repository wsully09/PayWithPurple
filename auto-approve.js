// Auto-approve script that monitors database changes and sends SMS automatically
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = "https://razsrkcvecymujfmrzev.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhenNya2N2ZWN5bXVqZm1yemV2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTIwNzAzNCwiZXhwIjoyMDcwNzgzMDM0fQ.oP2KHilItRH1EZ53-eOY_Ihcyt0Kn-paa1U-jAZnUgo";

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Function to send SMS using Textbelt API
async function sendSMS(phoneNumber, message) {
    try {
        console.log('Sending SMS to:', phoneNumber, 'Message:', message);
        
        const response = await fetch('https://textbelt.com/text', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                phone: phoneNumber,
                message: message,
                key: '45debba6c3c5d9cad3f4c8ca12acb0b88b985490KTZaeiFqRnvU5RonIZArQHyVA'
            })
        });
        
        const result = await response.json();
        console.log('SMS sent:', result);
        return result;
    } catch (error) {
        console.error('Error sending SMS:', error);
        throw error;
    }
}

// Function to get ticket URL
function getTicketUrl(ticketNumber, baseUrl = 'https://paywithpurple-production.up.railway.app') {
    return `${baseUrl}/ticket/${ticketNumber}`;
}

// Function to approve payment and send SMS
async function approvePaymentAndSendSMS(ticketNumber, phoneNumber, baseUrl) {
    try {
        console.log(`Approving payment for ticket ${ticketNumber} and sending SMS to ${phoneNumber}`);
        
        // Update payment status to approved
        const { data, error } = await supabase
            .from('fall_formal_orders')
            .update({ payment_approved: 'approved' })
            .eq('ticket_number', ticketNumber)
            .select()
            .single();
        
        if (error) {
            console.error('Supabase error:', error);
            return { success: false, error: 'Failed to approve payment' };
        }
        
        if (!data) {
            return { success: false, error: 'Ticket not found' };
        }
        
        // Get the ticket URL
        const ticketUrl = getTicketUrl(ticketNumber, baseUrl);
        
        // Send SMS with ticket link
        if (phoneNumber) {
            try {
                const message = `Your Venmo was received. See below for your Fall Formal Ticket: ${ticketUrl}`;
                await sendSMS(phoneNumber, message);
                console.log(`SMS sent successfully for ticket ${ticketNumber}`);
            } catch (smsError) {
                console.error('Error sending SMS:', smsError);
                // Don't fail the payment approval if SMS fails
            }
        }
        
        return {
            success: true,
            message: 'Payment approved and ticket sent',
            ticket_url: ticketUrl
        };
    } catch (error) {
        console.error('Error in approvePaymentAndSendSMS:', error);
        return { success: false, error: error.message };
    }
}

// Function to check for pending payments and approve them
async function checkAndApprovePayments() {
    try {
        console.log('Checking for pending payments...');
        
        // Get all pending payments
        const { data: pendingPayments, error } = await supabase
            .from('fall_formal_orders')
            .select('*')
            .eq('payment_approved', 'pending');
        
        if (error) {
            console.error('Error fetching pending payments:', error);
            return;
        }
        
        if (!pendingPayments || pendingPayments.length === 0) {
            console.log('No pending payments found');
            return;
        }
        
        console.log(`Found ${pendingPayments.length} pending payments`);
        
        // Process each pending payment
        for (const payment of pendingPayments) {
            console.log(`Processing ticket ${payment.ticket_number} for ${payment.name}`);
            
            // Check if we have phone number
            if (!payment.phone_number) {
                console.log(`No phone number for ticket ${payment.ticket_number}, skipping SMS`);
                // Still approve the payment
                await supabase
                    .from('fall_formal_orders')
                    .update({ payment_approved: 'approved' })
                    .eq('ticket_number', payment.ticket_number);
                continue;
            }
            
            // Approve payment and send SMS
            const result = await approvePaymentAndSendSMS(
                payment.ticket_number,
                payment.phone_number,
                'https://paywithpurple-production.up.railway.app'
            );
            
            if (result.success) {
                console.log(`Successfully processed ticket ${payment.ticket_number}`);
            } else {
                console.error(`Failed to process ticket ${payment.ticket_number}:`, result.error);
            }
        }
    } catch (error) {
        console.error('Error in checkAndApprovePayments:', error);
    }
}

// Main function to run the auto-approval process
async function runAutoApproval() {
    console.log('Starting auto-approval process...');
    
    // Run immediately
    await checkAndApprovePayments();
    
    // Check every 1 second for the first 2 minutes (120 seconds)
    console.log('Starting high-frequency monitoring (every 1 second for 2 minutes)...');
    const highFrequencyInterval = setInterval(checkAndApprovePayments, 1000);
    
    // After 2 minutes, switch to every 30 seconds
    setTimeout(() => {
        console.log('Switching to standard monitoring (every 30 seconds)...');
        clearInterval(highFrequencyInterval);
        
        // Start the standard 30-second interval
        setInterval(checkAndApprovePayments, 30000);
    }, 120000); // 2 minutes = 120,000 milliseconds
}

// Export functions for use in other modules
module.exports = {
    approvePaymentAndSendSMS,
    checkAndApprovePayments,
    runAutoApproval
};

// If this script is run directly, start the auto-approval process
if (require.main === module) {
    runAutoApproval().catch(console.error);
}
