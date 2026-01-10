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
        primary: 'from-red-500/10 to-red-600/10 border-red-500/20',
        success: 'from-white/5 to-white/10 border-white/20',
        warning: 'from-neutral-800/50 to-neutral-900/50 border-neutral-700',
        danger: 'from-red-500/20 to-red-600/20 border-red-500/30',
    };

    const iconColorClasses = {
        primary: 'text-red-400',
        success: 'text-white',
        warning: 'text-neutral-400',
        danger: 'text-red-400',
    };

    const valueColorClasses = {
        primary: 'from-red-400 to-red-500',
        success: 'from-white to-neutral-300',
        warning: 'from-neutral-300 to-neutral-400',
        danger: 'from-red-400 to-red-500',
    };

    return (
        <div
            className={`card bg-gradient-to-br ${colorClasses[color]} hover:transform hover:-translate-y-1 transition-all duration-300`}
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-neutral-400 mb-1">{title}</p>
                    <p
                        className={`text-3xl font-bold bg-gradient-to-r ${valueColorClasses[color]} bg-clip-text text-transparent`}
                    >
                        {value}
                    </p>
                    {subtitle && (
                        <p className="text-sm text-neutral-500 mt-1">{subtitle}</p>
                    )}
                    {trend && (
                        <div className="flex items-center gap-1 mt-2">
                            <span
                                className={`text-sm font-medium ${trend.isPositive ? 'text-white' : 'text-red-400'
                                    }`}
                            >
                                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                            </span>
                            <span className="text-xs text-neutral-500">from last month</span>
                        </div>
                    )}
                </div>
                <div
                    className={`p-3 rounded-xl bg-neutral-800/50 ${iconColorClasses[color]}`}
                >
                    {icon}
                </div>
            </div>
        </div>
    );
};

export default StatCard;
