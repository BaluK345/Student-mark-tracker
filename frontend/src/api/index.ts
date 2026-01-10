import api from './client';
import type {
    User,
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    Student,
    StudentCreateRequest,
    StudentUpdateRequest,
    StudentListResponse,
    Subject,
    SubjectCreateRequest,
    SubjectUpdateRequest,
    SubjectListResponse,
    Mark,
    MarkCreateRequest,
    MarkBulkCreateRequest,
    MarkUpdateRequest,
    MarkListResponse,
    FailedStudent,
    StudentReport,
    ClassReport,
} from '../types';

// Auth API
export const authApi = {
    login: async (data: LoginRequest): Promise<AuthResponse> => {
        const response = await api.post('/auth/login/json', data);
        return response.data;
    },

    register: async (data: RegisterRequest): Promise<User> => {
        const response = await api.post('/auth/register', data);
        return response.data;
    },

    getCurrentUser: async (): Promise<User> => {
        const response = await api.get('/auth/me');
        return response.data;
    },
};

// Students API
export const studentsApi = {
    getAll: async (params?: {
        class_name?: string;
        section?: string;
        skip?: number;
        limit?: number;
    }): Promise<StudentListResponse> => {
        const response = await api.get('/students', { params });
        return response.data;
    },

    getById: async (id: number): Promise<Student> => {
        const response = await api.get(`/students/${id}`);
        return response.data;
    },

    create: async (data: StudentCreateRequest): Promise<Student> => {
        const response = await api.post('/students', data);
        return response.data;
    },

    update: async (id: number, data: StudentUpdateRequest): Promise<Student> => {
        const response = await api.put(`/students/${id}`, data);
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/students/${id}`);
    },
};

// Subjects API
export const subjectsApi = {
    getAll: async (params?: {
        skip?: number;
        limit?: number;
    }): Promise<SubjectListResponse> => {
        const response = await api.get('/subjects', { params });
        return response.data;
    },

    getById: async (id: number): Promise<Subject> => {
        const response = await api.get(`/subjects/${id}`);
        return response.data;
    },

    create: async (data: SubjectCreateRequest): Promise<Subject> => {
        const response = await api.post('/subjects', data);
        return response.data;
    },

    update: async (id: number, data: SubjectUpdateRequest): Promise<Subject> => {
        const response = await api.put(`/subjects/${id}`, data);
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/subjects/${id}`);
    },
};

// Marks API
export const marksApi = {
    getAll: async (params?: {
        student_id?: number;
        subject_id?: number;
        exam_type?: string;
        class_name?: string;
        skip?: number;
        limit?: number;
    }): Promise<MarkListResponse> => {
        const response = await api.get('/marks', { params });
        return response.data;
    },

    create: async (data: MarkCreateRequest): Promise<Mark> => {
        const response = await api.post('/marks', data);
        return response.data;
    },

    createBulk: async (data: MarkBulkCreateRequest): Promise<Mark[]> => {
        const response = await api.post('/marks/bulk', data);
        return response.data;
    },

    update: async (id: number, data: MarkUpdateRequest): Promise<Mark> => {
        const response = await api.put(`/marks/${id}`, data);
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/marks/${id}`);
    },

    getFailedStudents: async (params?: {
        class_name?: string;
        subject_id?: number;
        exam_type?: string;
    }): Promise<FailedStudent[]> => {
        const response = await api.get('/marks/failed', { params });
        return response.data;
    },
};

// Reports API
export const reportsApi = {
    getStudentReport: async (
        studentId: number,
        examType: string = 'Final'
    ): Promise<StudentReport> => {
        const response = await api.get(`/reports/student/${studentId}`, {
            params: { exam_type: examType },
        });
        return response.data;
    },

    getMyReport: async (examType: string = 'Final'): Promise<StudentReport> => {
        const response = await api.get('/reports/my-report', {
            params: { exam_type: examType },
        });
        return response.data;
    },

    getClassReport: async (
        className: string,
        section: string = 'A',
        examType: string = 'Final'
    ): Promise<ClassReport> => {
        const response = await api.get(`/reports/class/${className}`, {
            params: { section, exam_type: examType },
        });
        return response.data;
    },

    getStudentReportHtml: (studentId: number, examType: string = 'Final'): string => {
        const token = localStorage.getItem('token');
        return `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/reports/student/${studentId}/html?exam_type=${examType}&token=${token}`;
    },
};
