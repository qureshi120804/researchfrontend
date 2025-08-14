-- Database setup for Research Assistant AI
-- Run this in your Supabase SQL Editor

-- Drop existing tables if they exist (WARNING: This will delete all data)
DROP TABLE IF EXISTS articles CASCADE;
DROP TABLE IF EXISTS search_history CASCADE;

-- Create search_history table with proper structure
CREATE TABLE search_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    results_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create articles table with proper structure
CREATE TABLE articles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    search_id UUID REFERENCES search_history(id) ON DELETE CASCADE,
    title TEXT,
    url TEXT,
    snippet TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_search_history_user_id ON search_history(user_id);
CREATE INDEX idx_search_history_created_at ON search_history(created_at);
CREATE INDEX idx_articles_search_id ON articles(search_id);

-- Enable Row Level Security (RLS)
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for search_history
CREATE POLICY "Users can view their own search history" ON search_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own search history" ON search_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own search history" ON search_history
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own search history" ON search_history
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for articles
CREATE POLICY "Users can view articles from their searches" ON articles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM search_history 
            WHERE search_history.id = articles.search_id 
            AND search_history.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert articles for their searches" ON articles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM search_history 
            WHERE search_history.id = articles.search_id 
            AND search_history.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update articles from their searches" ON articles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM search_history 
            WHERE search_history.id = articles.search_id 
            AND search_history.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete articles from their searches" ON articles
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM search_history 
            WHERE search_history.id = articles.search_id 
            AND search_history.user_id = auth.uid()
        )
    );

-- Grant necessary permissions
GRANT ALL ON search_history TO authenticated;
GRANT ALL ON articles TO authenticated;

-- Insert some sample data for testing (optional)
-- INSERT INTO search_history (user_id, query, results_count) VALUES 
-- ('your-user-id-here', 'Machine Learning Algorithms', 5),
-- ('your-user-id-here', 'AI Ethics', 3);

-- Verify the setup
SELECT 'Tables created successfully!' as status;
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('search_history', 'articles')
ORDER BY table_name, ordinal_position;
