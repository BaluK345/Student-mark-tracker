import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from './Sidebar';
import LoadingSpinner from './LoadingSpinner';
import { Bars3Icon } from '@heroicons/react/24/outline';

const Layout: React.FC = () => {
    const { isAuthenticated, isLoading } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner size="lg" message="Loading..." />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="min-h-screen">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Mobile header */}
            <header className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/50">
                <div className="flex items-center justify-between px-4 py-4">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <Bars3Icon className="w-6 h-6" />
                    </button>
                    <h1 className="font-bold text-white">Mark Tracker</h1>
                    <div className="w-10" /> {/* Spacer for alignment */}
                </div>
            </header>

            {/* Main content */}
            <main className="lg:ml-72 min-h-screen pt-16 lg:pt-0">
                <div className="p-6 lg:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
