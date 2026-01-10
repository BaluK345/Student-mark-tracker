import { useState, useEffect } from 'react';
import { studentsApi, reportsApi } from '../api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import {
    ChartBarIcon,
    PrinterIcon,
    UserGroupIcon,
    TrophyIcon,
} from '@heroicons/react/24/outline';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import type { Student, StudentReport, ClassReport } from '../types';

const Reports: React.FC = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
    const [studentReport, setStudentReport] = useState<StudentReport | null>(null);
    const [classReport, setClassReport] = useState<ClassReport | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingReport, setIsLoadingReport] = useState(false);
    const [viewMode, setViewMode] = useState<'student' | 'class'>('student');
    const [examType, setExamType] = useState('Final');
    const [selectedClass, setSelectedClass] = useState('');

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const response = await studentsApi.getAll();
                setStudents(response.students);
            } catch (error) {
                toast.error('Failed to fetch students');
            } finally {
                setIsLoading(false);
            }
        };
        fetchStudents();
    }, []);

    const fetchStudentReport = async (studentId: number) => {
        setIsLoadingReport(true);
        try {
            const report = await reportsApi.getStudentReport(studentId, examType);
            setStudentReport(report);
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to fetch report');
            setStudentReport(null);
        } finally {
            setIsLoadingReport(false);
        }
    };

    const fetchClassReport = async () => {
        if (!selectedClass) return;
        setIsLoadingReport(true);
        try {
            const report = await reportsApi.getClassReport(selectedClass, 'A', examType);
            setClassReport(report);
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to fetch class report');
            setClassReport(null);
        } finally {
            setIsLoadingReport(false);
        }
    };

    useEffect(() => {
        if (viewMode === 'student' && selectedStudent) {
            fetchStudentReport(selectedStudent);
        } else if (viewMode === 'class' && selectedClass) {
            fetchClassReport();
        }
    }, [selectedStudent, selectedClass, examType, viewMode]);

    const handlePrint = () => {
        if (!selectedStudent || !studentReport) return;
        const printUrl = `http://localhost:8000/api/reports/student/${selectedStudent}/html?exam_type=${examType}`;
        window.open(printUrl, '_blank');
    };

    const uniqueClasses = [...new Set(students.map((s) => s.class_name))].sort();

    const getGradeColor = (grade: string) => {
        if (grade.startsWith('A')) return 'text-emerald-400';
        if (grade.startsWith('B')) return 'text-blue-400';
        if (grade.startsWith('C')) return 'text-amber-400';
        return 'text-red-400';
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <LoadingSpinner size="lg" message="Loading..." />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in">
            {/* Header */}
            <div>
                <h1 className="page-title">Reports</h1>
                <p className="page-subtitle">View detailed student and class performance reports</p>
            </div>

            {/* View Mode Toggle */}
            <div className="card">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex rounded-xl bg-slate-800/50 p-1">
                        <button
                            onClick={() => setViewMode('student')}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${viewMode === 'student'
                                ? 'bg-primary-500 text-white'
                                : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            Student Report
                        </button>
                        <button
                            onClick={() => setViewMode('class')}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${viewMode === 'class'
                                ? 'bg-primary-500 text-white'
                                : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            Class Report
                        </button>
                    </div>

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {viewMode === 'student' ? (
                            <div>
                                <label className="label">Select Student</label>
                                <select
                                    value={selectedStudent || ''}
                                    onChange={(e) => setSelectedStudent(parseInt(e.target.value) || null)}
                                    className="select"
                                >
                                    <option value="">Choose a student</option>
                                    {students.map((student) => (
                                        <option key={student.id} value={student.id}>
                                            {student.full_name} ({student.roll_no})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <div>
                                <label className="label">Select Class</label>
                                <select
                                    value={selectedClass}
                                    onChange={(e) => setSelectedClass(e.target.value)}
                                    className="select"
                                >
                                    <option value="">Choose a class</option>
                                    {uniqueClasses.map((cls) => (
                                        <option key={cls} value={cls}>
                                            {cls}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div>
                            <label className="label">Exam Type</label>
                            <select
                                value={examType}
                                onChange={(e) => setExamType(e.target.value)}
                                className="select"
                            >
                                <option value="Final">Final Exam</option>
                                <option value="Midterm">Midterm</option>
                                <option value="Quiz">Quiz</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Report Content */}
            {isLoadingReport ? (
                <div className="flex items-center justify-center min-h-96">
                    <LoadingSpinner size="lg" message="Generating report..." />
                </div>
            ) : viewMode === 'student' && studentReport ? (
                /* Student Report */
                <div className="space-y-6">
                    {/* Student Info Card */}
                    <div className="card bg-gradient-to-br from-primary-500/10 to-secondary-500/10 border-primary-500/30">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center text-white text-2xl font-bold">
                                    {studentReport.student_name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">{studentReport.student_name}</h2>
                                    <p className="text-slate-400">
                                        Roll: {studentReport.roll_no} | Class: {studentReport.class_name}-
                                        {studentReport.section}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={handlePrint} className="btn-secondary flex items-center gap-2">
                                    <PrinterIcon className="w-5 h-5" />
                                    Print
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="card text-center">
                            <p className="text-3xl font-bold text-white">
                                {studentReport.total_marks}/{studentReport.total_max_marks}
                            </p>
                            <p className="text-sm text-slate-400">Total Marks</p>
                        </div>
                        <div className="card text-center">
                            <p className="text-3xl font-bold gradient-text">{studentReport.percentage}%</p>
                            <p className="text-sm text-slate-400">Percentage</p>
                        </div>
                        <div className="card text-center">
                            <p className={`text-3xl font-bold ${getGradeColor(studentReport.overall_grade)}`}>
                                {studentReport.overall_grade}
                            </p>
                            <p className="text-sm text-slate-400">Grade</p>
                        </div>
                        <div className="card text-center">
                            <p
                                className={`text-3xl font-bold ${studentReport.result === 'Pass' ? 'text-emerald-400' : 'text-red-400'
                                    }`}
                            >
                                {studentReport.result}
                            </p>
                            <p className="text-sm text-slate-400">Result</p>
                        </div>
                    </div>

                    {/* Subject Marks Table */}
                    <div className="card overflow-hidden p-0">
                        <div className="px-6 py-4 border-b border-slate-700/50">
                            <h3 className="text-lg font-semibold text-white">Subject-wise Marks</h3>
                        </div>
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Subject</th>
                                        <th>Code</th>
                                        <th>Marks</th>
                                        <th>Max</th>
                                        <th>Pass</th>
                                        <th>Status</th>
                                        <th>Grade</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {studentReport.subjects.map((subject, index) => (
                                        <tr key={index}>
                                            <td className="font-medium text-white">{subject.subject_name}</td>
                                            <td className="font-mono text-slate-400">{subject.subject_code}</td>
                                            <td className="font-semibold text-white">{subject.marks_obtained}</td>
                                            <td>{subject.max_marks}</td>
                                            <td>{subject.pass_marks}</td>
                                            <td>
                                                {subject.status === 'Pass' ? (
                                                    <span className="badge-success">Pass</span>
                                                ) : (
                                                    <span className="badge-danger">Fail</span>
                                                )}
                                            </td>
                                            <td>
                                                <span className={`font-bold ${getGradeColor(subject.grade)}`}>
                                                    {subject.grade}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Performance Chart */}
                    <div className="card">
                        <h3 className="text-lg font-semibold text-white mb-4">Performance Chart</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={studentReport.subjects.map((s) => ({
                                        name: s.subject_code,
                                        obtained: s.marks_obtained,
                                        pass: s.pass_marks,
                                    }))}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis dataKey="name" stroke="#94a3b8" />
                                    <YAxis stroke="#94a3b8" />
                                    <Tooltip
                                        contentStyle={{
                                            background: '#1e293b',
                                            border: '1px solid #334155',
                                            borderRadius: '8px',
                                        }}
                                    />
                                    <Legend />
                                    <Bar dataKey="obtained" name="Marks Obtained" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="pass" name="Pass Marks" fill="#64748b" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            ) : viewMode === 'class' && classReport ? (
                /* Class Report */
                <div className="space-y-6">
                    {/* Class Summary */}
                    <div className="card bg-gradient-to-br from-primary-500/10 to-secondary-500/10 border-primary-500/30">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center">
                                <UserGroupIcon className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">
                                    Class {classReport.class_name}-{classReport.section}
                                </h2>
                                <p className="text-slate-400">{classReport.exam_type} Examination Report</p>
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="card text-center">
                            <p className="text-3xl font-bold text-white">{classReport.total_students}</p>
                            <p className="text-sm text-slate-400">Total Students</p>
                        </div>
                        <div className="card text-center">
                            <p className="text-3xl font-bold text-emerald-400">{classReport.passed_students}</p>
                            <p className="text-sm text-slate-400">Passed</p>
                        </div>
                        <div className="card text-center">
                            <p className="text-3xl font-bold text-red-400">{classReport.failed_students}</p>
                            <p className="text-sm text-slate-400">Failed</p>
                        </div>
                        <div className="card text-center">
                            <p className="text-3xl font-bold gradient-text">{classReport.pass_percentage}%</p>
                            <p className="text-sm text-slate-400">Pass Rate</p>
                        </div>
                    </div>

                    {/* Top Performers */}
                    {classReport.top_performers.length > 0 && (
                        <div className="card">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <TrophyIcon className="w-5 h-5 text-amber-400" />
                                Top Performers
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                {classReport.top_performers.map((performer, index) => (
                                    <div
                                        key={index}
                                        className={`p-4 rounded-xl border ${index === 0
                                            ? 'bg-amber-500/10 border-amber-500/30'
                                            : index === 1
                                                ? 'bg-slate-400/10 border-slate-400/30'
                                                : index === 2
                                                    ? 'bg-orange-500/10 border-orange-500/30'
                                                    : 'bg-slate-800/50 border-slate-700/50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <span
                                                className={`text-2xl font-bold ${index === 0
                                                    ? 'text-amber-400'
                                                    : index === 1
                                                        ? 'text-slate-400'
                                                        : index === 2
                                                            ? 'text-orange-400'
                                                            : 'text-slate-500'
                                                    }`}
                                            >
                                                #{index + 1}
                                            </span>
                                        </div>
                                        <p className="font-semibold text-white">{performer.name}</p>
                                        <p className="text-sm text-slate-400">{performer.roll_no}</p>
                                        <p className="text-lg font-bold gradient-text mt-2">{performer.percentage}%</p>
                                        <span className={`text-sm ${getGradeColor(performer.grade)}`}>
                                            Grade: {performer.grade}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Subject-wise Stats */}
                    <div className="card">
                        <h3 className="text-lg font-semibold text-white mb-4">Subject-wise Analysis</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={classReport.subject_wise_stats}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis dataKey="subject" stroke="#94a3b8" />
                                    <YAxis stroke="#94a3b8" />
                                    <Tooltip
                                        contentStyle={{
                                            background: '#1e293b',
                                            border: '1px solid #334155',
                                            borderRadius: '8px',
                                        }}
                                    />
                                    <Legend />
                                    <Bar dataKey="average" name="Average Marks" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="pass_rate" name="Pass Rate %" fill="#10b981" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="card text-center py-16">
                    <ChartBarIcon className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                    <h3 className="text-xl font-semibold text-white mb-2">Select to View Report</h3>
                    <p className="text-slate-400">
                        Choose a {viewMode === 'student' ? 'student' : 'class'} to generate their report
                    </p>
                </div>
            )}
        </div>
    );
};

export default Reports;
