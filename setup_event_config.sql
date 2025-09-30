-- Create event_config table in Supabase
-- Run this SQL in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS event_config (
    id SERIAL PRIMARY KEY,
    event_name TEXT NOT NULL DEFAULT 'Fall Formal',
    event_date TEXT NOT NULL DEFAULT 'November 15, 2024',
    event_time TEXT NOT NULL DEFAULT '7:00 PM - 11:00 PM',
    event_location TEXT NOT NULL DEFAULT 'Duncan Hall',
    event_price TEXT NOT NULL DEFAULT '$12',
    event_address TEXT NOT NULL DEFAULT '825 East Washington Street',
    brand_name TEXT NOT NULL DEFAULT 'Duncan Fall Formal',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default configuration
INSERT INTO event_config (
    event_name,
    event_date,
    event_time,
    event_location,
    event_price,
    event_address,
    brand_name
) VALUES (
    'Fall Formal',
    'November 15, 2024',
    '7:00 PM - 11:00 PM',
    'Duncan Hall',
    '$12',
    '825 East Washington Street',
    'Duncan Fall Formal'
) ON CONFLICT DO NOTHING;

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_event_config_updated_at 
    BEFORE UPDATE ON event_config 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions (adjust based on your Supabase setup)
-- ALTER TABLE event_config ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow public read access" ON event_config FOR SELECT USING (true);
-- CREATE POLICY "Allow service role full access" ON event_config FOR ALL USING (true);
