-- Add round/stage label to matches
ALTER TABLE matches ADD COLUMN IF NOT EXISTS round VARCHAR(100) DEFAULT '';
