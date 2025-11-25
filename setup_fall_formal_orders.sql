-- Create fall_formal_orders table in Supabase
-- Run this SQL in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS fall_formal_orders (
    ticket_number INT8 PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'active',
    event TEXT,
    date TEXT,
    time TEXT,
    location TEXT,
    price TEXT,
    payment_approved TEXT DEFAULT 'pending',
    name TEXT,
    ticket_type TEXT DEFAULT 'single',
    phone_number TEXT,
    email TEXT,
    expected_amount DECIMAL(10,2),
    venmo_amount DECIMAL(10,2),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_fall_formal_orders_ticket_number ON fall_formal_orders(ticket_number);
CREATE INDEX IF NOT EXISTS idx_fall_formal_orders_payment_approved ON fall_formal_orders(payment_approved);
CREATE INDEX IF NOT EXISTS idx_fall_formal_orders_created_at ON fall_formal_orders(created_at);

-- Grant necessary permissions (adjust based on your Supabase setup)
-- Note: You may need to adjust these based on your Supabase RLS policies
-- ALTER TABLE fall_formal_orders ENABLE ROW LEVEL SECURITY;

-- Example policies (uncomment and modify as needed):
-- CREATE POLICY "Allow public read access" ON fall_formal_orders FOR SELECT USING (true);
-- CREATE POLICY "Allow service role full access" ON fall_formal_orders FOR ALL USING (true);
-- CREATE POLICY "Allow insert for ticket creation" ON fall_formal_orders FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Allow update for payment approval" ON fall_formal_orders FOR UPDATE USING (true);
