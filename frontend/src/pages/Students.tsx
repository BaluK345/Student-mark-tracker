import React, { useState, useEffect } from 'react';
import { studentsApi } from '../api';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    MagnifyingGlassIcon,
    UserGroupIcon,
} from '@heroicons/react/24/outline';
import type { Student, StudentCreateRequest } from '../types';

const Students: React.FC = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterClass, setFilterClass] = useState('');

    const [formData, setFormData] = useState<StudentCreateRequest>({
        email: '',
        password: '',
        full_name: '',
        roll_no: '',
        class_name: '',
        section: 'A',
        parent_name: '',
        parent_email: '',
        parent_phone: '',
    });

    const fetchStudents = async () => {
        setIsLoading(true);
        try {
            const response = await studentsApi.getAll({
                class_name: filterClass || undefined,
            });
            setStudents(response.students);
        } catch (error) {
            toast.error('Failed to fetch students');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, [filterClass]);

    const resetForm = () => {
        setFormData({
            email: '',
            password: '',
            full_name: '',
            roll_no: '',
            class_name: '',
            section: 'A',
            parent_name: '',
            parent_email: '',
            parent_phone: '',
        });
        setEditingStudent(null);
    };

    const handleOpenModal = (student?: Student) => {
        if (student) {
            setEditingStudent(student);
            setFormData({
                email: student.email || '',
                password: '',
                full_name: student.full_name || '',
                roll_no: student.roll_no,
                class_name: student.class_name,
                section: student.section,
                parent_name: student.parent_name || '',
                parent_email: student.parent_email || '',
                parent_phone: student.parent_phone || '',
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (editingStudent) {
                await studentsApi.update(editingStudent.id, {
                    roll_no: formData.roll_no,
                    class_name: formData.class_name,
                    section: formData.section,
                    parent_name: formData.parent_name,
                    parent_email: formData.parent_email || undefined,
                    parent_phone: formData.parent_phone,
                });
                toast.success('Student updated successfully');
            } else {
                await studentsApi.create(formData);
                toast.success('Student added successfully');
            }
            handleCloseModal();
            fetchStudents();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Operation failed');
        }
    };

    const handleDelete = async (student: Student) => {
        if (!confirm(`Are you sure you want to delete ${student.full_name}?`)) {
            return;
        }

        try {
            await studentsApi.delete(student.id);
            toast.success('Student deleted successfully');
            fetchStudents();
        } catch (error) {
            toast.error('Failed to delete student');
        }
    };

    const filteredStudents = students.filter(
        (student) =>
            student.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.roll_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const uniqueClasses = [...new Set(students.map((s) => s.class_name))].sort();

    return (
        <div className="space-y-6 animate-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="page-title">Students</h1>
                    <p className="page-subtitle">Manage your students and their information</p>
                </div>
                <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2">
                    <PlusIcon className="w-5 h-5" />
                    Add Student
                </button>
            </div>

            {/* Filters */}
            <div className="card">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search students..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input pl-12"
                        />
                    </div>
                    <select
                        value={filterClass}
                        onChange={(e) => setFilterClass(e.target.value)}
                        className="select w-full sm:w-48"
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

            {/* Students Table */}
            {isLoading ? (
                <div className="flex items-center justify-center min-h-96">
                    <LoadingSpinner size="lg" message="Loading students..." />
                </div>
            ) : filteredStudents.length > 0 ? (
                <div className="card overflow-hidden p-0">
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Roll No</th>
                                    <th>Class</th>
                                    <th>Section</th>
                                    <th>Parent Email</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.map((student) => (
                                    <tr key={student.id}>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center text-white font-semibold">
                                                    {student.full_name?.charAt(0).toUpperCase() || 'S'}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-white">{student.full_name}</p>
                                                    <p className="text-sm text-slate-400">{student.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="font-mono">{student.roll_no}</td>
                                        <td>{student.class_name}</td>
                                        <td>{student.section}</td>
                                        <td className="text-slate-400">{student.parent_email || '-'}</td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleOpenModal(student)}
                                                    className="p-2 text-slate-400 hover:text-primary-400 hover:bg-primary-400/10 rounded-lg transition-colors"
                                                >
                                                    <PencilIcon className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(student)}
                                                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                                >
                                                    <TrashIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="card text-center py-16">
                    <UserGroupIcon className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                    <h3 className="text-xl font-semibold text-white mb-2">No students found</h3>
                    <p className="text-slate-400 mb-6">
                        {searchQuery ? 'Try adjusting your search' : 'Start by adding your first student'}
                    </p>
                    {!searchQuery && (
                        <button onClick={() => handleOpenModal()} className="btn-primary">
                            Add Student
                        </button>
                    )}
                </div>
            )}

            {/* Add/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingStudent ? 'Edit Student' : 'Add New Student'}
                size="lg"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="label">Full Name</label>
                            <input
                                type="text"
                                name="full_name"
                                value={formData.full_name}
                                onChange={handleChange}
                                className="input"
                                placeholder="Enter full name"
                                required
                                disabled={!!editingStudent}
                            />
                        </div>
                        <div>
                            <label className="label">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="input"
                                placeholder="Enter email"
                                required
                                disabled={!!editingStudent}
                            />
                        </div>
                        {!editingStudent && (
                            <div>
                                <label className="label">Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="input"
                                    placeholder="Enter password"
                                    required
                                />
                            </div>
                        )}
                        <div>
                            <label className="label">Roll Number</label>
                            <input
                                type="text"
                                name="roll_no"
                                value={formData.roll_no}
                                onChange={handleChange}
                                className="input"
                                placeholder="e.g., 2024001"
                                required
                            />
                        </div>
                        <div>
                            <label className="label">Class</label>
                            <input
                                type="text"
                                name="class_name"
                                value={formData.class_name}
                                onChange={handleChange}
                                className="input"
                                placeholder="e.g., 10th Grade"
                                required
                            />
                        </div>
                        <div>
                            <label className="label">Section</label>
                            <select
                                name="section"
                                value={formData.section}
                                onChange={handleChange}
                                className="select"
                            >
                                <option value="A">Section A</option>
                                <option value="B">Section B</option>
                                <option value="C">Section C</option>
                                <option value="D">Section D</option>
                            </select>
                        </div>
                    </div>

                    <div className="border-t border-slate-700 pt-4 mt-4">
                        <h4 className="text-sm font-medium text-slate-300 mb-4">Parent Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="label">Parent Name</label>
                                <input
                                    type="text"
                                    name="parent_name"
                                    value={formData.parent_name}
                                    onChange={handleChange}
                                    className="input"
                                    placeholder="Parent's name"
                                />
                            </div>
                            <div>
                                <label className="label">Parent Email</label>
                                <input
                                    type="email"
                                    name="parent_email"
                                    value={formData.parent_email}
                                    onChange={handleChange}
                                    className="input"
                                    placeholder="Parent's email"
                                />
                            </div>
                            <div>
                                <label className="label">Parent Phone</label>
                                <input
                                    type="tel"
                                    name="parent_phone"
                                    value={formData.parent_phone}
                                    onChange={handleChange}
                                    className="input"
                                    placeholder="Parent's phone"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={handleCloseModal} className="btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary">
                            {editingStudent ? 'Update Student' : 'Add Student'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Students;
