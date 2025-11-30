-- Create pixels table
CREATE TABLE IF NOT EXISTS pixels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tracker_url TEXT GENERATED ALWAYS AS ('/tracker/' || id::text || '.png') STORED
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pixel_id UUID NOT NULL REFERENCES pixels(id) ON DELETE CASCADE,
  opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

-- Create index on pixel_id for faster queries
CREATE INDEX IF NOT EXISTS idx_events_pixel_id ON events(pixel_id);

-- Create index on opened_at for faster date queries
CREATE INDEX IF NOT EXISTS idx_events_opened_at ON events(opened_at);

-- Create links table
CREATE TABLE IF NOT EXISTS links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pixel_id UUID NOT NULL REFERENCES pixels(id) ON DELETE CASCADE,
  destination_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on pixel_id for faster queries
CREATE INDEX IF NOT EXISTS idx_links_pixel_id ON links(pixel_id);

-- Create link_events table
CREATE TABLE IF NOT EXISTS link_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL REFERENCES links(id) ON DELETE CASCADE,
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

-- Create index on link_id for faster queries
CREATE INDEX IF NOT EXISTS idx_link_events_link_id ON link_events(link_id);

-- Create index on clicked_at for faster date queries
CREATE INDEX IF NOT EXISTS idx_link_events_clicked_at ON link_events(clicked_at);

