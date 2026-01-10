import React from 'react';

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    color?: 'primary' | 'success' | 'warning' | 'danger';
}

const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    subtitle,
    icon,
    trend,
    color = 'primary',
}) => {
    const colorClasses = {
        primary: 'from-primary-500/20 to-primary-600/20 border-primary-500/30',
        success: 'from-emerald-500/20 to-emerald-600/20 border-emerald-500/30',
        warning: 'from-amber-500/20 to-amber-600/20 border-amber-500/30',
        danger: 'from-red-500/20 to-red-600/20 border-red-500/30',
    };

    const iconColorClasses = {
        primary: 'text-primary-400',
        success: 'text-emerald-400',
        warning: 'text-amber-400',
        danger: 'text-red-400',
    };

    const valueColorClasses = {
        primary: 'from-primary-400 to-blue-400',
        success: 'from-emerald-400 to-green-400',
        warning: 'from-amber-400 to-yellow-400',
        danger: 'from-red-400 to-pink-400',
    };

    return (
        <div
            className={`card bg-gradient-to-br ${colorClasses[color]} hover:transform hover:-translate-y-1 transition-all duration-300`}
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-slate-400 mb-1">{title}</p>
                    <p
                        className={`text-3xl font-bold bg-gradient-to-r ${valueColorClasses[color]} bg-clip-text text-transparent`}
                    >
                        {value}
                    </p>
                    {subtitle && (
                        <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
                    )}
                    {trend && (
                        <div className="flex items-center gap-1 mt-2">
                            <span
                                className={`text-sm font-medium ${trend.isPositive ? 'text-emerald-400' : 'text-red-400'
                                    }`}
                            >
                                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                            </span>
                            <span className="text-xs text-slate-500">from last month</span>
                        </div>
                    )}
                </div>
                <div
                    className={`p-3 rounded-xl bg-slate-800/50 ${iconColorClasses[color]}`}
                >
                    {icon}
                </div>
            </div>
        </div>
    );
};

export default StatCard;
