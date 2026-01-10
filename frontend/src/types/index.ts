// User types
export interface User {
    id: number;
    email: string;
    full_name: string;
    role: 'teacher' | 'student' | 'parent';
    created_at: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    full_name: string;
    role: string;
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
}

// Student types
export interface Student {
    id: number;
    user_id: number;
    roll_no: string;
    class_name: string;
    section: string;
    parent_name: string | null;
    parent_email: string | null;
    parent_phone: string | null;
    created_at: string;
    full_name: string | null;
    email: string | null;
}

export interface StudentCreateRequest {
    email: string;
    password: string;
    full_name: string;
    roll_no: string;
    class_name: string;
    section: string;
    parent_name?: string;
    parent_email?: string;
    parent_phone?: string;
}

export interface StudentUpdateRequest {
    roll_no?: string;
    class_name?: string;
    section?: string;
    parent_name?: string;
    parent_email?: string;
    parent_phone?: string;
}

// Subject types
export interface Subject {
    id: number;
    name: string;
    code: string;
    max_marks: number;
    pass_marks: number;
    teacher_id: number | null;
    created_at: string;
    teacher_name: string | null;
}

export interface SubjectCreateRequest {
    name: string;
    code: string;
    max_marks: number;
    pass_marks: number;
    teacher_id?: number;
}

export interface SubjectUpdateRequest {
    name?: string;
    code?: string;
    max_marks?: number;
    pass_marks?: number;
    teacher_id?: number;
}

// Mark types
export interface Mark {
    id: number;
    student_id: number;
    subject_id: number;
    marks_obtained: number;
    exam_type: string;
    remarks: string | null;
    status: 'Pass' | 'Fail';
    entered_by: number;
    created_at: string;
    student_name: string | null;
    subject_name: string | null;
    max_marks: number | null;
    pass_marks: number | null;
}

export interface MarkCreateRequest {
    student_id: number;
    subject_id: number;
    marks_obtained: number;
    exam_type: string;
    remarks?: string;
}

export interface MarkBulkCreateRequest {
    subject_id: number;
    exam_type: string;
    marks: Array<{
        student_id: number;
        marks_obtained: number;
    }>;
}

export interface MarkUpdateRequest {
    marks_obtained?: number;
    remarks?: string;
}

export interface FailedStudent {
    student_id: number;
    student_name: string;
    roll_no: string;
    class_name: string;
    subject_name: string;
    marks_obtained: number;
    max_marks: number;
    pass_marks: number;
    parent_email: string | null;
    email_sent: boolean;
}

// Report types
export interface SubjectMark {
    subject_name: string;
    subject_code: string;
    marks_obtained: number;
    max_marks: number;
    pass_marks: number;
    status: string;
    grade: string;
}

export interface StudentReport {
    student_id: number;
    student_name: string;
    roll_no: string;
    class_name: string;
    section: string;
    exam_type: string;
    subjects: SubjectMark[];
    total_marks: number;
    total_max_marks: number;
    percentage: number;
    overall_grade: string;
    result: 'Pass' | 'Fail';
    generated_at: string;
}

export interface ClassReport {
    class_name: string;
    section: string;
    exam_type: string;
    total_students: number;
    passed_students: number;
    failed_students: number;
    pass_percentage: number;
    subject_wise_stats: Array<{
        subject: string;
        average: number;
        max_marks: number;
        passed: number;
        failed: number;
        pass_rate: number;
    }>;
    top_performers: Array<{
        name: string;
        roll_no: string;
        total: number;
        percentage: number;
        grade: string;
    }>;
}

// List response types
export interface StudentListResponse {
    students: Student[];
    total: number;
}

export interface SubjectListResponse {
    subjects: Subject[];
    total: number;
}

export interface MarkListResponse {
    marks: Mark[];
    total: number;
}
