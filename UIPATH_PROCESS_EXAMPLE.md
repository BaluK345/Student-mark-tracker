# UiPath Fail Alert Process - Sample Implementation

This document shows the exact UiPath workflow structure you should create.

---

## Project Structure

```
StudentFailAlertNotification/
├── project.json
├── Main.xaml
└── Configuration/
    └── Settings.xlsx (optional)
```

---

## Main.xaml - Complete Workflow

### 1. Arguments Definition

Add these in the **Arguments** panel:

```
Name: RecipientEmail
Type: String
Direction: In

Name: Subject
Type: String
Direction: In

Name: Body
Type: String
Direction: In

Name: StudentName
Type: String
Direction: In

Name: RollNumber
Type: String
Direction: In
```

### 2. Main Workflow Using Outlook

**Recommended if you have Outlook installed:**

```sml
This is the sequence structure you'll create in Studio:

Try:
  Sequence:
    Activity: Send Outlook Mail Message
      ├─ To: RecipientEmail
      ├─ Subject: Subject
      ├─ Body: Body
      ├─ IsBodyHtml: True
      └─ BlockScope: False
    
    Activity: Write Log
      ├─ Message: "Email successfully sent to " + RecipientEmail
      └─ Level: Information

Catch (Exception as e):
  Activity: Write Log
    ├─ Message: "Failed to send email to " + RecipientEmail + ": " + exception.Message
    └─ Level: Error
```

### 3. Main Workflow Using SMTP (Gmail Example)

**If using Gmail or generic SMTP server:**

```sml
Try:
  Sequence:
    Activity: Send SMTP Mail Message
      ├─ To: RecipientEmail
      ├─ Subject: Subject
      ├─ Body: Body
      ├─ Host: "smtp.gmail.com"
      ├─ Port: 587
      ├─ UserName: your_email@gmail.com
      ├─ Password: your_app_password (NOT your Gmail password)
      ├─ EnableSSL: True
      ├─ IsBodyHtml: True
      └─ BlockScope: False
    
    Activity: Write Log
      ├─ Message: "Email sent successfully to: " + RecipientEmail
      └─ Level: Information

Catch (Exception as e):
  Activity: Write Log
    ├─ Message: "Error sending to " + RecipientEmail + ": " + e.Message
    └─ Level: Error
  
  Activity: Throw
    └─ (Re-throws the exception to Orchestrator)
```

### 4. Main Workflow Using Office 365

**If using Outlook 365:**

```sml
Try:
  Sequence:
    Activity: Log In: Use Send Outlook or SMTP
    
    If Office 365 Mailbox:
      Activity: Send SMTP Mail Message
        ├─ Host: "smtp.office365.com"
        ├─ Port: 587
        ├─ UserName: your_office_email@company.com
        ├─ Password: your_password
        ├─ EnableSSL: True
        └─ (Other fields same as above)

Catch (Exception as e):
  Activity: Write Log
    ├─ Message: "Office 365 email failed: " + e.Message
    └─ Level: Error
```

---

## Complete XAML Code Example

Here's what the actual XAML file might look like (Outlook version):

```xml
<Activity mc:Ignorable="sap sap2010" x:Class="Main" 
    xmlns="http://schemas.microsoft.com/netfx/2009/xaml/activities" 
    xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" 
    xmlns:sap="http://schemas.microsoft.com/netfx/2009/xaml/activities/presentation" 
    xmlns:sap2010="http://schemas.microsoft.com/netfx/2010/xaml/activities/presentation" 
    xmlns:scg="clr-namespace:System.Collections.Generic;assembly=System" 
    xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml">
  
  <x:Members>
    <x:Property Name="RecipientEmail" Type="InArgument(x:String)" />
    <x:Property Name="Subject" Type="InArgument(x:String)" />
    <x:Property Name="Body" Type="InArgument(x:String)" />
    <x:Property Name="StudentName" Type="InArgument(x:String)" />
    <x:Property Name="RollNumber" Type="InArgument(x:String)" />
  </x:Members>

  <sap:VirtualizedContainerService.HintSize>652,676</sap:VirtualizedContainerService.HintSize>
  <mva:VisualBasic.Settings>Multiple Imports</mva:VisualBasic.Settings>
  <FlowChart DisplayName="Main" sap:VirtualizedContainerService.HintSize="652,676">
    <FlowChart.StartNode>
      <FlowStep x:Name="node_1" sap:VirtualizedContainerService.HintSize="200,74">
        <TryCatch DisplayName="Try-Catch" sap:VirtualizedContainerService.HintSize="200,200">
          <TryCatch.Try>
            <Sequence DisplayName="Sequence" sap:VirtualizedContainerService.HintSize="200,100">
              <ui:SendOutlookMailMessage 
                  DisplayName="Send Outlook Mail Message" 
                  To="[RecipientEmail]"
                  Subject="[Subject]"
                  Body="[Body]"
                  IsBodyHtml="True" />
              
              <Trace DisplayName="Write Log" 
                  Message="[&quot;Email sent to: &quot; + RecipientEmail]" 
                  Level="Information" />
            </Sequence>
          </TryCatch.Try>
          
          <TryCatch.Catches>
            <Catch x:TypeArguments="x:Exception" sap:VirtualizedContainerService.HintSize="330,20">
              <sap:WorkflowViewStateService.ViewState>
                <scg:Dictionary x:TypeArguments="x:String,x:Object">
                  <x:Boolean x:Key="IsExpanded">True</x:Boolean>
                  <x:Boolean x:Key="IsPinned">False</x:Boolean>
                </scg:Dictionary>
              </sap:WorkflowViewStateService.ViewState>
              <ActivityAction x:TypeArguments="x:Exception">
                <ActivityAction.Argument>
                  <DelegateInArgument x:TypeArguments="x:Exception" Name="exception" />
                </ActivityAction.Argument>
                <Sequence DisplayName="Catch" sap:VirtualizedContainerService.HintSize="200,100">
                  <Trace DisplayName="Write Log Error" 
                      Message="[&quot;Failed to send email: &quot; + exception.Message]" 
                      Level="Error" />
                </Sequence>
              </ActivityAction>
            </Catch>
          </TryCatch.Catches>
        </TryCatch>
      </FlowStep>
    </FlowChart.StartNode>
  </FlowChart>
</Activity>
```

