-- Add flash sale settings to the settings table
INSERT INTO settings (key, value, description)
VALUES 
  ('show_flash_sale_section', 'true', 'Whether to show the flash sale section on the home page'),
  ('flash_sale_section_title', 'Flash Sale', 'Title for the flash sale section on the home page'),
  ('flash_sale_section_subtitle', 'Limited Time', 'Subtitle for the flash sale section on the home page')
ON CONFLICT (key) DO UPDATE
SET 
  value = EXCLUDED.value,
  description = EXCLUDED.description;
