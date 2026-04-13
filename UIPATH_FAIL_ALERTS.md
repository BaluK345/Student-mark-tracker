# UiPath Automatic Fail Alert System

## Overview
The Student Mark Tracker automatically sends email notifications to parents when their child fails an exam, using **UiPath RPA automation exclusively**. This ensures scalability, audit trails, and centralized email management through your UiPath orchestrator.

## How It Works

### 1. **Mark Entry Triggers Fail Detection**
When a teacher enters marks for a student:
- If `marks_obtained < pass_marks` → Status = "Fail"  
- System automatically triggers parent notification workflow

### 2. **Automatic Email Sending via UiPath**
The system sends fail notifications through:
- **Primary Method**: UiPath Orchestrator API (when enabled)
- **Configuration**: All emails are routed to your UiPath automation process

### 3. **End-to-End Process Flow**
```
┌─────────────────────────────────────────┐
│  Teacher enters failing marks via UI    │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│  Backend detects mark.status = "Fail"   │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│  Retrieve parent email & student info   │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│  Queue background task for email        │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│  UiPath Orchestrator API receives job   │
│  with email parameters                  │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│  UiPath Robot assigned to job queue     │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│  Robot executes email process:          │
│  - Logs into email system               │
│  - Composes fail alert message          │
│  - Sends to parent email address        │
│  - Logs success/failure                 │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│  Parent receives fail notification      │
│  Job status updated in Orchestrator     │
└─────────────────────────────────────────┘
```

## Complete Setup Guide

### Phase 1: Create UiPath Automation Process

#### Step 1.1: Create New Process in UiPath Studio

1. Open **UiPath Studio** on your development machine
2. Create a new **Process** project (not a Library)
3. Name it: `EmailNotification` (or your preferred name)
4. Select framework: **Windows - Legacy** or **Cloud**

#### Step 1.2: Define Input Arguments

In UiPath Studio, open **Arguments** panel and create:

| Argument Name | Argument Type | Direction | Description |
|---|---|---|---|
| `RecipientEmail` | String | In | Parent's email address |
| `Subject` | String | In | Email subject line |
| `Body` | String | In | Email body content (can include HTML) |
| `StudentName` | String | In | Student's full name |
| `RollNumber` | String | In | Student's roll number |

**Steps:**
1. Click **Arguments** at bottom of Main workflow
2. Click **Create Argument**
3. Enter each field from table above
4. Set Direction to **In** for all (input arguments)
5. Set Type to **String** for all

#### Step 1.3: Add Email Sending Activity

**Option A: Using Outlook Mail (Recommended if you have Outlook)**

1. In UiPath Studio, drag **Send Outlook Mail Message** activity to Main workflow
2. Configure properties:
   - **To**: `RecipientEmail`
   - **Subject**: `Subject`
   - **Body**: `Body`
   - **IsBodyHtml**: `True` (if sending formatted email)
3. Add error handling (Try-Catch)

**Option B: Using SMTP Mail**

1. Drag **Send SMTP Mail Message** activity to Main workflow
2. Configure properties:
   - **To**: `RecipientEmail`
   - **Subject**: `Subject`
   - **Body**: `Body`
   - **Host**: Your SMTP host (e.g., `smtp.gmail.com`)
   - **Port**: `587` or `25`
   - **UserName**: Your email account
   - **Password**: Your email password (use Invoke Power Shell to read from secure location)
   - **EnableSSL**: `True` (for port 587)

#### Step 1.4: Add Logging and Error Handling

```
Main Workflow Structure:
├── Try
│   ├── Send Outlook Mail Message (or Send SMTP Mail Message)
│   └── Log Sequence
│       └── Write Log: "Email sent successfully to " + RecipientEmail
├── Catch (Exception)
│   ├── Write Log: "Error sending email: " + exception.Message
│   └── Throw (re-throw exception)
└── Finally
    └── (Optional) Close any email connections
```

**Add logging activity:**
1. Drag **Write Log** activity into Try block (after email send)
2. Set **Message**: `"Fail alert email sent to: " + RecipientEmail`
3. Set **Level**: `Information`

**Add error handling:**
1. Select all activities in Main
2. Right-click → **Wrap → Try Catch**
3. In Catch block, drag **Write Log**
4. Message: `"Error sending email: " + exception.Message`

#### Step 1.5: Example UiPath Workflow Code

Here's a minimal working example structure:

**Main.xaml (simplified)**
```
Title: Send Fail Alert Email

Arguments:
  In: RecipientEmail (String)
  In: Subject (String)
  In: Body (String)
  In: StudentName (String)
  In: RollNumber (String)

Activities:
  Try:
    Sequence:
      - Send Outlook Mail Message
        To: RecipientEmail
        Subject: Subject
        Body: Body
        IsBodyHtml: True
      - Write Log "Email sent to: " + RecipientEmail
  
  Catch Exception:
    - Write Log "Email failed: " + exception.Message
    - Throw
```

