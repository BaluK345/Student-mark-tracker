import React, { useState, useEffect } from 'react';
import { subjectsApi } from '../api';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    BookOpenIcon,
} from '@heroicons/react/24/outline';
import type { Subject, SubjectCreateRequest } from '../types';

const Subjects: React.FC = () => {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

    const [formData, setFormData] = useState<SubjectCreateRequest>({
        name: '',
        code: '',
        max_marks: 100,
        pass_marks: 35,
    });

    const fetchSubjects = async () => {
        setIsLoading(true);
        try {
            const response = await subjectsApi.getAll();
            setSubjects(response.subjects);
        } catch (error) {
            toast.error('Failed to fetch subjects');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSubjects();
    }, []);

    const resetForm = () => {
        setFormData({
            name: '',
            code: '',
            max_marks: 100,
            pass_marks: 35,
        });
        setEditingSubject(null);
    };

    const handleOpenModal = (subject?: Subject) => {
        if (subject) {
            setEditingSubject(subject);
            setFormData({
                name: subject.name,
                code: subject.code,
                max_marks: subject.max_marks,
                pass_marks: subject.pass_marks,
            });
        } else {
            resetForm();
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        resetForm();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.type === 'number' ? parseInt(e.target.value) : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.pass_marks > formData.max_marks) {
            toast.error('Pass marks cannot exceed maximum marks');
            return;
        }

        try {
            if (editingSubject) {
                await subjectsApi.update(editingSubject.id, formData);
                toast.success('Subject updated successfully');
            } else {
                await subjectsApi.create(formData);
                toast.success('Subject added successfully');
            }
            handleCloseModal();
            fetchSubjects();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Operation failed');
        }
    };

    const handleDelete = async (subject: Subject) => {
        if (!confirm(`Are you sure you want to delete ${subject.name}?`)) {
            return;
        }

        try {
            await subjectsApi.delete(subject.id);
            toast.success('Subject deleted successfully');
            fetchSubjects();
        } catch (error) {
            toast.error('Failed to delete subject');
        }
    };

    const getPassPercentage = (subject: Subject) => {
        return ((subject.pass_marks / subject.max_marks) * 100).toFixed(0);
    };

    return (
        <div className="space-y-6 animate-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="page-title">Subjects</h1>
                    <p className="page-subtitle">Manage subjects and their pass marks</p>
                </div>
                <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2">
                    <PlusIcon className="w-5 h-5" />
                    Add Subject
                </button>
            </div>

            {/* Subjects Grid */}
            {isLoading ? (
                <div className="flex items-center justify-center min-h-96">
                    <LoadingSpinner size="lg" message="Loading subjects..." />
                </div>
            ) : subjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {subjects.map((subject) => (
                        <div key={subject.id} className="card-hover group">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/20 to-secondary-500/20 flex items-center justify-center border border-primary-500/30">
                                    <BookOpenIcon className="w-6 h-6 text-primary-400" />
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleOpenModal(subject)}
                                        className="p-2 text-slate-400 hover:text-primary-400 hover:bg-primary-400/10 rounded-lg transition-colors"
                                    >
                                        <PencilIcon className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(subject)}
                                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-lg font-semibold text-white mb-1">{subject.name}</h3>
                            <p className="text-sm text-slate-400 font-mono mb-4">{subject.code}</p>

                            <div className="flex items-center justify-between text-sm">
                                <div>
                                    <span className="text-slate-500">Max Marks:</span>
                                    <span className="text-white ml-1 font-semibold">{subject.max_marks}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500">Pass:</span>
                                    <span className="text-emerald-400 ml-1 font-semibold">
                                        {subject.pass_marks} ({getPassPercentage(subject)}%)
                                    </span>
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div className="mt-4 h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                                    style={{ width: `${getPassPercentage(subject)}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card text-center py-16">
                    <BookOpenIcon className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                    <h3 className="text-xl font-semibold text-white mb-2">No subjects found</h3>
                    <p className="text-slate-400 mb-6">Start by adding your first subject</p>
                    <button onClick={() => handleOpenModal()} className="btn-primary">
                        Add Subject
                    </button>
                </div>
            )}

            {/* Add/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingSubject ? 'Edit Subject' : 'Add New Subject'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="label">Subject Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="input"
                            placeholder="e.g., Mathematics"
                            required
                        />
                    </div>

                    <div>
                        <label className="label">Subject Code</label>
                        <input
                            type="text"
                            name="code"
                            value={formData.code}
                            onChange={handleChange}
                            className="input font-mono"
                            placeholder="e.g., MATH101"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Maximum Marks</label>
                            <input
                                type="number"
                                name="max_marks"
                                value={formData.max_marks}
                                onChange={handleChange}
                                className="input"
                                min="1"
                                max="1000"
                                required
                            />
                        </div>
                        <div>
                            <label className="label">Pass Marks</label>
                            <input
                                type="number"
                                name="pass_marks"
                                value={formData.pass_marks}
                                onChange={handleChange}
                                className="input"
                                min="0"
                                max={formData.max_marks}
                                required
                            />
                        </div>
                    </div>

                    <div className="bg-slate-700/30 rounded-xl p-4">
                        <p className="text-sm text-slate-400">
                            Students scoring below{' '}
                            <span className="text-white font-semibold">{formData.pass_marks}</span> marks (
                            {((formData.pass_marks / formData.max_marks) * 100).toFixed(0)}%) will be marked as{' '}
                            <span className="text-red-400 font-semibold">Failed</span> and their parents will
                            receive an email notification.
                        </p>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={handleCloseModal} className="btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary">
                            {editingSubject ? 'Update Subject' : 'Add Subject'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Subjects;
