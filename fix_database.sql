-- Fix for existing database tables
-- Run this in your Supabase SQL Editor

-- Add missing results_count column to search_history table
ALTER TABLE search_history 
ADD COLUMN IF NOT EXISTS results_count INTEGER DEFAULT 0;

-- Update existing records to have a default results_count
UPDATE search_history 
SET results_count = 0 
WHERE results_count IS NULL;

-- Verify the table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'search_history' 
ORDER BY ordinal_position;

-- Test query to make sure everything works
SELECT 
    id,
    query,
    results_count,
    created_at
FROM search_history 
LIMIT 5;
