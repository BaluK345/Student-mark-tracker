# UiPath PAT Token Configuration Guide

## ✅ What Changed

The backend now uses **Personal Access Token (PAT)** authentication instead of old username/password approach. This is more secure and reliable.

## 🔋 Your Current Configuration Values

Based on your setup, here are your values:

```
Orchestrator URL:  https://cloud.uipath.com/baluayrkmcc/DefaultTenant/orchestrator_
Folder ID:         7659670
Process Name:      rpa project
PAT Token:         [YOUR_TOKEN_HERE]
```

---

## 📋 Step-by-Step Setup

### Step 1: Get Your PAT Token

1. Go to: **https://cloud.uipath.com/**
2. Log in with your account
3. Click your **Profile** (top right)
4. Go to **Preferences** → **Personal Access Tokens**
5. Click **Create Token**
6. Name: `StudentMarkTracker` (or any name)
7. Click **Create**
8. **Copy the generated token** (you won't see it again!)

### Step 2: Update Backend Configuration

The code is already updated! Now configure via the UI:

1. Open Student Mark Tracker application
2. Log in as **Teacher**
3. Go to **UiPath Automation** (Settings)
4. Fill in the form:

```
Orchestrator URL:  https://cloud.uipath.com/baluayrkmcc/DefaultTenant/orchestrator_
PAT Token:         [paste your token from Step 1]
Folder ID:         7659670
Process Name:      rpa project
Enable UiPath:     ✓ (check this)
```

5. Click **Save Configuration**
6. Click **Send Test Email** to verify

### Step 3: Verify It Works

1. Check your email for test message
2. Go to Orchestrator: https://cloud.uipath.com/
3. Go to **Execution** → **Jobs**
4. Look for recent **rpa project** job
5. Status should be: **Success** ✓

---

## 🆘 Troubleshooting

### Error: "Invalid PAT token"
- Copy-paste your token again (no spaces!)
- Make sure you created token in "Personal Access Tokens" section
- If expired, generate a new one

### Error: "Process not found"
- Process Name must match EXACTLY: `rpa project`
- Check in Orchestrator → Processes (verify spelling & case)

### Error: "Folder ID not found"
- Copy Folder ID from organization settings
- Current: `7659670` (should be correct)

### Email not arriving
- Check Orchestrator job log for error details
- Verify Gmail App Password is correct in UiPath process
- Check job status in Orchestrator

---

## 📝 Code Changes Made

The following files were updated:

1. **`uipath_service.py`**
   - Old: User/pass authentication → New: PAT token
   - Old: Multiple methods (authenticate, get_process_id, get_robot_id)
   - New: Simplified to use startJob endpoint

2. **`fail_alert_service.py`**
   - Updated client initialization to use PAT token

3. **`settings.py`**
   - Updated all endpoints to use new fields
   - Added validation for required fields

4. **`schemas/uipath_config.py`**
   - Updated request/response models

5. **`.env`**
   - Added new UiPath configuration fields
   - (Note: These are not used by the app yet - config through UI)

---

## 🎯 Testing Checklist

- [ ] PAT token generated from "Personal Access Tokens"
- [ ] Configuration saved in UiPath Automation settings
- [ ] Test email sent successfully
- [ ] Email received in inbox
- [ ] Orchestrator shows job status: Success
- [ ] Enter failing mark in app
- [ ] Parent receives email from UiPath
- [ ] Orchestrator shows new job

---

## 🔐 Security Notes

- ✓ PAT token is more secure than username/password
- ✓ PAT tokens can be revoked/regenerated anytime
- ✓ Never commit PAT token to Git
- ✓ Store safely (use environment variables in production)

---

## ✨ Benefits of PAT Token Approach

1. **More Reliable** - Direct API token, no authentication timeout
2. **Simpler** - One token, no username/password management
3. **Safer** - Can be easily revoked
4. **Better** - Works with cloud Orchestrator directly

---

## 📞 Next Steps

1. Generate PAT token from Preferences
2. Update UiPath Automation settings in app
3. Send test email
4. Test with real failing mark entry
5. Monitor jobs in Orchestrator

All done! Your system is ready to go. 🚀
