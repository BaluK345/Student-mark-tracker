import React, { useState, useEffect } from 'react';
import { Mail, Send, Users, CheckCircle, XCircle, Loader } from 'lucide-react';
import api from '../api/client';

interface Student {
    id: number;
    user: {
        full_name: string;
        email: string;
    };
    roll_no: string;
    class_name: string;
    parent_email: string;
}

const EmailReports: React.FC = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
    const [filterType, setFilterType] = useState<'all' | 'failed' | 'passed'>('all');
    const [subject, setSubject] = useState('Student Performance Report');
    const [message, setMessage] = useState('Please find your performance report attached.');
    const [sending, setSending] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const response = await api.get('/students');
            setStudents(response.data);
        } catch (err) {
            console.error('Failed to fetch students:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAll = () => {
        if (selectedStudents.length === students.length) {
            setSelectedStudents([]);
        } else {
            setSelectedStudents(students.map(s => s.id));
        }
    };

    const handleSelectStudent = (studentId: number) => {
        setSelectedStudents(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    const handleSendEmails = async () => {
        if (selectedStudents.length === 0) {
            alert('Please select at least one student');
            return;
        }

        setSending(true);
        setResult(null);

        try {
            const response = await api.post('/data/send-reports', {
                student_ids: selectedStudents,
                subject,
                message,
            });

            setResult(response.data);
        } catch (err: any) {
            setResult({
                message: 'Failed to send emails',
                sent: 0,
                failed: selectedStudents.length,
                error: err.response?.data?.detail || 'Unknown error',
            });
        } finally {
            setSending(false);
        }
    };

    const handleBulkSend = async () => {
        setSending(true);
        setResult(null);

        try {
            const response = await api.post('/data/send-bulk-reports', {
                filter_type: filterType,
                subject,
                message,
            });

            setResult(response.data);
        } catch (err: any) {
            setResult({
                message: 'Failed to send emails',
                sent: 0,
                failed: 0,
                error: err.response?.data?.detail || 'Unknown error',
            });
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
                <Loader className="w-12 h-12 text-indigo-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                        Send Email Reports
                    </h1>
                    <p className="text-gray-600">Send performance reports to students and parents via email</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Panel - Email Composition */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Email Content */}
                        <div className="bg-white rounded-2xl shadow-xl p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <Mail className="w-6 h-6 text-indigo-600" />
                                <h2 className="text-xl font-bold text-gray-800">Email Content</h2>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Subject
                                    </label>
                                    <input
                                        type="text"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="Email subject"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Message
                                    </label>
                                    <textarea
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        rows={6}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="Email message"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Student Selection */}
                        <div className="bg-white rounded-2xl shadow-xl p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <Users className="w-6 h-6 text-indigo-600" />
                                    <h2 className="text-xl font-bold text-gray-800">Select Recipients</h2>
                                </div>
                                <button
                                    onClick={handleSelectAll}
                                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                                >
                                    {selectedStudents.length === students.length ? 'Deselect All' : 'Select All'}
                                </button>
                            </div>

                            <div className="max-h-96 overflow-y-auto space-y-2">
                                {students.map((student) => (
                                    <label
                                        key={student.id}
                                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedStudents.includes(student.id)}
                                            onChange={() => handleSelectStudent(student.id)}
                                            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                        />
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-800">{student.user.full_name}</p>
                                            <p className="text-sm text-gray-500">
                                                {student.roll_no} • {student.class_name}
                                            </p>
                                            {student.parent_email && (
                                                <p className="text-xs text-gray-400">{student.parent_email}</p>
                                            )}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Panel - Actions & Results */}
                    <div className="space-y-6">
                        {/* Quick Actions */}
                        <div className="bg-white rounded-2xl shadow-xl p-6">
                            <h3 className="font-bold text-gray-800 mb-4">Quick Actions</h3>

                            <div className="space-y-3">
                                <button
                                    onClick={handleSendEmails}
                                    disabled={sending || selectedStudents.length === 0}
                                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                                >
                                    {sending ? (
                                        <>
                                            <Loader className="w-4 h-4 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            Send to Selected ({selectedStudents.length})
                                        </>
                                    )}
                                </button>

                                <div className="border-t border-gray-200 pt-3">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Bulk Send</p>
                                    <select
                                        value={filterType}
                                        onChange={(e) => setFilterType(e.target.value as any)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 text-sm"
                                    >
                                        <option value="all">All Students</option>
                                        <option value="failed">Failed Students Only</option>
                                        <option value="passed">Passed Students Only</option>
                                    </select>
                                    <button
                                        onClick={handleBulkSend}
                                        disabled={sending}
                                        className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
                                    >
                                        Send Bulk
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Results */}
                        {result && (
                            <div className={`rounded-2xl shadow-xl p-6 ${result.error ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'
                                }`}>
                                <h3 className={`font-bold mb-4 ${result.error ? 'text-red-800' : 'text-green-800'
                                    }`}>
                                    {result.error ? 'Error' : 'Results'}
                                </h3>

                                {result.error ? (
                                    <div className="flex items-start gap-2">
                                        <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                        <p className="text-red-700 text-sm">{result.error}</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-green-700">Sent Successfully</span>
                                            <span className="font-bold text-green-800">{result.sent}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-red-700">Failed</span>
                                            <span className="font-bold text-red-800">{result.failed}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-green-700 text-sm pt-2 border-t border-green-200">
                                            <CheckCircle className="w-4 h-4" />
                                            <span>{result.message}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Info */}
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <h4 className="font-semibold text-blue-900 mb-2 text-sm">ℹ️ Note</h4>
                            <ul className="text-xs text-blue-800 space-y-1">
                                <li>• Emails will be sent to parent email addresses</li>
                                <li>• Reports include student marks and performance</li>
                                <li>• Check your email configuration in settings</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmailReports;
