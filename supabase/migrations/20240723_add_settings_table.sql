-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default settings
INSERT INTO settings (key, value, description)
VALUES 
  ('currency_code', 'INR', 'Currency code (e.g., USD, EUR, INR)'),
  ('currency_symbol', '₹', 'Currency symbol (e.g., $, €, ₹)'),
  ('currency_position', 'before', 'Position of currency symbol: before or after'),
  ('decimal_separator', '.', 'Decimal separator for currency'),
  ('thousand_separator', ',', 'Thousand separator for currency'),
  ('decimal_places', '2', 'Number of decimal places for currency')
ON CONFLICT (key) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create policies for settings
CREATE POLICY "Anyone can view settings"
  ON settings FOR SELECT USING (true);

CREATE POLICY "Only admins can insert settings"
  ON settings FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can update settings"
  ON settings FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete settings"
  ON settings FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Create function to format currency
CREATE OR REPLACE FUNCTION format_currency(
  amount DECIMAL,
  currency_code TEXT DEFAULT NULL
) RETURNS TEXT AS $$
DECLARE
  _currency_code TEXT;
  _currency_symbol TEXT;
  _currency_position TEXT;
  _decimal_separator TEXT;
  _thousand_separator TEXT;
  _decimal_places INTEGER;
  _formatted_amount TEXT;
  _result TEXT;
BEGIN
  -- Get currency settings
  SELECT 
    COALESCE(currency_code, value) INTO _currency_code
  FROM settings WHERE key = 'currency_code';
  
  SELECT value INTO _currency_symbol
  FROM settings WHERE key = 'currency_symbol';
  
  SELECT value INTO _currency_position
  FROM settings WHERE key = 'currency_position';
  
  SELECT value INTO _decimal_separator
  FROM settings WHERE key = 'decimal_separator';
  
  SELECT value INTO _thousand_separator
  FROM settings WHERE key = 'thousand_separator';
  
  SELECT value::INTEGER INTO _decimal_places
  FROM settings WHERE key = 'decimal_places';
  
  -- Format the amount
  _formatted_amount := TO_CHAR(
    amount,
    'FM999,999,999,999,999,999,999,999D' || REPEAT('9', _decimal_places)
  );
  
  -- Replace separators
  _formatted_amount := REPLACE(_formatted_amount, ',', '#TEMP#');
  _formatted_amount := REPLACE(_formatted_amount, '.', _decimal_separator);
  _formatted_amount := REPLACE(_formatted_amount, '#TEMP#', _thousand_separator);
  
  -- Add currency symbol
  IF _currency_position = 'before' THEN
    _result := _currency_symbol || _formatted_amount;
  ELSE
    _result := _formatted_amount || _currency_symbol;
  END IF;
  
  RETURN _result;
END;
$$ LANGUAGE plpgsql;