**If using SMTP, add connection activity:**
```
Sequence:
  - Connect to SMTP
  - Send SMTP Mail Message
  - Close SMTP Connection
```

---

### Phase 2: Deploy to UiPath Orchestrator

#### Step 2.1: Create Orchestrator Account

1. Go to **UiPath Cloud Portal**: https://cloud.uipath.com/
2. Create a free account or use your organization's account
3. Create/select a **Tenant**
4. Note your **Tenant Name**

#### Step 2.2: Create API Credentials

1. In Orchestrator, go to **Tenant** → **Settings** → **API Access**
2. Create **API Key** (User Key) and **API Token**
3. Save these credentials securely

**Your credentials will look like:**
- **Orchestrator URL**: `https://cloud.uipath.com/`
- **Tenant Name**: `your_tenant_name`
- **User Key**: `your_email@company.com` (your Orchestrator user)
- **API Token**: `xxxxxxxxxxxx` (generated API token)

#### Step 2.3: Publish Process to Orchestrator

**From UiPath Studio:**
1. Click **Publish** button (top menu)
2. Select **Orchestrator Publishing**
3. Enter your **Orchestrator URL** and **Tenant Name**
4. Authenticate with your credentials
5. Choose or create a **Folder** (e.g., `EmailNotifications`)
6. Publish as **EmailNotification** (Process Key)
7. Click **Publish**

**Verify in Orchestrator:**
1. Go to Orchestrator web portal
2. Navigate to **Processes**
3. You should see **EmailNotification** process listed

#### Step 2.4: Add Robot to Orchestrator

1. In Orchestrator, go to **Settings** → **Robots**
2. Click **Add Robot**
3. Enter **Name**: `Robot1` (or your choice)
4. Select **Unattended Robot** or **Attended Robot**
5. Note the **Robot Name** (used in backend config)

**For local testing, you can use your current machine as a robot:**
1. Go to **Settings** → **Machine Templates**
2. Create machine template
3. Associate your UiPath Studio machine with Orchestrator

---

### Phase 3: Configure Backend Application

#### Step 3.1: Access UiPath Configuration in Web Application

1. Open Student Mark Tracker frontend
2. Go to **UiPath Automation** menu (Teacher only)
3. Fill in the configuration form with values from Phase 2:

```
Orchestrator URL:     https://cloud.uipath.com/
Tenant Name:          your_tenant_name
User Key:             your_email@company.com
API Token:            [generated_api_token]
Process Key:          EmailNotification
Robot Name:           Robot1 (optional, but recommended)
Enable UiPath:        ✓ (check this box)
```

4. Click **Save Configuration**
5. Click **Send Test Email via UiPath** to verify setup

#### Step 3.2: Verify Test Email

1. You should receive a test email from your configured email system
2. Check **Orchestrator Portal** → **Jobs** to see the job execution
3. Verify job status shows **Success** or **Faulted**

If test email fails:
- Check Orchestrator logs: **Execution → Jobs** (look for errors)
- Verify email credentials in your UiPath process
- Verify network access to Orchestrator from your backend server

---

### Phase 4: Testing Fail Alert Automation

#### Step 4.1: Manual Test

1. Log in as a **Teacher** in the application
2. Go to **Marks** section
3. Enter a **failing mark** for any student (less than pass_marks):
   - Student: Select any student
   - Subject: Select any subject
   - Marks: Enter less than "Pass Marks" for that subject
   - Exam Type: Select exam type
4. Click **Submit**

#### Step 4.2: Verify Email Sent

**In Application:**
- System should show success message

**In UiPath Orchestrator:**
1. Go to **Tenant** → **Execution** → **Jobs**
2. Look for recent **EmailNotification** job
3. Verify **Status** = **"Success"**
4. Check job **Logs** for detailed output

**In Email:**
1. Check parent's inbox (configured parent_email for student)
2. Look for subject: `"Important: [StudentName] - [SubjectName] Exam Result"`
3. Verify email body contains all student details

#### Step 4.3: Troubleshoot If Email Not Sent

**Check Application Backend:**
```
# Check backend logs for errors
# Look for patterns:
# - "Error sending fail alert via UiPath"
# - "Failed to create UiPath job"
# - Connection/authentication errors
```

**Check Orchestrator Logs:**
1. Performance Viewer → Jobs → Failed Jobs
2. Click on failed job to see error details
3. Common issues:
   - Network/firewall blocking Orchestrator
   - Invalid robot credentials
   - Process not deployed correctly
   - Email activity configuration (SMTP/Outlook settings)

**Check Backend Configuration:**
1. Verify UiPath config is **enabled** in settings
2. Verify credentials match Orchestrator exactly
3. Verify Process Key matches published process name
4. Test connectivity from backend server to Orchestrator URL

