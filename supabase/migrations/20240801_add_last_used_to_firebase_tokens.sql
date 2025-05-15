-- Add last_used column to firebase_tokens table
ALTER TABLE firebase_tokens ADD COLUMN IF NOT EXISTS last_used TIMESTAMP WITH TIME ZONE;

-- Create index for the new column
CREATE INDEX IF NOT EXISTS firebase_tokens_last_used_idx ON firebase_tokens(last_used);

-- Add comment to document the purpose of this column
COMMENT ON COLUMN firebase_tokens.last_used IS 'Timestamp when the token was last used for sending a notification';

-- Create a function to update the last_used timestamp when a notification is sent
CREATE OR REPLACE FUNCTION update_firebase_token_last_used()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the last_used timestamp for all tokens used in the notification
  UPDATE firebase_tokens
  SET last_used = NOW()
  WHERE user_id = NEW.user_id
    AND type = 'push';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to call the function when a notification is logged
DROP TRIGGER IF EXISTS update_firebase_token_last_used_trigger ON notification_logs;
CREATE TRIGGER update_firebase_token_last_used_trigger
AFTER INSERT ON notification_logs
FOR EACH ROW
WHEN (NEW.type = 'push' AND NEW.status = 'sent')
EXECUTE FUNCTION update_firebase_token_last_used();
