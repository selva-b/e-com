# E-commerce Notification System Setup

This document provides instructions for setting up and using the notification system for the e-commerce application.

## Overview

The notification system supports:
- Email notifications using Nodemailer
- Push notifications using Firebase Cloud Messaging (FCM)
- Template-based notifications managed through the admin dashboard
- Notification logs for tracking delivery status

## Prerequisites

1. Firebase project with Cloud Messaging enabled
2. SMTP email service (Gmail, SendGrid, etc.)
3. Supabase database

## Setup Steps

### 1. Firebase Setup

1. Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Enable Firebase Cloud Messaging
3. Generate a Web Push certificate (VAPID key)
4. Create a service account and download the private key JSON file
5. Add the Firebase configuration to your `.env` file:

```
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_firebase_vapid_key

# Firebase Admin Configuration
FIREBASE_ADMIN_PROJECT_ID=your_firebase_admin_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=your_firebase_admin_client_email
FIREBASE_ADMIN_PRIVATE_KEY=your_firebase_admin_private_key
FIREBASE_ADMIN_DATABASE_URL=your_firebase_admin_database_url
```

### 2. Email Service Setup

1. Set up an SMTP email service (Gmail, SendGrid, etc.)
2. Add the email configuration to your `.env` file:

```
# Email Configuration
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email_username
EMAIL_PASSWORD=your_email_password
EMAIL_FROM=noreply@e-com.com
```

### 3. Database Setup

1. Run the SQL script in `scripts/init-notification-tables.sql` to create the required tables and default templates:

```sql
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
```

## Usage

### Sending Notifications

To send a notification, use the `sendNotification` function from `lib/notifications/notificationService.ts`:

```typescript
import { sendNotification } from '@/lib/notifications/notificationService';

// Send both email and push notification
await sendNotification({
  userId: 'user-id',
  title: 'Notification Title',
  body: 'Notification Body',
  type: 'order_placed', // or 'registration', 'order_status', etc.
  data: {
    order_id: '12345',
    total: '99.99',
    // Any other variables for the template
  },
  email: true, // Send email notification
  push: true,  // Send push notification
});

// Send only email notification
await sendNotification({
  userId: 'user-id',
  title: 'Notification Title',
  body: 'Notification Body',
  type: 'order_placed',
  data: { /* template variables */ },
  email: true,
  push: false,
});

// Send only push notification
await sendNotification({
  userId: 'user-id',
  title: 'Notification Title',
  body: 'Notification Body',
  type: 'order_placed',
  data: { /* template variables */ },
  email: false,
  push: true,
});
```

### Managing Templates

Templates can be managed through the admin dashboard at `/admin/templates`.

#### Template Variables

The following variables are available for use in templates:

- `{{first_name}}` - User's first name
- `{{last_name}}` - User's last name
- `{{order_id}}` - Order ID
- `{{order_total}}` - Order total
- `{{status}}` - Order status
- Any other variables passed in the `data` object

## Troubleshooting

### Push Notifications Not Working

1. Check that Firebase is properly configured in your `.env` file
2. Ensure the service worker is registered correctly
3. Check browser console for any errors
4. Verify that the user has granted notification permissions

### Email Notifications Not Working

1. Check that the SMTP server is properly configured in your `.env` file
2. Verify that the email templates exist in the database
3. Check server logs for any errors

## Monitoring

You can monitor notification delivery using the logs tables:

- `email_logs` - Logs for email notifications
- `notification_logs` - Logs for push notifications
