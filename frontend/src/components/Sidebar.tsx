import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    HomeIcon,
    UserGroupIcon,
    BookOpenIcon,
    ClipboardDocumentListIcon,
    ChartBarIcon,
    ExclamationTriangleIcon,
    ArrowRightOnRectangleIcon,
    AcademicCapIcon,
} from '@heroicons/react/24/outline';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const teacherLinks = [
        { to: '/dashboard', icon: HomeIcon, label: 'Dashboard' },
        { to: '/students', icon: UserGroupIcon, label: 'Students' },
        { to: '/subjects', icon: BookOpenIcon, label: 'Subjects' },
        { to: '/marks', icon: ClipboardDocumentListIcon, label: 'Enter Marks' },
        { to: '/failed-students', icon: ExclamationTriangleIcon, label: 'Failed Students' },
        { to: '/reports', icon: ChartBarIcon, label: 'Reports' },
    ];

    const studentLinks = [
        { to: '/dashboard', icon: HomeIcon, label: 'Dashboard' },
        { to: '/my-report', icon: ChartBarIcon, label: 'My Report' },
    ];

    const links = user?.role === 'teacher' ? teacherLinks : studentLinks;

    return (
        <>
            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 z-50 h-full w-72 bg-slate-900/95 backdrop-blur-xl border-r border-slate-700/50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                {/* Logo */}
                <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-700/50">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                        <AcademicCapIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-white">Mark Tracker</h1>
                        <p className="text-xs text-slate-400">Student Management</p>
                    </div>
                </div>

                {/* User Info */}
                <div className="px-6 py-4 border-b border-slate-700/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center text-white font-semibold">
                            {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                            <p className="text-white font-medium">{user?.full_name}</p>
                            <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="px-4 py-6 space-y-2">
                    {links.map((link) => {
                        const isActive = location.pathname === link.to;
                        return (
                            <Link
                                key={link.to}
                                to={link.to}
                                onClick={onClose}
                                className={isActive ? 'sidebar-link-active' : 'sidebar-link'}
                            >
                                <link.icon className="w-5 h-5" />
                                <span>{link.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Logout */}
                <div className="absolute bottom-6 left-4 right-4">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200"
                    >
                        <ArrowRightOnRectangleIcon className="w-5 h-5" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
