-- Phase 9: Clerk Authentication & RLS Policies
-- Migration: 20250901_004_clerk_rls_policies

-- Create users table for Clerk integration
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, -- Clerk user ID
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'recruiter')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_sign_in TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::JSONB
);

-- Create profiles table for extended user information
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    phone TEXT,
    linkedin_url TEXT,
    github_url TEXT,
    website_url TEXT,
    bio TEXT,
    location TEXT,
    skills TEXT[],
    experience_years INTEGER,
    current_position TEXT,
    current_company TEXT,
    preferences JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Add user_id to existing tables for RLS
ALTER TABLE offers ADD COLUMN IF NOT EXISTS created_by_user_id TEXT REFERENCES users(id);
ALTER TABLE offer_enrichment ADD COLUMN IF NOT EXISTS created_by_user_id TEXT REFERENCES users(id);
ALTER TABLE offer_embeddings ADD COLUMN IF NOT EXISTS created_by_user_id TEXT REFERENCES users(id);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE offer_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE offer_enrichment ENABLE ROW LEVEL SECURITY;
ALTER TABLE offer_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE offer_embeddings_log ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user ID from JWT
CREATE OR REPLACE FUNCTION auth.user_id() RETURNS TEXT AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::json->>'sub', '')::TEXT;
$$ LANGUAGE SQL STABLE;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION auth.is_admin() RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::json->'user_metadata'->>'role')::TEXT = 'admin',
    false
  );
$$ LANGUAGE SQL STABLE;

-- RLS Policies for users table
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (id = auth.user_id());

DROP POLICY IF EXISTS "Users can update their own profile" ON users;
CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (id = auth.user_id());

DROP POLICY IF EXISTS "Admins can view all users" ON users;
CREATE POLICY "Admins can view all users" ON users
    FOR ALL USING (auth.is_admin());

-- RLS Policies for user_profiles table
DROP POLICY IF EXISTS "Users can manage their own profile" ON user_profiles;
CREATE POLICY "Users can manage their own profile" ON user_profiles
    FOR ALL USING (user_id = auth.user_id());

DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR SELECT USING (auth.is_admin());

-- RLS Policies for offers table (public read, admin write)
DROP POLICY IF EXISTS "Anyone can view active offers" ON offers;
CREATE POLICY "Anyone can view active offers" ON offers
    FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "Admins can manage offers" ON offers;
CREATE POLICY "Admins can manage offers" ON offers
    FOR ALL USING (auth.is_admin());

-- RLS Policies for companies table (public read, admin write)
DROP POLICY IF EXISTS "Anyone can view companies" ON companies;
CREATE POLICY "Anyone can view companies" ON companies
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage companies" ON companies;
CREATE POLICY "Admins can manage companies" ON companies
    FOR ALL USING (auth.is_admin());

-- RLS Policies for locations table (public read, admin write)
DROP POLICY IF EXISTS "Anyone can view locations" ON locations;
CREATE POLICY "Anyone can view locations" ON locations
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage locations" ON locations;
CREATE POLICY "Admins can manage locations" ON locations
    FOR ALL USING (auth.is_admin());

-- RLS Policies for offer_sources table (admin only)
DROP POLICY IF EXISTS "Admins can manage offer sources" ON offer_sources;
CREATE POLICY "Admins can manage offer sources" ON offer_sources
    FOR ALL USING (auth.is_admin());

-- RLS Policies for offer_enrichment table (admin only)
DROP POLICY IF EXISTS "Admins can manage enrichments" ON offer_enrichment;
CREATE POLICY "Admins can manage enrichments" ON offer_enrichment
    FOR ALL USING (auth.is_admin());

-- RLS Policies for offer_embeddings table (admin only)
DROP POLICY IF EXISTS "Admins can manage embeddings" ON offer_embeddings;
CREATE POLICY "Admins can manage embeddings" ON offer_embeddings
    FOR ALL USING (auth.is_admin());

-- RLS Policies for offer_embeddings_log table (admin only)
DROP POLICY IF EXISTS "Admins can view embedding logs" ON offer_embeddings_log;
CREATE POLICY "Admins can view embedding logs" ON offer_embeddings_log
    FOR SELECT USING (auth.is_admin());

-- Function to handle user creation/update from Clerk webhook
CREATE OR REPLACE FUNCTION handle_clerk_user_created()
RETURNS TRIGGER AS $$
BEGIN
    -- Update last_sign_in timestamp
    NEW.last_sign_in = NOW();
    
    -- Ensure we have a user profile
    INSERT INTO user_profiles (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user creation/update
DROP TRIGGER IF EXISTS on_clerk_user_created ON users;
CREATE TRIGGER on_clerk_user_created
    BEFORE INSERT OR UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION handle_clerk_user_created();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_offers_created_by_user_id ON offers(created_by_user_id);

-- Grant necessary permissions
GRANT ALL ON users TO anon, authenticated;
GRANT ALL ON user_profiles TO anon, authenticated;

-- Add helpful comments
COMMENT ON TABLE users IS 'Users table for Clerk authentication integration';
COMMENT ON TABLE user_profiles IS 'Extended user profile information';
COMMENT ON FUNCTION auth.user_id IS 'Get current user ID from Clerk JWT';
COMMENT ON FUNCTION auth.is_admin IS 'Check if current user has admin role';

-- Create function to sync user from Clerk
CREATE OR REPLACE FUNCTION sync_clerk_user(
    clerk_user_id TEXT,
    user_email TEXT,
    user_full_name TEXT DEFAULT NULL,
    user_role TEXT DEFAULT 'user'
)
RETURNS users AS $$
DECLARE
    user_record users;
BEGIN
    INSERT INTO users (id, email, full_name, role, last_sign_in)
    VALUES (clerk_user_id, user_email, user_full_name, user_role, NOW())
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, users.full_name),
        role = COALESCE(EXCLUDED.role, users.role),
        last_sign_in = NOW(),
        updated_at = NOW()
    RETURNING * INTO user_record;
    
    RETURN user_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Final validation
DO $$
BEGIN
    -- Verify RLS is enabled on critical tables
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'users' AND n.nspname = 'public' AND c.relrowsecurity = true
    ) THEN
        RAISE EXCEPTION 'RLS not enabled on users table';
    END IF;
    
    RAISE NOTICE 'Phase 9 Clerk Authentication & RLS implementation completed successfully!';
END $$;