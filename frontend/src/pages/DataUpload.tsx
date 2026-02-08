import React, { useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../api/client';

interface UploadStats {
    total_rows: number;
    columns: string[];
    numeric_columns: string[];
}

interface UploadResult {
    message: string;
    stats: UploadStats;
    preview: any[];
}

const DataUpload: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<UploadResult | null>(null);
    const [error, setError] = useState<string>('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setError('');
            setResult(null);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a file first');
            return;
        }

        setUploading(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await api.post('/data/upload-csv', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setResult(response.data);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to upload file');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                        Data Upload
                    </h1>
                    <p className="text-gray-600">Upload CSV or Excel files to import student data</p>
                </div>

                {/* Upload Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
                    <div className="flex items-center gap-3 mb-6">
                        <FileSpreadsheet className="w-8 h-8 text-indigo-600" />
                        <h2 className="text-2xl font-bold text-gray-800">Upload File</h2>
                    </div>

                    {/* File Input */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select CSV or Excel File
                        </label>
                        <div className="flex items-center gap-4">
                            <label className="flex-1 cursor-pointer">
                                <div className="border-2 border-dashed border-indigo-300 rounded-xl p-8 text-center hover:border-indigo-500 transition-colors">
                                    <Upload className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
                                    <p className="text-gray-600 mb-1">
                                        {file ? file.name : 'Click to select file or drag and drop'}
                                    </p>
                                    <p className="text-sm text-gray-400">CSV or XLSX (Max 10MB)</p>
                                </div>
                                <input
                                    type="file"
                                    accept=".csv,.xlsx"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    </div>

                    {/* Upload Button */}
                    <button
                        onClick={handleUpload}
                        disabled={!file || uploading}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                    >
                        {uploading ? 'Uploading...' : 'Upload and Process'}
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-red-800 mb-1">Upload Failed</h3>
                            <p className="text-red-600 text-sm">{error}</p>
                        </div>
                    </div>
                )}

                {/* Success Result */}
                {result && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
                        <div className="flex items-start gap-3 mb-4">
                            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <h3 className="font-semibold text-green-800 text-lg mb-1">Upload Successful!</h3>
                                <p className="text-green-600">{result.message}</p>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="bg-white rounded-lg p-4 shadow-sm">
                                <p className="text-sm text-gray-600 mb-1">Total Rows</p>
                                <p className="text-2xl font-bold text-indigo-600">{result.stats.total_rows}</p>
                            </div>
                            <div className="bg-white rounded-lg p-4 shadow-sm">
                                <p className="text-sm text-gray-600 mb-1">Total Columns</p>
                                <p className="text-2xl font-bold text-purple-600">{result.stats.columns.length}</p>
                            </div>
                            <div className="bg-white rounded-lg p-4 shadow-sm">
                                <p className="text-sm text-gray-600 mb-1">Numeric Columns</p>
                                <p className="text-2xl font-bold text-pink-600">{result.stats.numeric_columns.length}</p>
                            </div>
                        </div>

                        {/* Preview */}
                        {result.preview && result.preview.length > 0 && (
                            <div className="bg-white rounded-lg p-4 shadow-sm">
                                <h4 className="font-semibold text-gray-800 mb-3">Data Preview (First 10 rows)</h4>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                {result.stats.columns.map((col, idx) => (
                                                    <th
                                                        key={idx}
                                                        className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                    >
                                                        {col}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {result.preview.map((row, rowIdx) => (
                                                <tr key={rowIdx} className="hover:bg-gray-50">
                                                    {result.stats.columns.map((col, colIdx) => (
                                                        <td key={colIdx} className="px-4 py-2 text-sm text-gray-900 whitespace-nowrap">
                                                            {row[col]?.toString() || '-'}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <h3 className="font-semibold text-blue-900 mb-3">📋 File Format Guidelines</h3>
                    <ul className="space-y-2 text-blue-800 text-sm">
                        <li>• Ensure your CSV/Excel file has headers in the first row</li>
                        <li>• Include an 'email' column if you want to send reports to students/parents</li>
                        <li>• Numeric columns will be automatically detected for visualizations</li>
                        <li>• Maximum file size: 10MB</li>
                        <li>• Supported formats: .csv, .xlsx</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default DataUpload;
