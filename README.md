# Student Mark Tracker 📚

A comprehensive **Student Mark Tracker** system built with modern technologies. Teachers can enter marks, the system auto-detects failed students and sends email alerts to parents, and each student gets a detailed report view.

![Tech Stack](https://img.shields.io/badge/React-18-blue?logo=react)
![Tech Stack](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tech Stack](https://img.shields.io/badge/Tailwind-3-blue?logo=tailwindcss)
![Tech Stack](https://img.shields.io/badge/FastAPI-0.109-green?logo=fastapi)
![Tech Stack](https://img.shields.io/badge/PostgreSQL-15-blue?logo=postgresql)

## ✨ Features

### For Teachers
- 🔐 **Secure Login** - JWT-based authentication
- 👨‍🎓 **Student Management** - Add, edit, and delete students
- 📚 **Subject Management** - Create subjects with custom pass marks
- ✍️ **Mark Entry** - Enter marks individually or in bulk
- 📊 **Dashboard** - Overview of all statistics and charts
- ❌ **Failed Students List** - See all failed students at a glance
- 📈 **Reports** - Generate student and class reports

### For Students
- 🔐 **Secure Login** - Access only your own data
- 📊 **Personal Report Card** - View subject-wise marks and grades
- 📈 **Performance Charts** - Visual representation of your marks
- 🏆 **Grade Calculation** - Automatic grade (A+, A, B+, etc.)

### System Features
- 🔄 **Auto Pass/Fail Detection** - Marks are auto-evaluated
- 📧 **Email Alerts** - Parents notified when student fails
- 📱 **Responsive Design** - Works on all devices
- 🎨 **Modern UI** - Glassmorphism and premium design

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Router v6** for navigation
- **Axios** for API calls
- **Recharts** for charts
- **React Hot Toast** for notifications
- **Heroicons** for icons

### Backend
- **FastAPI** (Python)
- **SQLAlchemy** ORM
- **PostgreSQL** database
- **JWT** authentication
- **aiosmtplib** for email

## 📁 Project Structure

```
Student-mark-tracker/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes/
│   │   │       ├── auth.py
│   │   │       ├── students.py
│   │   │       ├── subjects.py
│   │   │       ├── marks.py
│   │   │       └── reports.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── database.py
│   │   │   └── security.py
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── student.py
│   │   │   ├── subject.py
│   │   │   └── mark.py
│   │   ├── schemas/
│   │   │   ├── user.py
│   │   │   ├── student.py
│   │   │   ├── subject.py
│   │   │   ├── mark.py
│   │   │   └── report.py
│   │   ├── services/
│   │   │   ├── email_service.py
│   │   │   └── report_service.py
│   │   └── main.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── pages/
│   │   └── types/
│   ├── package.json
│   ├── tailwind.config.js
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- PostgreSQL 15+ (or Docker)

### Option 1: Using Docker (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd Student-mark-tracker

# Start all services
docker-compose up -d

# Access the application
# Frontend: http://localhost:5173
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Option 2: Manual Setup

#### Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create PostgreSQL database
createdb student_tracker

# Copy environment file and update settings
cp .env.example .env
# Edit .env with your database credentials

# Run the server
uvicorn app.main:app --reload
```

#### Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## 📧 Email Configuration

To enable email alerts for failed students, configure SMTP in `backend/.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=your-email@gmail.com
SMTP_FROM_NAME=Student Mark Tracker
```

> **Note:** For Gmail, you need to create an [App Password](https://support.google.com/accounts/answer/185833)

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get token
- `GET /api/auth/me` - Get current user

### Students
- `GET /api/students` - List all students
- `POST /api/students` - Create student
- `PUT /api/students/{id}` - Update student
- `DELETE /api/students/{id}` - Delete student

### Subjects
- `GET /api/subjects` - List all subjects
- `POST /api/subjects` - Create subject
- `PUT /api/subjects/{id}` - Update subject
- `DELETE /api/subjects/{id}` - Delete subject

### Marks
- `GET /api/marks` - List all marks
- `POST /api/marks` - Enter single mark
- `POST /api/marks/bulk` - Bulk enter marks
- `PUT /api/marks/{id}` - Update mark
- `GET /api/marks/failed` - Get failed students

### Reports
- `GET /api/reports/student/{id}` - Student report
- `GET /api/reports/student/{id}/html` - Printable report
- `GET /api/reports/my-report` - Current student's report
- `GET /api/reports/class/{name}` - Class report

## 📊 Database Schema

### Users
| Column | Type | Description |
|--------|------|-------------|
| id | Integer | Primary key |
| email | String | Unique email |
| hashed_password | String | Bcrypt hash |
| full_name | String | User's name |
| role | String | teacher/student |

### Students
| Column | Type | Description |
|--------|------|-------------|
| id | Integer | Primary key |
| user_id | Integer | FK to Users |
| roll_no | String | Unique roll number |
| class_name | String | e.g., "10th Grade" |
| section | String | A, B, C, etc. |
| parent_email | String | For email alerts |

### Subjects
| Column | Type | Description |
|--------|------|-------------|
| id | Integer | Primary key |
| name | String | Subject name |
| code | String | e.g., "MATH101" |
| max_marks | Integer | Maximum marks |
| pass_marks | Integer | Minimum to pass |

### Marks
| Column | Type | Description |
|--------|------|-------------|
| id | Integer | Primary key |
| student_id | Integer | FK to Students |
| subject_id | Integer | FK to Subjects |
| marks_obtained | Integer | Marks scored |
| status | String | Pass/Fail |
| exam_type | String | Final/Midterm |

## 🎨 Screenshots

The application features a modern dark theme with:
- Glassmorphism effects
- Gradient backgrounds
- Smooth animations
- Responsive design
- Interactive charts

## 🙏 Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [React](https://reactjs.org/) - UI library
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Recharts](https://recharts.org/) - Chart library
- [Heroicons](https://heroicons.com/) - Beautiful icons

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

---

Made with ❤️ for educators and students
