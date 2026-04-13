# UiPath Fail Alert Email - Quick Reference & Checklist

## Quick Start (15-Minute Setup)

### Prerequisites
- ✓ UiPath Studio installed
- ✓ Access to UiPath Cloud Orchestrator
- ✓ Email account (Gmail, Office 365, or SMTP)
- ✓ Student Mark Tracker app running

---

## Phase 1: Create UiPath Process (5 minutes)

### In UiPath Studio:

1. **Create Process**
   ```
   File → New → Process
   Name: StudentFailAlertNotification
   ```

2. **Add Arguments** (Bottom panel → Arguments):
   ```
   RecipientEmail     String  In
   Subject            String  In
   Body               String  In
   StudentName        String  In
   RollNumber         String  In
   ```

3. **Add Email Activity**
   - Outlook: Drag "Send Outlook Mail Message"
   - SMTP: Drag "Send SMTP Mail Message"

4. **Configure Activity**
   ```
   To:          RecipientEmail
   Subject:     Subject
   Body:        Body
   IsBodyHtml:  True
   ```

5. **Add Error Handling**
   - Select all → Right-click → Wrap → Try Catch

6. **Test Locally**
   - Run → Verify email received

---

## Phase 2: Deploy to Orchestrator (5 minutes)

### In UiPath Cloud:

1. **Create Account**
   - Go to: cloud.uipath.com
   - Sign up / Login
   - Save: **Tenant Name**

2. **Get Credentials**
   - Settings → API Access
   - Generate API Token
   - Save: **API Token**, **User Key**

### Back in Studio:

3. **Publish Process**
   - Publish → Orchestrator Publishing
   - Enter URL & Tenant name
   - Process name: `StudentFailAlert`
   - Click Publish

4. **Create Robot** (In Orchestrator)
   - Settings → Robots
   - Add: `FailAlertRobot`
   - Save: **Robot Name**

---

## Phase 3: Configure Backend (5 minutes)

### In Student Mark Tracker App:

1. **Open Settings**
   - Log in as Teacher
   - Sidebar → UiPath Automation

2. **Enter All Fields**
   ```
   Orchestrator URL:    https://cloud.uipath.com/
   Tenant Name:         [from step 1]
   User Key:            [your email]
   API Token:           [generated token]
   Process Key:         StudentFailAlert
   Robot Name:          FailAlertRobot
   Enable UiPath:       ✓ CHECK
   ```

3. **Save & Test**
   - Click Save
   - Click "Send Test Email"
   - Verify test email received

---

## Verification Checklist

- ✓ Test email received from UiPath
- ✓ Orchestrator shows "Success" job status
- ✓ Configuration saved in backend
- ✓ UiPath enabled checkbox is checked

---

## Test with Real Fail Mark

1. **Enter Failing Mark**
   - Teacher → Marks → Add Mark
   - Enter mark **below** pass_marks
   - Submit

2. **Watch for Email** (1-2 minutes)
   - Check parent's inbox
   - Should see: "Important: [Student] - [Subject] Result"

3. **Verify in Orchestrator**
   - Jobs → Find recent StudentFailAlert job
   - Status should be: **Success**

---

## Gmail Setup (if using Gmail for SMTP)

```
Enable 2-Step Verification in Gmail
↓
Generate App Password
↓
In UiPath SMTP Activity:
  Host:     smtp.gmail.com
  Port:     587
  User:     your_email@gmail.com
  Password: [app_password, NOT Gmail password]
  SSL:      True
```

---

## Office 365 Setup (if using Office 365)

