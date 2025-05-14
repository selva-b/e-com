-- Create email_templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notification_templates table
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create firebase_tokens table
CREATE TABLE IF NOT EXISTS firebase_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  device_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, token)
);

-- Create email_logs table
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient VARCHAR(255) NOT NULL,
  subject VARCHAR(255),
  template_type VARCHAR(50),
  status VARCHAR(50) NOT NULL,
  message_id VARCHAR(255),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notification_logs table
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title VARCHAR(255),
  body TEXT,
  type VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  success_count INTEGER,
  failure_count INTEGER,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default email templates
INSERT INTO email_templates (name, type, subject, body, is_active)
VALUES
  (
    'Order Confirmation', 
    'order_placed', 
    'Your Order #{{order_id}} has been placed', 
    '<html><body><h1>Thank you for your order!</h1><p>Hello {{first_name}},</p><p>Your order #{{order_id}} has been placed successfully.</p><p>Order Total: ${{order_total}}</p><p>You will receive another email when your order ships.</p><p>Thank you for shopping with us!</p></body></html>', 
    TRUE
  ),
  (
    'Welcome Email', 
    'registration', 
    'Welcome to E-com!', 
    '<html><body><h1>Welcome to E-com!</h1><p>Hello {{first_name}},</p><p>Thank you for creating an account with us. We are excited to have you as a customer!</p><p>You can now shop our products, track your orders, and more.</p><p>Happy shopping!</p></body></html>', 
    TRUE
  ),
  (
    'Order Status Update', 
    'order_status', 
    'Your Order #{{order_id}} has been {{status}}', 
    '<html><body><h1>Order Status Update</h1><p>Hello {{first_name}},</p><p>Your order #{{order_id}} has been {{status}}.</p><p>You can track your order in your account dashboard.</p><p>Thank you for shopping with us!</p></body></html>', 
    TRUE
  );

-- Insert default notification templates
INSERT INTO notification_templates (name, type, title, body, is_active)
VALUES
  (
    'Order Confirmation', 
    'order_placed', 
    'Order Confirmed!', 
    'Your order #{{order_id}} has been placed successfully.', 
    TRUE
  ),
  (
    'Welcome Notification', 
    'registration', 
    'Welcome to E-com!', 
    'Thank you for creating an account with us, {{first_name}}!', 
    TRUE
  ),
  (
    'Order Status Update', 
    'order_status', 
    'Order Status Update', 
    'Your order #{{order_id}} has been {{status}}.', 
    TRUE
  );
