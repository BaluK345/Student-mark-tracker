import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { studentsApi, subjectsApi, marksApi } from '../api';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';
import {
    UserGroupIcon,
    BookOpenIcon,
    ClipboardDocumentListIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    ChartBarIcon,
} from '@heroicons/react/24/outline';
import {
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from 'recharts';
import type { Student, FailedStudent } from '../types';

const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalSubjects: 0,
        totalMarks: 0,
        failedCount: 0,
    });
    const [failedStudents, setFailedStudents] = useState<FailedStudent[]>([]);
    const [recentStudents, setRecentStudents] = useState<Student[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [studentsRes, subjectsRes, marksRes, failedRes] = await Promise.all([
                    studentsApi.getAll({ limit: 5 }),
                    subjectsApi.getAll(),
                    marksApi.getAll({ limit: 100 }),
                    marksApi.getFailedStudents(),
                ]);

                setStats({
                    totalStudents: studentsRes.total,
                    totalSubjects: subjectsRes.total,
                    totalMarks: marksRes.total,
                    failedCount: failedRes.length,
                });
                setFailedStudents(failedRes.slice(0, 5));
                setRecentStudents(studentsRes.students);
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (user?.role === 'teacher') {
            fetchData();
        } else {
            setIsLoading(false);
        }
    }, [user]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <LoadingSpinner size="lg" message="Loading dashboard..." />
            </div>
        );
    }

    const passFailData = [
        { name: 'Passed', value: stats.totalMarks - stats.failedCount, color: '#10b981' },
        { name: 'Failed', value: stats.failedCount, color: '#ef4444' },
    ];

    return (
        <div className="space-y-8 animate-in">
            {/* Header */}
            <div>
                <h1 className="page-title">Welcome back, {user?.full_name}! 👋</h1>
                <p className="page-subtitle">
                    Here's what's happening with your {user?.role === 'teacher' ? 'class' : 'studies'} today.
                </p>
            </div>

            {user?.role === 'teacher' ? (
                <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            title="Total Students"
                            value={stats.totalStudents}
                            icon={<UserGroupIcon className="w-6 h-6" />}
                            color="primary"
                        />
                        <StatCard
                            title="Subjects"
                            value={stats.totalSubjects}
                            icon={<BookOpenIcon className="w-6 h-6" />}
                            color="success"
                        />
                        <StatCard
                            title="Marks Entered"
                            value={stats.totalMarks}
                            icon={<ClipboardDocumentListIcon className="w-6 h-6" />}
                            color="warning"
                        />
                        <StatCard
                            title="Failed Students"
                            value={stats.failedCount}
                            icon={<ExclamationTriangleIcon className="w-6 h-6" />}
                            color="danger"
                        />
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Pass/Fail Chart */}
                        <div className="card">
                            <h3 className="text-lg font-semibold text-white mb-4">Pass/Fail Distribution</h3>
                            {stats.totalMarks > 0 ? (
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={passFailData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={100}
                                                paddingAngle={5}
                                                dataKey="value"
                                                label={({ name, value }) => `${name}: ${value}`}
                                            >
                                                {passFailData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{
                                                    background: '#1e293b',
                                                    border: '1px solid #334155',
                                                    borderRadius: '8px',
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="h-64 flex items-center justify-center text-slate-400">
                                    No marks data available
                                </div>
                            )}
                        </div>

                        {/* Recent Failed Students */}
                        <div className="card">
                            <h3 className="text-lg font-semibold text-white mb-4">Recent Failed Students</h3>
                            {failedStudents.length > 0 ? (
                                <div className="space-y-3">
                                    {failedStudents.map((student, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                                                    <span className="text-red-400 font-semibold">
                                                        {student.student_name.charAt(0)}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="text-white font-medium">{student.student_name}</p>
                                                    <p className="text-sm text-slate-400">{student.subject_name}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-red-400 font-semibold">
                                                    {student.marks_obtained}/{student.max_marks}
                                                </p>
                                                <p className="text-xs text-slate-500">Pass: {student.pass_marks}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-64 flex items-center justify-center text-slate-400">
                                    <div className="text-center">
                                        <CheckCircleIcon className="w-12 h-12 mx-auto mb-2 text-emerald-400" />
                                        <p>All students are passing!</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Students */}
                    <div className="card">
                        <h3 className="text-lg font-semibold text-white mb-4">Recent Students</h3>
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Roll No</th>
                                        <th>Class</th>
                                        <th>Section</th>
                                        <th>Email</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentStudents.map((student) => (
                                        <tr key={student.id}>
                                            <td className="font-medium text-white">{student.full_name}</td>
                                            <td>{student.roll_no}</td>
                                            <td>{student.class_name}</td>
                                            <td>{student.section}</td>
                                            <td>{student.email}</td>
                                        </tr>
                                    ))}
                                    {recentStudents.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="text-center text-slate-400 py-8">
                                                No students added yet
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                /* Student Dashboard */
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="card text-center py-12">
                        <ChartBarIcon className="w-16 h-16 mx-auto mb-4 text-primary-400" />
                        <h3 className="text-xl font-semibold text-white mb-2">View Your Report</h3>
                        <p className="text-slate-400 mb-6">
                            Check your marks, grades, and overall performance
                        </p>
                        <a href="/my-report" className="btn-primary inline-block">
                            View Report Card
                        </a>
                    </div>

                    <div className="card text-center py-12">
                        <CheckCircleIcon className="w-16 h-16 mx-auto mb-4 text-emerald-400" />
                        <h3 className="text-xl font-semibold text-white mb-2">Track Your Progress</h3>
                        <p className="text-slate-400 mb-6">
                            Monitor your academic performance over time
                        </p>
                        <span className="text-slate-500 text-sm">Coming soon...</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
