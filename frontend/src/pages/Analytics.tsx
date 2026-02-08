import React, { useState, useEffect } from 'react';
import { BarChart3, PieChart, TrendingUp, RefreshCw } from 'lucide-react';
import api from '../api/client';

interface AnalyticsSummary {
    total_students: number;
    total_assessments: number;
    average_marks: number;
    highest_marks: number;
    lowest_marks: number;
    pass_count: number;
    fail_count: number;
    pass_percentage: number;
}

interface AnalyticsData {
    summary: AnalyticsSummary;
    charts: {
        grade_distribution: string;
        pass_fail: string;
        subject_performance: string;
    };
}

const Analytics: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [error, setError] = useState<string>('');

    const fetchAnalytics = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await api.get('/data/analytics/summary');
            setData(response.data);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to load analytics');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <RefreshCw className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading analytics...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-6">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md">
                    <h3 className="font-semibold text-red-800 mb-2">Error Loading Analytics</h3>
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={fetchAnalytics}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                            Analytics Dashboard
                        </h1>
                        <p className="text-gray-600">Comprehensive insights into student performance</p>
                    </div>
                    <button
                        onClick={fetchAnalytics}
                        className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-md hover:shadow-lg transition-shadow"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                </div>

                {data && (
                    <>
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-blue-100">Total Students</p>
                                    <TrendingUp className="w-5 h-5 text-blue-200" />
                                </div>
                                <p className="text-4xl font-bold">{data.summary.total_students}</p>
                            </div>

                            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-xl">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-green-100">Pass Rate</p>
                                    <PieChart className="w-5 h-5 text-green-200" />
                                </div>
                                <p className="text-4xl font-bold">{data.summary.pass_percentage.toFixed(1)}%</p>
                                <p className="text-sm text-green-100 mt-1">
                                    {data.summary.pass_count} / {data.summary.total_assessments}
                                </p>
                            </div>

                            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-purple-100">Average Marks</p>
                                    <BarChart3 className="w-5 h-5 text-purple-200" />
                                </div>
                                <p className="text-4xl font-bold">{data.summary.average_marks.toFixed(1)}</p>
                                <p className="text-sm text-purple-100 mt-1">out of 100</p>
                            </div>

                            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-xl">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-orange-100">Total Assessments</p>
                                    <BarChart3 className="w-5 h-5 text-orange-200" />
                                </div>
                                <p className="text-4xl font-bold">{data.summary.total_assessments}</p>
                            </div>
                        </div>

                        {/* Charts Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                            {/* Grade Distribution */}
                            <div className="bg-white rounded-2xl shadow-xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold text-gray-800">Grade Distribution</h2>
                                    <PieChart className="w-5 h-5 text-indigo-600" />
                                </div>
                                {data.charts.grade_distribution ? (
                                    <img
                                        src={data.charts.grade_distribution}
                                        alt="Grade Distribution"
                                        className="w-full rounded-lg"
                                    />
                                ) : (
                                    <div className="bg-gray-100 rounded-lg p-8 text-center text-gray-500">
                                        No data available
                                    </div>
                                )}
                            </div>

                            {/* Pass/Fail Distribution */}
                            <div className="bg-white rounded-2xl shadow-xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold text-gray-800">Pass/Fail Distribution</h2>
                                    <PieChart className="w-5 h-5 text-green-600" />
                                </div>
                                {data.charts.pass_fail ? (
                                    <img
                                        src={data.charts.pass_fail}
                                        alt="Pass/Fail Distribution"
                                        className="w-full rounded-lg"
                                    />
                                ) : (
                                    <div className="bg-gray-100 rounded-lg p-8 text-center text-gray-500">
                                        No data available
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Subject Performance - Full Width */}
                        <div className="bg-white rounded-2xl shadow-xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-gray-800">Subject-wise Performance</h2>
                                <BarChart3 className="w-5 h-5 text-purple-600" />
                            </div>
                            {data.charts.subject_performance ? (
                                <img
                                    src={data.charts.subject_performance}
                                    alt="Subject Performance"
                                    className="w-full rounded-lg"
                                />
                            ) : (
                                <div className="bg-gray-100 rounded-lg p-8 text-center text-gray-500">
                                    No data available
                                </div>
                            )}
                        </div>

                        {/* Additional Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                            <div className="bg-white rounded-xl shadow-md p-6">
                                <p className="text-sm text-gray-600 mb-1">Highest Marks</p>
                                <p className="text-3xl font-bold text-green-600">{data.summary.highest_marks}</p>
                            </div>
                            <div className="bg-white rounded-xl shadow-md p-6">
                                <p className="text-sm text-gray-600 mb-1">Lowest Marks</p>
                                <p className="text-3xl font-bold text-red-600">{data.summary.lowest_marks}</p>
                            </div>
                            <div className="bg-white rounded-xl shadow-md p-6">
                                <p className="text-sm text-gray-600 mb-1">Failed Assessments</p>
                                <p className="text-3xl font-bold text-orange-600">{data.summary.fail_count}</p>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Analytics;
