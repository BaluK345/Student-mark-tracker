# Student Mark Tracker - Data Upload, Visualization & Email Features

## 🎉 New Features Added

### 1. **CSV/Excel Data Upload** 📊
- Upload student data via CSV or Excel files
- Automatic data validation and preview
- Support for custom columns including email addresses
- Real-time statistics display

### 2. **Analytics Dashboard** 📈
- **Grade Distribution Chart** - Visual breakdown of student grades (A, B, C, D, F)
- **Pass/Fail Distribution** - Pie chart showing pass vs fail rates
- **Subject Performance** - Bar chart comparing average marks across subjects
- **Summary Statistics** - Total students, pass rate, average marks, etc.

### 3. **Email Reports** ✉️
- Send performance reports to students and parents
- Bulk email functionality with filters (all/failed/passed students)
- Customizable email subject and message
- Real-time sending status and results
- Beautiful HTML email templates with student marks

## 🚀 Setup Instructions

### Backend Setup

1. **Install new Python dependencies:**
```bash
cd backend
pip install -r requirements.txt
```

New packages added:
- `pandas` - For CSV/Excel processing
- `matplotlib` - For chart generation
- `openpyxl` - For Excel file support

2. **Configure Email Settings:**

Edit `backend/.env` file:
```env
# Email SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=your-email@gmail.com
SMTP_FROM_NAME=Student Mark Tracker
```

**For Gmail:**
- Enable 2-Factor Authentication
- Generate an App Password: https://myaccount.google.com/apppasswords
- Use the app password in `SMTP_PASSWORD`

3. **Start the backend:**
```bash
cd backend
uvicorn app.main:app --reload
```

### Frontend Setup

1. **Install lucide-react (if not already installed):**
```bash
cd frontend
npm install lucide-react
```

2. **Start the frontend:**
```bash
npm run dev
```

## 📋 Usage Guide

### Data Upload Page (`/data-upload`)

1. Navigate to **Data Upload** from the sidebar
2. Click to select or drag-and-drop a CSV/Excel file
3. Click "Upload and Process"
4. View statistics and data preview

**CSV Format Example:**
```csv
name,email,roll_no,class,subject,marks
John Doe,john@example.com,001,10A,Math,85
Jane Smith,jane@example.com,002,10A,Math,92
```

### Analytics Dashboard (`/analytics`)

1. Navigate to **Analytics** from the sidebar
2. View comprehensive visualizations:
   - Grade distribution pie chart
   - Pass/fail distribution
   - Subject-wise performance bars
   - Summary statistics cards
3. Click "Refresh" to update data

### Email Reports (`/email-reports`)

1. Navigate to **Email Reports** from the sidebar
2. **Option A - Select specific students:**
   - Check students from the list
   - Customize subject and message
   - Click "Send to Selected"

3. **Option B - Bulk send:**
   - Choose filter (All/Failed/Passed students)
   - Customize subject and message
   - Click "Send Bulk"

4. View sending results and status

## 🎨 Features Highlights

### Email Templates
- Professional HTML design with gradients
- Student performance table
- Overall percentage and statistics
- Pass/Fail status with color coding
- Personalized for each student

### Visualizations
- **Interactive Charts** - Generated using matplotlib
- **Real-time Data** - Automatically updates from database
- **Export Ready** - Base64 encoded images
- **Responsive Design** - Works on all screen sizes

### Data Processing
- **Automatic Validation** - Checks for required columns
- **Missing Data Handling** - Identifies and reports missing values
- **Type Detection** - Automatically identifies numeric columns
- **Preview Mode** - Shows first 10 rows before full import

## 🔧 API Endpoints

### Data Upload
```
POST /api/data/upload-csv
- Upload CSV/Excel file
- Returns: stats, preview, column info
```

### Visualizations
```
GET /api/data/analytics/summary
- Get all charts and statistics
- Returns: charts (base64), summary stats

GET /api/data/visualizations/grade-distribution
GET /api/data/visualizations/subject-performance
GET /api/data/visualizations/pass-fail
```

### Email
```
POST /api/data/send-reports
- Send emails to selected students
- Body: { student_ids, subject, message }

POST /api/data/send-bulk-reports
- Send bulk emails with filters
- Body: { filter_type, subject, message }
```

## 📧 Email Configuration Tips

### Gmail Setup
1. Go to Google Account settings
2. Enable 2-Step Verification
3. Generate App Password for "Mail"
4. Use this password in `.env`

### Other Providers
- **Outlook**: `smtp.office365.com:587`
- **Yahoo**: `smtp.mail.yahoo.com:587`
- **Custom SMTP**: Configure your server details

## 🎯 Navigation

New menu items added to sidebar:
- 📊 **Data Upload** - Upload CSV/Excel files
- 📈 **Analytics** - View charts and statistics
- ✉️ **Email Reports** - Send performance reports

## 🐛 Troubleshooting

### Email not sending?
- Check SMTP credentials in `.env`
- Verify parent_email exists in student records
- Check firewall/antivirus settings
- Enable "Less secure app access" (Gmail)

### Charts not displaying?
- Ensure matplotlib is installed
- Check backend logs for errors
- Verify database has mark data

### CSV upload fails?
- Check file format (CSV or XLSX only)
- Ensure file size < 10MB
- Verify headers are in first row

## 📊 Sample CSV Template

```csv
name,email,parent_email,roll_no,class,section,subject,marks,max_marks
John Doe,john@email.com,parent@email.com,001,10,A,Mathematics,85,100
Jane Smith,jane@email.com,parent2@email.com,002,10,A,Mathematics,92,100
```

## 🎨 UI Features

- **Gradient Backgrounds** - Modern, eye-catching design
- **Shadow Effects** - Depth and dimension
- **Smooth Animations** - Loading states and transitions
- **Responsive Layout** - Mobile-friendly
- **Toast Notifications** - Success/error feedback

## 📝 Notes

- Email templates are fully customizable in `backend/app/services/email_service.py`
- Chart colors and styles can be modified in `backend/app/services/data_service.py`
- All visualizations are generated server-side for security
- Emails are sent asynchronously to avoid blocking

## 🔐 Security

- All endpoints require authentication
- File uploads are validated
- Email addresses are sanitized
- SMTP credentials stored in environment variables
- No sensitive data in frontend

---

**Enjoy your enhanced Student Mark Tracker! 🎓✨**
