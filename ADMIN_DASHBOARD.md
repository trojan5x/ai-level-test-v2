# AI Level Test - Admin Dashboard

## Overview

A comprehensive, secure admin dashboard for monitoring and analyzing the AI Level Test performance, user insights, and business intelligence.

## Features

### 🔐 Security & Authentication
- **Password Protection**: Secure admin login with bcrypt password hashing
- **Rate Limiting**: Prevents brute force attacks (5 attempts per 15 minutes)
- **Session Management**: Secure session tokens stored in Supabase
- **Activity Logging**: All admin actions are logged for security monitoring
- **Lockout Protection**: Automatic IP lockout after failed attempts

### 📊 Analytics Dashboard
- **Real-time Metrics**: Live updates every 30 seconds
- **Conversion Funnel**: Visual representation of user journey
- **User Insights**: AI level and relationship status distribution
- **Business Intelligence**: Revenue potential and lead quality analysis

### 📈 Key Metrics
- Test starts and completion rates
- Lead capture and product interest conversion
- Share rates and viral coefficient
- Geographic distribution
- Lead quality scoring
- Revenue potential estimates

## Access

### Admin Login
- **URL**: `http://localhost:5173/admin` (development)
- **Default Password**: `LearnTube2026!` (change after first login)
- **Security**: Rate limited, activity logged, session managed

### Navigation
- **Overview**: Key metrics and summary
- **Conversion Funnel**: User journey analysis
- **User Insights**: Demographic and proficiency data
- **Business Intelligence**: Revenue and quality metrics

## Database Schema

### Admin Tables
- `admin_config`: Password storage with bcrypt hashing
- `admin_sessions`: Secure session management
- Both tables use Row Level Security (RLS) for protection

### Analytics Tables (Existing)
- `ai_level_leads`: User lead data
- `ai_level_intents`: Product interest data  
- `ai_level_analytics`: Event tracking data

## Security Features

### Rate Limiting
- **Login Attempts**: Max 5 per 15 minutes
- **Lockout Duration**: 30 minutes for blocked IPs
- **Activity Monitoring**: All attempts logged

### Session Security
- **Token-based**: Unique session tokens
- **Auto-expire**: 24-hour session timeout
- **Secure Storage**: Server-side session management

### Data Protection
- **RLS Policies**: Database-level access control
- **Input Validation**: All inputs sanitized
- **Activity Logging**: Comprehensive audit trail

## Development

### Setup
1. Supabase admin tables created via migration
2. React Router for admin routes
3. Secure authentication components
4. Analytics visualization with Recharts

### Architecture
```
src/admin/
├── components/          # Dashboard UI components
│   ├── AdminDashboard.jsx
│   ├── AdminLogin.jsx
│   ├── MetricsGrid.jsx
│   ├── ConversionFunnel.jsx
│   ├── UserInsights.jsx
│   └── BusinessIntelligence.jsx
├── hooks/              # React hooks
│   ├── useAdminAuth.js
│   └── useAdminData.js
├── services/           # Data layer
│   └── adminQueries.js
└── utils/             # Security utilities
    └── adminHelpers.js
```

## Security Best Practices

### Implemented
- ✅ Password hashing with bcrypt
- ✅ Rate limiting and lockout protection
- ✅ Secure session management
- ✅ Activity logging and monitoring
- ✅ Input validation and sanitization
- ✅ RLS database policies

### Production Recommendations
- Use HTTPS only
- Environment variable for admin password
- IP whitelisting for admin access
- Log monitoring and alerting
- Regular security audits
- Database backup strategy

## Monitoring

### Real-time Features
- Live user activity tracking
- Auto-refreshing metrics (30s intervals)
- Security event notifications
- Performance monitoring

### Analytics Events Tracked
- `admin_page_accessed`
- `login_attempt` / `login_success` / `login_failed`
- `ip_locked_out`
- `dashboard_accessed`
- `tab_changed`
- `time_range_changed`
- `logout_initiated`

## Future Enhancements

### Planned Features
- Export data functionality
- Advanced filtering and date ranges
- Email/Slack alerting for security events
- Multi-admin user management
- Advanced visualization charts
- Mobile-responsive admin interface

### Scalability
- Redis for session storage (high traffic)
- Database connection pooling
- CDN for static assets
- Load balancing for multiple instances

## Testing the Admin Dashboard

### Quick Test Steps

1. **Access the Admin Dashboard**
   - Navigate to: `http://localhost:5173/admin`
   - You should see the secure login page

2. **Login with Default Credentials**
   - Password: `LearnTube2026!`
   - The system will create the admin config on first login

3. **Verify Dashboard Features**
   - ✅ **Overview Tab**: Should show metrics (all zeros initially)
   - ✅ **Conversion Funnel**: Should display empty funnel visualization 
   - ✅ **User Insights**: Should show "No user data available yet" message
   - ✅ **Business Intelligence**: Should display zero metrics gracefully

4. **Test Security Features**
   - Try wrong password 6 times to trigger rate limiting
   - Verify 30-minute lockout functionality
   - Check browser console for security event logs

5. **Generate Test Data** (Optional)
   - Complete the main AI Level Test at `http://localhost:5173/`
   - Return to admin dashboard to see real data populate

### Expected Behavior

**Empty State (No Data)**:
- All metrics show 0 values
- Charts display empty state messages
- No errors in console
- Responsive design works on all screen sizes

**With Data**:
- Real-time metrics update
- Charts populate with actual data  
- Conversion funnel shows user journey
- Business intelligence shows meaningful insights

**Security**:
- Rate limiting prevents brute force attacks
- Activity logging tracks all admin actions
- Sessions expire after 24 hours
- Database access properly secured

---

**⚠️ Important**: Always change the default admin password on first login and ensure HTTPS is enabled in production environments.