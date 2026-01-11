-- ==========================================
-- QUESTMAP DATABASE SCHEMA FOR SUPABASE
-- ==========================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ==========================================
-- USERS TABLE
-- ==========================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  total_xp INTEGER DEFAULT 0,
  food_xp INTEGER DEFAULT 0,
  outdoors_xp INTEGER DEFAULT 0,
  fitness_xp INTEGER DEFAULT 0,
  culture_xp INTEGER DEFAULT 0,
  completed_quests INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster username lookups
CREATE INDEX idx_users_username ON users(username);

-- ==========================================
-- CIRCLES TABLE
-- ==========================================
CREATE TABLE circles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  xp_multiplier DECIMAL(3,2) DEFAULT 1.25,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- CIRCLE MEMBERS TABLE
-- ==========================================
CREATE TABLE circle_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  circle_id UUID REFERENCES circles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(circle_id, user_id)
);

-- Index for faster circle member lookups
CREATE INDEX idx_circle_members_user ON circle_members(user_id);
CREATE INDEX idx_circle_members_circle ON circle_members(circle_id);

-- ==========================================
-- FRIENDSHIPS TABLE
-- ==========================================
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

-- Indexes for faster friendship lookups
CREATE INDEX idx_friendships_user ON friendships(user_id);
CREATE INDEX idx_friendships_friend ON friendships(friend_id);
CREATE INDEX idx_friendships_status ON friendships(status);

-- ==========================================
-- COMPLETIONS TABLE
-- ==========================================
CREATE TABLE completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  quest_name TEXT NOT NULL,
  badge TEXT NOT NULL CHECK (badge IN ('food', 'outdoors', 'fitness', 'culture')),
  xp_gained INTEGER NOT NULL,
  photo_url TEXT,
  circle_id UUID REFERENCES circles(id) ON DELETE SET NULL,
  location GEOGRAPHY(POINT),
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster completion queries
CREATE INDEX idx_completions_user ON completions(user_id);
CREATE INDEX idx_completions_badge ON completions(badge);
CREATE INDEX idx_completions_circle ON completions(circle_id);
CREATE INDEX idx_completions_date ON completions(completed_at);

-- Spatial index for location-based queries
CREATE INDEX idx_completions_location ON completions USING GIST(location);

-- ==========================================
-- CIRCLE INVITES TABLE
-- ==========================================
CREATE TABLE circle_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  circle_id UUID REFERENCES circles(id) ON DELETE CASCADE,
  inviter_id UUID REFERENCES users(id) ON DELETE CASCADE,
  invitee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(circle_id, invitee_id)
);

-- Index for faster invite lookups
CREATE INDEX idx_circle_invites_invitee ON circle_invites(invitee_id);
CREATE INDEX idx_circle_invites_status ON circle_invites(status);

-- ==========================================
-- ROW LEVEL SECURITY POLICIES
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_invites ENABLE ROW LEVEL SECURITY;

-- Users Policies
CREATE POLICY "Users can view all profiles"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Circles Policies
CREATE POLICY "Anyone can view circles they're a member of"
  ON circles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM circle_members
      WHERE circle_members.circle_id = circles.id
      AND circle_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create circles"
  ON circles FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Circle admins can update their circles"
  ON circles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM circle_members
      WHERE circle_members.circle_id = circles.id
      AND circle_members.user_id = auth.uid()
      AND circle_members.role = 'admin'
    )
  );

CREATE POLICY "Circle admins can delete their circles"
  ON circles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM circle_members
      WHERE circle_members.circle_id = circles.id
      AND circle_members.user_id = auth.uid()
      AND circle_members.role = 'admin'
    )
  );

-- Circle Members Policies
CREATE POLICY "Users can view circle members of their circles"
  ON circle_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM circle_members cm
      WHERE cm.circle_id = circle_members.circle_id
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Circle admins can add members"
  ON circle_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM circle_members
      WHERE circle_members.circle_id = circle_members.circle_id
      AND circle_members.user_id = auth.uid()
      AND circle_members.role = 'admin'
    )
    OR auth.uid() = user_id
  );

CREATE POLICY "Users can leave circles"
  ON circle_members FOR DELETE
  USING (auth.uid() = user_id);

-- Friendships Policies
CREATE POLICY "Users can view their friendships"
  ON friendships FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can send friend requests"
  ON friendships FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update friendships they're part of"
  ON friendships FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can delete their friendships"
  ON friendships FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Completions Policies
CREATE POLICY "Users can view their own completions"
  ON completions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view completions from friends"
  ON completions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM friendships
      WHERE (friendships.user_id = auth.uid() AND friendships.friend_id = completions.user_id)
      OR (friendships.friend_id = auth.uid() AND friendships.user_id = completions.user_id)
      AND friendships.status = 'accepted'
    )
  );

CREATE POLICY "Users can view completions from their circles"
  ON completions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM circle_members
      WHERE circle_members.circle_id = completions.circle_id
      AND circle_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own completions"
  ON completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Circle Invites Policies
CREATE POLICY "Users can view invites sent to them"
  ON circle_invites FOR SELECT
  USING (auth.uid() = invitee_id OR auth.uid() = inviter_id);

CREATE POLICY "Circle admins can send invites"
  ON circle_invites FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM circle_members
      WHERE circle_members.circle_id = circle_invites.circle_id
      AND circle_members.user_id = auth.uid()
      AND circle_members.role = 'admin'
    )
  );

CREATE POLICY "Invitees can update their invites"
  ON circle_invites FOR UPDATE
  USING (auth.uid() = invitee_id);

-- ==========================================
-- FUNCTIONS AND TRIGGERS
-- ==========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_circles_updated_at BEFORE UPDATE ON circles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_friendships_updated_at BEFORE UPDATE ON friendships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_circle_invites_updated_at BEFORE UPDATE ON circle_invites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- STORAGE BUCKETS
-- ==========================================

-- Create storage bucket for quest photos (run this in Supabase Dashboard > Storage)
-- Bucket name: quest-photos
-- Public: false
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg, image/png, image/webp

-- Storage policy for quest photos
CREATE POLICY "Users can upload their own quest photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'quest-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view quest photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'quest-photos');

-- ==========================================
-- SAMPLE DATA (OPTIONAL - FOR TESTING)
-- ==========================================

-- Insert sample user (you'll need to create this user through Supabase Auth first)
-- INSERT INTO users (id, username, email, total_xp, food_xp, outdoors_xp, fitness_xp, culture_xp)
-- VALUES 
--   ('your-user-uuid', 'testuser', 'test@example.com', 0, 0, 0, 0, 0);

-- ==========================================
-- USEFUL QUERIES
-- ==========================================

-- Get user leaderboard
-- SELECT username, total_xp, completed_quests
-- FROM users
-- ORDER BY total_xp DESC
-- LIMIT 10;

-- Get user's circle stats
-- SELECT c.name, COUNT(cm.user_id) as member_count, c.xp_multiplier
-- FROM circles c
-- JOIN circle_members cm ON c.id = cm.circle_id
-- WHERE cm.user_id = 'your-user-uuid'
-- GROUP BY c.id;

-- Get recent completions with user info
-- SELECT u.username, co.quest_name, co.badge, co.xp_gained, co.completed_at
-- FROM completions co
-- JOIN users u ON co.user_id = u.id
-- ORDER BY co.completed_at DESC
-- LIMIT 20;