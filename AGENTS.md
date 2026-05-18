# LearnTube.ai Agent Guidelines

## Project Overview
LearnTube.ai is an AI-powered assessment platform that measures users' AI relationship levels through interactive assessments, then generates qualified leads through a conversion funnel.

## Analytics Setup

### Mixpanel Integration
- **Project Token:** `9d9097ced8abd777d1517ac47f4c1129` (production)
- **SDK:** mixpanel-browser (client-side tracking)
- **Configuration:** `src/mixpanel.js`
- **Timezone:** Asia/Kolkata (IST)
- **Identity:** Email-based identification after lead form submission
- **Session Replay:** Enabled with privacy controls

### Session Replay Configuration
- **Recording Rate:** 100% of sessions (adjust for production scale)
- **Privacy Class:** `.mp-sensitive` - blocks sensitive inputs from recording
- **Recording Limits:** 
  - Maximum duration: 15 minutes per session
  - Idle timeout: 5 minutes (stops recording during inactivity)
- **Auto-Start:** Recording begins when user starts assessment
- **Annotations:** Key events automatically annotated in replay timeline

### Conversion Funnel Events

| Event Name | Trigger | Properties | Session Replay |
|------------|---------|------------|----------------|
| `landing_page_viewed` | User lands on homepage | `referrer`, `utm_source`, `utm_medium`, `utm_campaign`, `landing_url` | ✅ Recorded |
| `assessment_started` | User clicks "Start" button | `platform`, `time_on_landing` | 🎬 **Starts Recording** |
| `assessment_completed` | User finishes all assessment items | `assessment_score`, `assessment_level`, `assessment_rating`, `completion_time`, `questions_answered` | 🏷️ **Milestone Annotation** |
| `lead_form_completed` | **VALUE MOMENT** - User submits contact info | `signup_method`, `platform`, `assessment_score`, `assessment_level`, `form_completion_time` | 🎯 **Conversion Annotation** |
| `result_page_viewed` | User views their assessment results | `assessment_score`, `assessment_level`, `platform` | ✅ Recorded |
| `cta_clicked` | User clicks any CTA on results page | `cta_type`, `cta_text`, `cta_position`, `platform`, `user_score`, `user_level` | 🎯 **Interaction Annotation** |

### User Profile Properties
Set when lead form is completed:
- `name` (string)
- `email` (string) 
- `phone` (string)
- `latest_assessment_score` (number)
- `latest_assessment_level` (string)
- `signup_date` (ISO string)
- `total_assessments` (number - auto-incremented)

### Super Properties
Auto-added to all events:
- `platform`: "web"
- `user_timezone`: User's detected timezone
- `app_version`: "1.0"

## Session Replay Features

### Privacy & Security
- **Sensitive Data Protected**: Name, phone, and email inputs have `mp-sensitive` class
- **Automatic Masking**: Sensitive form fields are blocked from recording
- **No PII in Replay**: Personal information is not visible in session recordings

### Key Benefits
- **Visual Funnel Analysis**: See exactly where users drop off during assessment
- **UX Optimization**: Identify confusing UI elements or interaction patterns
- **Bug Detection**: Spot technical issues affecting user experience
- **Conversion Analysis**: Watch successful vs. failed conversion paths

### Annotation System
Session replays are automatically annotated with key events:
- 🏷️ **Milestone**: Assessment completion with score/level
- 🎯 **Conversion**: Lead form submission (VALUE MOMENT)
- 🎯 **Interaction**: CTA clicks with type and user context

### Accessing Session Replays
1. Go to Mixpanel → Session Replay tab
2. Filter by user properties or events
3. Click on any session to watch the replay
4. Use annotations to jump to key moments
5. For debugging: Use `getSessionReplayUrl()` function

## Key Performance Indicators (KPIs)

