from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import engine, Base
from app.api.routes import auth, students, subjects, marks, reports, data

# Import models to ensure they're registered
from app.models import user, student, subject, mark


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create database tables on startup."""
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Student Mark Tracker API",
    description="""
    A comprehensive API for managing student marks, generating reports, 
    and automatically notifying parents about student performance.
    
    ## Features
    
    * **Authentication** - JWT-based authentication for teachers and students
    * **Student Management** - Add, update, and manage student records
    * **Subject Management** - Create subjects with configurable pass marks
    * **Mark Entry** - Enter and edit marks with automatic pass/fail detection
    * **Auto Email Alerts** - Automatically notify parents when students fail
    * **Reports** - Generate detailed student and class reports
    """,
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(auth.router, prefix="/api")
app.include_router(students.router, prefix="/api")
app.include_router(subjects.router, prefix="/api")
app.include_router(marks.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(data.router, prefix="/api/data", tags=["Data & Analytics"])


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": "Student Mark Tracker API",
        "version": "1.0.0",
        "docs_url": "/docs",
        "redoc_url": "/redoc"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}
