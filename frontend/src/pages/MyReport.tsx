import { useState, useEffect } from 'react';
import { reportsApi } from '../api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import {
    ChartBarIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
} from 'recharts';
import type { StudentReport } from '../types';

const MyReport: React.FC = () => {
    const [report, setReport] = useState<StudentReport | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [examType, setExamType] = useState('Final');

    const fetchReport = async () => {
        setIsLoading(true);
        try {
            const reportData = await reportsApi.getMyReport(examType);
            setReport(reportData);
        } catch (error: any) {
            if (error.response?.status === 404) {
                setReport(null);
            } else {
                toast.error(error.response?.data?.detail || 'Failed to fetch report');
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, [examType]);

    const getGradeColor = (grade: string) => {
        if (grade.startsWith('A')) return 'text-emerald-400';
        if (grade.startsWith('B')) return 'text-blue-400';
        if (grade.startsWith('C')) return 'text-amber-400';
        return 'text-red-400';
    };

    const getGradeBgColor = (grade: string) => {
        if (grade.startsWith('A')) return 'from-emerald-500/20 to-emerald-600/20 border-emerald-500/30';
        if (grade.startsWith('B')) return 'from-blue-500/20 to-blue-600/20 border-blue-500/30';
        if (grade.startsWith('C')) return 'from-amber-500/20 to-amber-600/20 border-amber-500/30';
        return 'from-red-500/20 to-red-600/20 border-red-500/30';
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <LoadingSpinner size="lg" message="Loading your report..." />
            </div>
        );
    }

    if (!report) {
        return (
            <div className="space-y-6 animate-in">
                <div>
                    <h1 className="page-title">My Report Card</h1>
                    <p className="page-subtitle">View your academic performance</p>
                </div>

                <div className="card text-center py-16">
                    <ChartBarIcon className="w-20 h-20 mx-auto mb-4 text-slate-600" />
                    <h3 className="text-2xl font-semibold text-white mb-2">No Report Available</h3>
                    <p className="text-slate-400">
                        Your marks haven't been entered yet. Please check back later.
                    </p>
                </div>
            </div>
        );
    }

    const radarData = report.subjects.map((subject) => ({
        subject: subject.subject_code,
        score: (subject.marks_obtained / subject.max_marks) * 100,
        fullMark: 100,
    }));

    return (
        <div className="space-y-6 animate-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="page-title">My Report Card 📊</h1>
                    <p className="page-subtitle">View your academic performance and grades</p>
                </div>
                <div className="flex items-center gap-4">
                    <select
                        value={examType}
                        onChange={(e) => setExamType(e.target.value)}
                        className="select w-40"
                    >
                        <option value="Final">Final Exam</option>
                        <option value="Midterm">Midterm</option>
                        <option value="Quiz">Quiz</option>
                    </select>
                </div>
            </div>

            {/* Student Info & Result */}
            <div
                className={`card bg-gradient-to-br ${getGradeBgColor(report.overall_grade)} border`}
            >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                            {report.student_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">{report.student_name}</h2>
                            <p className="text-slate-400">
                                Roll No: {report.roll_no} | Class: {report.class_name}-{report.section}
                            </p>
                            <p className="text-sm text-slate-500">{report.exam_type} Examination</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl ${report.result === 'Pass'
                                ? 'bg-emerald-500/20 border border-emerald-500/30'
                                : 'bg-red-500/20 border border-red-500/30'
                                }`}
                        >
                            {report.result === 'Pass' ? (
                                <CheckCircleIcon className="w-8 h-8 text-emerald-400" />
                            ) : (
                                <ExclamationTriangleIcon className="w-8 h-8 text-red-400" />
                            )}
                            <div>
                                <p
                                    className={`text-2xl font-bold ${report.result === 'Pass' ? 'text-emerald-400' : 'text-red-400'
                                        }`}
                                >
                                    {report.result === 'Pass' ? 'PASSED' : 'FAILED'}
                                </p>
                                <p className="text-sm text-slate-400">Result</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="card text-center bg-gradient-to-br from-primary-500/10 to-primary-600/10 border-primary-500/20">
                    <p className="text-4xl font-bold text-white mb-1">
                        {report.total_marks}
                        <span className="text-lg text-slate-500">/{report.total_max_marks}</span>
                    </p>
                    <p className="text-sm text-slate-400">Total Marks</p>
                </div>
                <div className="card text-center bg-gradient-to-br from-secondary-500/10 to-secondary-600/10 border-secondary-500/20">
                    <p className="text-4xl font-bold gradient-text mb-1">{report.percentage}%</p>
                    <p className="text-sm text-slate-400">Percentage</p>
                </div>
                <div className={`card text-center bg-gradient-to-br ${getGradeBgColor(report.overall_grade)}`}>
                    <p className={`text-4xl font-bold ${getGradeColor(report.overall_grade)} mb-1`}>
                        {report.overall_grade}
                    </p>
                    <p className="text-sm text-slate-400">Overall Grade</p>
                </div>
                <div className="card text-center">
                    <p className="text-4xl font-bold text-white mb-1">{report.subjects.length}</p>
                    <p className="text-sm text-slate-400">Subjects</p>
                </div>
            </div>

            {/* Subject Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {report.subjects.map((subject, index) => (
                    <div
                        key={index}
                        className={`card border ${subject.status === 'Pass'
                            ? 'bg-slate-800/30 border-slate-700/30'
                            : 'bg-red-500/5 border-red-500/20'
                            }`}
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <h4 className="font-semibold text-white">{subject.subject_name}</h4>
                                <p className="text-sm text-slate-500 font-mono">{subject.subject_code}</p>
                            </div>
                            <span className={`text-2xl font-bold ${getGradeColor(subject.grade)}`}>
                                {subject.grade}
                            </span>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Marks</span>
                                <span className="text-white font-semibold">
                                    {subject.marks_obtained} / {subject.max_marks}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Pass Marks</span>
                                <span className="text-slate-300">{subject.pass_marks}</span>
                            </div>

                            {/* Progress bar */}
                            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-500 ${subject.status === 'Pass'
                                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                                        : 'bg-gradient-to-r from-red-500 to-red-400'
                                        }`}
                                    style={{
                                        width: `${(subject.marks_obtained / subject.max_marks) * 100}%`,
                                    }}
                                />
                            </div>

                            <div className="flex justify-between items-center pt-2">
                                <span
                                    className={`text-sm font-medium ${subject.status === 'Pass' ? 'text-emerald-400' : 'text-red-400'
                                        }`}
                                >
                                    {((subject.marks_obtained / subject.max_marks) * 100).toFixed(0)}%
                                </span>
                                {subject.status === 'Pass' ? (
                                    <span className="badge-success">Pass</span>
                                ) : (
                                    <span className="badge-danger">Fail</span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar Chart */}
                <div className="card">
                    <h3 className="text-lg font-semibold text-white mb-4">Marks Comparison</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={report.subjects.map((s) => ({
                                    name: s.subject_code,
                                    marks: s.marks_obtained,
                                    pass: s.pass_marks,
                                    max: s.max_marks,
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
                                <Bar dataKey="marks" name="Your Marks" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="pass" name="Pass Marks" fill="#64748b" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Radar Chart */}
                <div className="card">
                    <h3 className="text-lg font-semibold text-white mb-4">Performance Overview</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={radarData}>
                                <PolarGrid stroke="#334155" />
                                <PolarAngleAxis dataKey="subject" stroke="#94a3b8" />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#94a3b8" />
                                <Radar
                                    name="Score %"
                                    dataKey="score"
                                    stroke="#0ea5e9"
                                    fill="#0ea5e9"
                                    fillOpacity={0.3}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="card text-center text-slate-500 text-sm">
                <p>
                    Report generated on{' '}
                    {new Date(report.generated_at).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                    })}
                </p>
            </div>
        </div>
    );
};

export default MyReport;