1. **Landing to Start Conversion Rate**: `landing_page_viewed` → `assessment_started`
2. **Assessment Start to Complete Rate**: `assessment_started` → `assessment_completed`
3. **Assessment Complete to Lead Rate**: `assessment_completed` → `lead_form_completed`
4. **Lead to Action Conversion Rate**: `result_page_viewed` → `cta_clicked`

### Session Replay Analysis
- **Drop-off Points**: Watch replays of users who didn't complete the funnel
- **Successful Conversions**: Analyze behavior patterns of converting users
- **Form Optimization**: See how users interact with the lead capture form
- **CTA Performance**: Compare user behavior for different CTA types

## Implementation Guidelines

### Adding New Events
1. Define event in `src/mixpanel.js` with proper function
2. Import and call from appropriate component
3. Use `snake_case` naming convention
4. Send numbers as numbers, not strings
5. Include required properties: `platform: "web"`
6. Add debug logging in development mode

### User Identification
- Users are identified when they submit the lead form
- Use email as distinct_id (fallback to phone if no email)
- All anonymous events are retroactively linked to identified user
- Profile properties are set immediately after identification

### Property Naming Standards
- Event names: `object_verb` format (e.g., `assessment_started`)
- Property names: `snake_case`, descriptive
- Property values: lowercase, consistent
- Never use `$` or `mp_` prefixes on custom properties

### Data Quality Rules
- ✅ Send numeric values as numbers: `score: 85`
- ❌ Don't send as strings: `score: "85"`
- ✅ Use consistent enum values: `"improve"`, `"prove"`
- ❌ Avoid dynamic event names at runtime
- ✅ Omit properties when no value available
- ❌ Don't send `null`, `""`, or `"N/A"`

## File Locations

### Core Analytics Files
- `src/mixpanel.js` - Mixpanel configuration and tracking functions
- `src/App.jsx` - Main component with tracking calls integrated
- `src/supabase.js` - Database integration (existing analytics)
- `src/utils/utmTracker.js` - UTM attribution tracking

### Component Integration Points
- **Landing Component** (line ~380): Landing page view + start tracking
- **LoadingScreen Component** (line ~1362): Assessment completion tracking
- **LeadCapture Component** (line ~1465): Lead form completion + user identification
- **LevelReveal Component** (line ~1922): Result page view + CTA tracking

## Development Workflow

### Testing Events
1. Run `npm run dev` to start development server
2. Open browser console to see debug logs
3. Open Mixpanel Live View to confirm events arrive
4. Test full funnel: Land → Start → Complete → Submit → View Results → Click CTA

### Debugging
- Debug logging enabled in development mode
- Console logs show: `🔍 Mixpanel: [event_name] [properties]`
- Check Mixpanel Live View for real-time event verification
- Verify user identification links events correctly

## Data Governance

### Next Steps Required
1. **Lexicon Setup**: Add descriptions for all events in Mixpanel
2. **Data Standards**: Enable snake_case enforcement  
3. **Event Approval**: Set up approval workflow for new events
4. **Role Assignment**: 
   - Data Owner: Approve new events
   - Data Governor: Maintain naming standards
   - Analyst: Document use cases

### Quarterly Review Checklist
- [ ] Audit zero-volume events
- [ ] Check missing Lexicon descriptions  
- [ ] Validate new event naming conventions
- [ ] Review property consistency
- [ ] Clean up test/duplicate events

## Technical Notes

### Environment Configuration
- Uses same token for dev/prod (single project setup)
- Environment detection: `import.meta.env.DEV` for debug mode
- UTM parameters automatically captured and forwarded

### Performance Considerations
- Client-side tracking (15-30% event loss expected from ad blockers)
- Events sent immediately (no batching)
- User identification triggers immediate profile sync

### Privacy & Compliance
- No EU/CA users (consent gate not required)
- IP forwarding enabled for geolocation
- No sensitive data in event properties
- Phone numbers formatted with +91 country code

---

*Last updated: 2026-05-16 - Full Mixpanel implementation complete*