---

## Step-by-Step Creation in Studio UI

### Creating Workflow Visually

**1. Create Sequence in Main:**
   - Double-click Main.xaml
   - From Activities pane, drag **"Sequence"** into the canvas
   - This is your main container

**2. Add Send Email Activity:**
   - Search Activities for: "Send Outlook Mail Message" or "Send SMTP Mail Message"
   - Drag into Sequence
   - Click on activity → Properties panel
   - Set properties (as shown above)

**3. Add Error Handling:**
   - Select the Sequence
   - Right-click → **Wrap**  → **Try Catch**
   - UiPath wraps it automatically

**4. Add Logging:**
   - Search Activities for: "Write Log"
   - Drag after email send activity
   - Set Message property with your message

**5. Define Arguments:**
   - Bottom panel → **Arguments** tab
   - Click **Create Argument**
   - Add each argument from table above

---

## Testing the Workflow Locally

### Test in UiPath Studio

1. **Set Test Data in Invoke:**
   - Go to **Invoke** → **Invoke Main**
   - Set test values:
     - RecipientEmail: `your_test_email@gmail.com`
     - Subject: `Test Email Subject`
     - Body: `This is a test email body`
     - StudentName: `Test Student`
     - RollNumber: `TEST001`

2. **Run the Workflow:**
   - Click **Run** button
   - Wait for execution to complete
   - Check your test email inbox

3. **Debug Issues:**
   - If test email doesn't arrive:
     - Check email account credentials
     - Verify SMTP settings (port, host, SSL)
     - Check email account security settings

---

## Key Activities Reference

### Send Outlook Mail Message Activity

**When to use**: If Outlook is installed on the machine

**Configuration:**
```
To: recipient_email_address
Subject: email_subject
Body: email_body_text
IsBodyHtml: True (for formatted emails)
CC: (optional)
BCC: (optional)
Attachments: (optional)
```

### Send SMTP Mail Message Activity

**When to use**: Gmail, Office 365, custom SMTP server

**Configuration:**
```
Host: smtp.gmail.com (Gmail)
      smtp.office365.com (Office 365)
      mail.your-server.com (Custom)

Port: 587 (most common for TLS)
      25 (unencrypted)
      465 (SMTPS)

UserName: your_email@domain.com
Password: your_password (or app-specific password for Gmail)
To: recipient_email
Subject: email_subject
Body: email_body_text
IsBodyHtml: True
EnableSSL: True (for secure connection)
```

---

## Gmail Configuration in UiPath

If using **Gmail** with UiPath:

1. **Enable 2-Step Verification** in Gmail account
2. **Generate App Password**:
   - Go to myaccount.google.com
   - Security → App passwords
   - Select "Mail" and "Windows Computer"
   - Copy the generated password
3. **In UiPath Process:**
   - UserName: `your_email@gmail.com`
   - Password: `[app_password]` (NOT your Gmail password)
   - Host: `smtp.gmail.com`
   - Port: `587`
   - EnableSSL: `True`

---

## Office 365 Configuration in UiPath

If using **Office 365** with UiPath:

1. **Enable SMTP Authentication** in Office 365 admin
2. **In UiPath Process:**
   - UserName: `your_email@company.com`
   - Password: `your_office_password`
   - Host: `smtp.office365.com`
   - Port: `587`
   - EnableSSL: `True`

---

## Common Issues & Fixes

### Issue: "The SMTP server requires a secure connection"
**Fix**: Set EnableSSL = True

### Issue: "Authentication failed for user"
**Fix**: 
- Verify correct username/password
- For Gmail: Use app-specific password, not Gmail password
- Check account hasn't locked due to login attempts

### Issue: "Host not found" or "Connection refused"
**Fix**: 
- Verify SMTP host is correct
- Check firewall allows outbound connections to SMTP port
- Try different port (587, 25, or 465)

### Issue: "Timed out connecting to SMTP server"
**Fix**:
- Check network connectivity
- Verify firewall/proxy not blocking
- Try from different network

### Issue: "Mail activity not found in Activities pane"
**Fix**:
- Install UiPath.Mail.Activities NuGet package
- Or use UiPath.System.Activities for Outlook

---

## Sample Process Output

When executed successfully, your workflow will:

1. Log into email system (Outlook/SMTP)
2. Compose email with provided parameters
3. Send email to RecipientEmail
4. Log: `"Email sent to: parent@example.com"`
5. Return successfully to Orchestrator

**In Orchestrator, you'll see:**
- Job Status: **Success**
- Job Logs: Show execution steps and email sent confirmation

---

## Publishing Checklist

Before publishing to Orchestrator:

- ✓ All arguments defined correctly
- ✓ Email activity configured with test credentials
- ✓ Error handling (Try-Catch) implemented
- ✓ Logging statements added
- ✓ Test email sent successfully locally
- ✓ Project saved
- ✓ Project.json has correct name

---

## Next Steps After Deployment

1. Publish to Orchestrator (follow UIPATH_FAIL_ALERTS_SETUP.md)
2. Configure backend with credentials
3. Send test email from application
4. Test with real fail mark entry
5. Verify parent receives email

---
