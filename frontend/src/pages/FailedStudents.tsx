import React, { useState, useEffect } from 'react';
import { marksApi, subjectsApi } from '../api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import {
    ExclamationTriangleIcon,
    EnvelopeIcon,
    CheckCircleIcon,
    FunnelIcon,
} from '@heroicons/react/24/outline';
import type { FailedStudent, Subject } from '../types';

const FailedStudents: React.FC = () => {
    const [failedStudents, setFailedStudents] = useState<FailedStudent[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterSubject, setFilterSubject] = useState<number | null>(null);
    const [filterClass, setFilterClass] = useState('');

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [failedRes, subjectsRes] = await Promise.all([
                marksApi.getFailedStudents({
                    subject_id: filterSubject || undefined,
                    class_name: filterClass || undefined,
                }),
                subjectsApi.getAll(),
            ]);
            setFailedStudents(failedRes);
            setSubjects(subjectsRes.subjects);
        } catch (error) {
            toast.error('Failed to fetch data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [filterSubject, filterClass]);

    const uniqueClasses = [...new Set(failedStudents.map((s) => s.class_name))].sort();

    const groupedBySubject = failedStudents.reduce((acc, student) => {
        if (!acc[student.subject_name]) {
            acc[student.subject_name] = [];
        }
        acc[student.subject_name].push(student);
        return acc;
    }, {} as Record<string, FailedStudent[]>);

    return (
        <div className="space-y-6 animate-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="page-title">Failed Students</h1>
                    <p className="page-subtitle">
                        Students who scored below passing marks. Parents are automatically notified.
                    </p>
                </div>
                <div className="badge-danger text-lg px-4 py-2">
                    <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
                    {failedStudents.length} Failed
                </div>
            </div>

            {/* Filters */}
            <div className="card">
                <div className="flex items-center gap-2 mb-4 text-slate-400">
                    <FunnelIcon className="w-5 h-5" />
                    <span className="text-sm font-medium">Filters</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="label">Subject</label>
                        <select
                            value={filterSubject || ''}
                            onChange={(e) => setFilterSubject(parseInt(e.target.value) || null)}
                            className="select"
                        >
                            <option value="">All Subjects</option>
                            {subjects.map((subject) => (
                                <option key={subject.id} value={subject.id}>
                                    {subject.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="label">Class</label>
                        <select
                            value={filterClass}
                            onChange={(e) => setFilterClass(e.target.value)}
                            className="select"
                        >
                            <option value="">All Classes</option>
                            {uniqueClasses.map((cls) => (
                                <option key={cls} value={cls}>
                                    {cls}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Failed Students List */}
            {isLoading ? (
                <div className="flex items-center justify-center min-h-96">
                    <LoadingSpinner size="lg" message="Loading failed students..." />
                </div>
            ) : failedStudents.length > 0 ? (
                <div className="space-y-6">
                    {Object.entries(groupedBySubject).map(([subjectName, students]) => (
                        <div key={subjectName} className="card">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
                                    {subjectName}
                                </h3>
                                <span className="badge-danger">
                                    {students.length} student{students.length > 1 ? 's' : ''}
                                </span>
                            </div>

                            <div className="space-y-3">
                                {students.map((student, index) => (
                                    <div
                                        key={`${student.student_id}-${index}`}
                                        className="flex items-center justify-between p-4 bg-red-500/5 border border-red-500/20 rounded-xl"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                                                <span className="text-red-400 font-bold text-lg">
                                                    {student.student_name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-white font-semibold">{student.student_name}</p>
                                                <p className="text-sm text-slate-400">
                                                    Roll: {student.roll_no} | Class: {student.class_name}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <p className="text-red-400 font-bold text-xl">
                                                    {student.marks_obtained}
                                                    <span className="text-sm text-slate-500">/{student.max_marks}</span>
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    Pass marks: {student.pass_marks}
                                                </p>
                                            </div>

                                            {student.parent_email ? (
                                                <div className="flex items-center gap-2 text-emerald-400">
                                                    <EnvelopeIcon className="w-5 h-5" />
                                                    <div className="text-sm">
                                                        <p className="font-medium">Email Sent</p>
                                                        <p className="text-xs text-slate-500 truncate max-w-32">
                                                            {student.parent_email}
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-amber-400">
                                                    <ExclamationTriangleIcon className="w-5 h-5" />
                                                    <div className="text-sm">
                                                        <p className="font-medium">No Email</p>
                                                        <p className="text-xs text-slate-500">Parent email missing</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card text-center py-16">
                    <CheckCircleIcon className="w-20 h-20 mx-auto mb-4 text-emerald-400" />
                    <h3 className="text-2xl font-semibold text-white mb-2">All Students Passing! 🎉</h3>
                    <p className="text-slate-400">
                        No students have failed any subjects. Great job!
                    </p>
                </div>
            )}
        </div>
    );
};

export default FailedStudents;
