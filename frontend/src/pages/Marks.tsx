import React, { useState, useEffect } from 'react';
import { studentsApi, subjectsApi, marksApi } from '../api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import {
    ClipboardDocumentListIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import type { Student, Subject, Mark } from '../types';

const Marks: React.FC = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [existingMarks, setExistingMarks] = useState<Mark[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
    const [examType, setExamType] = useState('Final');
    const [filterClass, setFilterClass] = useState('');
    const [marksData, setMarksData] = useState<Record<number, number>>({});

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [studentsRes, subjectsRes] = await Promise.all([
                studentsApi.getAll({ class_name: filterClass || undefined }),
                subjectsApi.getAll(),
            ]);
            setStudents(studentsRes.students);
            setSubjects(subjectsRes.subjects);
        } catch (error) {
            toast.error('Failed to fetch data');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchExistingMarks = async () => {
        if (!selectedSubject) return;

        try {
            const response = await marksApi.getAll({
                subject_id: selectedSubject,
                exam_type: examType,
                class_name: filterClass || undefined,
            });
            setExistingMarks(response.marks);

            // Pre-fill marks data
            const marks: Record<number, number> = {};
            response.marks.forEach((mark) => {
                marks[mark.student_id] = mark.marks_obtained;
            });
            setMarksData(marks);
        } catch (error) {
            console.error('Failed to fetch existing marks:', error);
        }
    };

    useEffect(() => {
        fetchData();
    }, [filterClass]);

    useEffect(() => {
        if (selectedSubject) {
            fetchExistingMarks();
        }
    }, [selectedSubject, examType]);

    const handleMarkChange = (studentId: number, value: string) => {
        const marks = parseInt(value);
        if (isNaN(marks) || marks < 0) {
            setMarksData({ ...marksData, [studentId]: 0 });
        } else {
            const subject = subjects.find((s) => s.id === selectedSubject);
            const maxMarks = subject?.max_marks || 100;
            setMarksData({ ...marksData, [studentId]: Math.min(marks, maxMarks) });
        }
    };

    const getMarkStatus = (studentId: number) => {
        const marks = marksData[studentId];
        const subject = subjects.find((s) => s.id === selectedSubject);
        if (!subject || marks === undefined) return null;
        return marks >= subject.pass_marks ? 'pass' : 'fail';
    };

    const hasExistingMark = (studentId: number) => {
        return existingMarks.some((m) => m.student_id === studentId);
    };

    const handleSaveMarks = async () => {
        if (!selectedSubject) {
            toast.error('Please select a subject');
            return;
        }

        const marksToSave = Object.entries(marksData)
            .filter(([studentId, _]) => !hasExistingMark(parseInt(studentId)))
            .filter(([_, marks]) => marks !== undefined && marks >= 0)
            .map(([studentId, marks]) => ({
                student_id: parseInt(studentId),
                marks_obtained: marks,
            }));

        if (marksToSave.length === 0) {
            toast.error('No new marks to save');
            return;
        }

        setIsSaving(true);
        try {
            await marksApi.createBulk({
                subject_id: selectedSubject,
                exam_type: examType,
                marks: marksToSave,
            });
            toast.success(`Saved marks for ${marksToSave.length} students`);
            fetchExistingMarks();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to save marks');
        } finally {
            setIsSaving(false);
        }
    };

    const selectedSubjectData = subjects.find((s) => s.id === selectedSubject);
    const uniqueClasses = [...new Set(students.map((s) => s.class_name))].sort();

    const passCount = students.filter((s) => getMarkStatus(s.id) === 'pass').length;
    const failCount = students.filter((s) => getMarkStatus(s.id) === 'fail').length;
    const enteredCount = Object.keys(marksData).filter(
        (id) => marksData[parseInt(id)] !== undefined
    ).length;

    return (
        <div className="space-y-6 animate-in">
            {/* Header */}
            <div>
                <h1 className="page-title">Enter Marks</h1>
                <p className="page-subtitle">Enter and manage student marks for each subject</p>
            </div>

            {/* Filters */}
            <div className="card">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="label">Subject</label>
                        <select
                            value={selectedSubject || ''}
                            onChange={(e) => setSelectedSubject(parseInt(e.target.value) || null)}
                            className="select"
                        >
                            <option value="">Select a subject</option>
                            {subjects.map((subject) => (
                                <option key={subject.id} value={subject.id}>
                                    {subject.name} ({subject.code})
                                </option>
                            ))}
                        </select>
                    </div>
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
                            <option value="Assignment">Assignment</option>
                        </select>
                    </div>
                    <div>
                        <label className="label">Filter by Class</label>
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

                {selectedSubjectData && (
                    <div className="mt-4 p-4 bg-slate-700/30 rounded-xl flex items-center justify-between">
                        <div>
                            <span className="text-slate-400">Max Marks:</span>
                            <span className="text-white font-semibold ml-2">{selectedSubjectData.max_marks}</span>
                            <span className="text-slate-400 ml-4">Pass Marks:</span>
                            <span className="text-emerald-400 font-semibold ml-2">
                                {selectedSubjectData.pass_marks}
                            </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                            <span className="text-emerald-400">✓ Pass: {passCount}</span>
                            <span className="text-red-400">✗ Fail: {failCount}</span>
                            <span className="text-slate-400">Entered: {enteredCount}/{students.length}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Marks Entry */}
            {isLoading ? (
                <div className="flex items-center justify-center min-h-96">
                    <LoadingSpinner size="lg" message="Loading..." />
                </div>
            ) : !selectedSubject ? (
                <div className="card text-center py-16">
                    <ClipboardDocumentListIcon className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                    <h3 className="text-xl font-semibold text-white mb-2">Select a Subject</h3>
                    <p className="text-slate-400">Choose a subject from the dropdown to enter marks</p>
                </div>
            ) : students.length > 0 ? (
                <>
                    <div className="card overflow-hidden p-0">
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Roll No</th>
                                        <th>Student Name</th>
                                        <th>Class</th>
                                        <th>Marks</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map((student) => {
                                        const status = getMarkStatus(student.id);
                                        const isExisting = hasExistingMark(student.id);

                                        return (
                                            <tr key={student.id}>
                                                <td className="font-mono">{student.roll_no}</td>
                                                <td>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center text-white text-sm font-semibold">
                                                            {student.full_name?.charAt(0).toUpperCase() || 'S'}
                                                        </div>
                                                        <span className="font-medium text-white">{student.full_name}</span>
                                                    </div>
                                                </td>
                                                <td>{student.class_name}</td>
                                                <td>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="number"
                                                            value={marksData[student.id] ?? ''}
                                                            onChange={(e) => handleMarkChange(student.id, e.target.value)}
                                                            className={`w-24 px-3 py-2 bg-slate-900/50 border rounded-lg text-white text-center focus:outline-none focus:ring-2 transition-all ${isExisting
                                                                    ? 'border-slate-600 bg-slate-800/50'
                                                                    : status === 'pass'
                                                                        ? 'border-emerald-500/50 focus:ring-emerald-500/20'
                                                                        : status === 'fail'
                                                                            ? 'border-red-500/50 focus:ring-red-500/20'
                                                                            : 'border-slate-700 focus:ring-primary-500/20'
                                                                }`}
                                                            min="0"
                                                            max={selectedSubjectData?.max_marks || 100}
                                                            placeholder="0"
                                                            disabled={isExisting}
                                                        />
                                                        <span className="text-slate-500">
                                                            / {selectedSubjectData?.max_marks}
                                                        </span>
                                                        {isExisting && (
                                                            <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-1 rounded">
                                                                Saved
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    {status === 'pass' ? (
                                                        <span className="badge-success">
                                                            <CheckCircleIcon className="w-4 h-4 mr-1" />
                                                            Pass
                                                        </span>
                                                    ) : status === 'fail' ? (
                                                        <span className="badge-danger">
                                                            <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                                                            Fail
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-500">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end">
                        <button
                            onClick={handleSaveMarks}
                            disabled={isSaving}
                            className="btn-primary flex items-center gap-2"
                        >
                            {isSaving ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <ClipboardDocumentListIcon className="w-5 h-5" />
                                    Save Marks
                                </>
                            )}
                        </button>
                    </div>
                </>
            ) : (
                <div className="card text-center py-16">
                    <ClipboardDocumentListIcon className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                    <h3 className="text-xl font-semibold text-white mb-2">No students found</h3>
                    <p className="text-slate-400">Add students to enter their marks</p>
                </div>
            )}
        </div>
    );
};

export default Marks;