```
In UiPath SMTP Activity:
  Host:     smtp.office365.com
  Port:     587
  User:     your_email@company.com
  Password: [office365 password]
  SSL:      True
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Test email doesn't arrive | ✓ Check email activity settings in UiPath ✓ Test locally first ✓ Verify email credentials |
| Job shows "Faulted" | Check Orchestrator job logs for error details |
| "Process not found" | ✓ Verify process was published ✓ Check process_key spelling (case-sensitive) |
| "Failed to authenticate" | ✓ Verify API token is correct ✓ Regenerate new token |
| Email sent but empty | ✓ Check Body parameter is set correctly ✓ Verify IsBodyHtml = True |
| Slow email sending | ✓ Add more robots in Orchestrator ✓ Check network connectivity |

---

## Configuration Values Reference

**Save these values securely:**

```
UiPath Cloud URL:       https://cloud.uipath.com/
Tenant Name:            ___________________________
User Key:               ___________________________
API Token:              ___________________________
Process Key:            StudentFailAlert
Robot Name:             FailAlertRobot
SMTP Host (if used):    ___________________________
SMTP Port:              ___________________________
Email Account:          ___________________________
```

---

## Files to Review

| File | Purpose |
|------|---------|
| [UIPATH_FAIL_ALERTS_SETUP.md](UIPATH_FAIL_ALERTS_SETUP.md) | Complete detailed setup guide |
| [UIPATH_PROCESS_EXAMPLE.md](UIPATH_PROCESS_EXAMPLE.md) | Sample UiPath workflow code |
| [UIPATH_BACKEND_INTEGRATION.md](UIPATH_BACKEND_INTEGRATION.md) | Backend code explanation |
| [UIPATH_FAIL_ALERTS.md](UIPATH_FAIL_ALERTS.md) | Feature overview & architecture |

---

## Support Resources

1. **UiPath Documentation**: https://docs.uipath.com/
2. **UiPath Cloud Console**: https://cloud.uipath.com/
3. **Orchestrator Logs**: Execution → Jobs (for job-level debugging)
4. **Backend Logs**: Check application logs for API errors
5. **Email Activity Help**: In Studio, right-click activity → Help

---

## Success Indicators

✓ Teacher enters failing mark  
✓ No delay in UI response  
✓ Orchestrator shows job created  
✓ Parent receives email within 1-2 minutes  
✓ Email has correct student & exam details  
✓ No SMTP emails sent (only UiPath)  

---

## Next Steps After Deployment

- [ ] Document your specific email template
- [ ] Train teachers on system
- [ ] Monitor (Orchestrator → Jobs) for issues
- [ ] Add more robots if needed for scaling
- [ ] Back up configuration
- [ ] Set up email forwarding for audit trail (optional)

---

## Common Configuration Issues

### "Orchestrator URL not reachable"
- Firewalls blocking outbound HTTPS to cloud.uipath.com
- Solution: Contact IT to whitelist cloud.uipath.com or use on-premise Orchestrator

### "Invalid Process Key"
- Process name doesn't match published name exactly (case-sensitive)
- Solution: Verify process name in Studio matches what you entered in backend config

### "Robot offline"
- Robot machine not connected to Orchestrator
- Solution: Ensure robot machine has active connection to Orchestrator

### "Email credentials invalid in UiPath"
- Usually SMTP settings or app password incorrect
- Solution: Test SMTP settings directly in UiPath Studio first

---

## Scaling Guide

**Number of Email Jobs:**
- 1 robot: ~2-5 emails/minute
- 2 robots: ~5-10 emails/minute
- 3+ robots: ~15+ emails/minute

**For exam results with 100+ fail students:**
- Leave marks entry open over 2-3 hours
- Add 3-5 robots to Orchestrator
- Jobs will distribute automatically

---

## Monitoring Commands

**Check all fail emails sent:**
```
Orchestrator → Execution → Jobs
Filter: Process = "StudentFailAlert"
Group By: Status (see Success vs Failed)
```

**Check specific student's fail alerts:**
```
UI → Failed Students → Click student
See: When fail alert was sent, to which email
```

**Export audit trail:**
```
UI → Reports → Fail Alerts Sent
Download as CSV
```

---

## One-Liner Commands for Testing

**Test connection from backend server:**
```
curl https://cloud.uipath.com/api/Account/Authenticate \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"tenancyName":"TENANT","usernameOrEmailAddress":"USER@EMAIL","password":"TOKEN"}'
```

---

## Keeping Configuration Secure

- ✓ Never commit API token to Git
- ✓ Store token in environment variable (.env file)
- ✓ Rotate API token every 90 days
- ✓ Use different credentials per environment (dev/prod)
- ✓ Limit who can access UiPath settings (Teacher role only)

---

## Feature Complete When

✓ UiPath process created and tested  
✓ Process published to Orchestrator  
✓ Robot created and online  
✓ Backend configured with all credentials  
✓ Test email sent successfully  
✓ Real fail mark generates email  
✓ Email delivered to parent within 2-3 minutes  
✓ No errors in logs  

---

**Ready to go! Follow the detailed guides if you need more information.** 🚀