---

## Email Template

When a student fails, UiPath sends a professionally formatted fail notification email to parents:

### HTML Email Template

```html
Dear {{ParentName}},

We regret to inform you that your child has not achieved the required passing 
marks in the recent examination. Please see the details below:

**Student Details:**
- Name: {{StudentName}}
- Roll Number: {{RollNumber}}
- Class: {{ClassName}}

**Exam Details:**
- Subject: {{SubjectName}}
- Marks Obtained: {{MarksObtained}} out of {{MaxMarks}}
- Pass Marks Required: {{PassMarks}}
- Status: FAIL

**Next Steps:**
1. Please contact the school for a detailed performance review
2. Consider additional tutoring or study support
3. Schedule a meeting with the subject teacher

For further assistance or improvement strategies, please contact our office 
during working hours.

Best regards,
Student Mark Tracker System
School Administration
```

### Email Variables

The UiPath process receives these variables populated by the backend:

| Variable | Source | Example |
|---|---|---|
| `RecipientEmail` | Student's parent_email | `parent@example.com` |
| `Subject` | Generated by backend | `Important: John Doe - Mathematics Exam Result` |
| `Body` | Generated by backend | Full formatted email (as shown above) |
| `StudentName` | From Student record | `John Doe` |
| `RollNumber` | From Student record | `2024001` |

### Customizing Email Content

To modify the email template:

1. **In Backend** (`fail_alert_service.py`):
   - Edit the email body generation
   - Update subject line format
   - Add custom formatting

2. **In UiPath Process**:
   - The `Body` arrives as formatted text/HTML
   - Robot simply uses it as-is
   - Optional: Robot can prepend/append content

---

Please contact the school for further assistance.

Best regards,
Student Mark Tracker System
```

## How It Works - Technical Details

### Single Mark Entry
```python
POST /api/marks/
```
- Teacher enters mark for one student
- If mark < pass_marks:
  - Job status = "Fail"
  - **Background task triggered**:
    - Get student & parent info
    - Call `send_fail_alert_email_with_fallback()`
    - If UiPath enabled → Create UiPath job
    - Else → Send via SMTP

### Bulk Mark Entry
```python
POST /api/marks/bulk
```
- Teacher enters marks for multiple students
- For each failing mark:
  - **Background task triggered** (same as above)

### UiPath Job Creation
```
1. Authenticate with Orchestrator API
2. Get Process ID by Process Key
3. Get Robot ID by Robot Name (if specified)
4. Create Job with input arguments
5. Return Job ID to system
```

### Fallback to SMTP
If UiPath is:
- Not configured
- Disabled
- Fails to execute

System automatically sends via SMTP using:
```
- SMTP_HOST: From .env
- SMTP_PORT: From .env
- SMTP_USER: From .env
- SMTP_PASSWORD: From .env
```

## API Endpoints

### Get UiPath Configuration
```
GET /api/settings/uipath
```

### Update UiPath Configuration
```
POST /api/settings/uipath
```

### Test UiPath Connection
```
POST /api/settings/uipath/test
```

### Send Email via UiPath (Direct)
```
POST /api/email/send-via-uipath
{
  "recipient_email": "parent@example.com",
  "subject": "Test Email",
  "body": "This is a test email",
  "student_name": "John Doe",
  "roll_number": "12345"
}
```

## Troubleshooting

### Issue: "UiPath automation is not enabled"
**Solution**: Enable UiPath in configuration and verify credentials

### Issue: "Failed to create UiPath job"
**Solution**: 
- Verify Process Key exists in Orchestrator
- Check Orchestrator URL is accessible
- Verify API token is valid
- Check robot is online

### Issue: "Email sent via SMTP instead of UiPath"
**Solution**: One of above issues - check backend logs

### Issue: No email received
**Solution**:
- Check parent email in student profile
- Verify email configuration (either UiPath or SMTP)
- Check spam folder
- Review backend logs for errors

## Configuration Priority

The system uses UiPath if:
1. ✓ UiPath automation is **enabled**
2. ✓ All credentials are **configured**
3. ✓ Orchestrator is **accessible**
4. ✓ Process exists in Orchestrator

Otherwise, falls back to **SMTP**.

## Best Practices

1. **Test after setup**: Send test email before going live
2. **Keep credentials secure**: Use strong API tokens
3. **Monitor jobs**: Check UiPath Orchestrator job logs
4. **Use specific robot**: Specify robot name if multiple robots available
5. **Error handling**: Robots should have retry logic
6. **Email validation**: Ensure student profiles have parent emails

## Performance Notes

- Email sending is **asynchronous** (background task)
- Teacher doesn't wait for email to send
- Marks are saved immediately
- Email sent within seconds

## Support

For issues contact:
- **UiPath**: Check Orchestrator logs
- **SMTP**: Review .env configuration
- **System**: Check backend application logs
