-- Add plan_expired_at column for expiration management
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS plan_expired_at TIMESTAMPTZ;

-- Add plan_type column for plan tiers (bronze, silver, gold, basic)
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'basic';

-- Create or replace function to check and downgrade expired plans
CREATE OR REPLACE FUNCTION check_plan_expiry()
RETURNS TRIGGER AS $$
BEGIN
  -- If plan is expired and not already basic
  IF NEW.plan_expired_at < NOW() AND NEW.plan_type != 'basic' THEN
    NEW.plan_type := 'basic';
    NEW.plan := 'basic'; -- Sync with old 'plan' column if used
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to run before update on teachers
DROP TRIGGER IF EXISTS check_expiry_trigger ON teachers;
CREATE TRIGGER check_expiry_trigger
BEFORE UPDATE ON teachers
FOR EACH ROW
EXECUTE FUNCTION check_plan_expiry();
