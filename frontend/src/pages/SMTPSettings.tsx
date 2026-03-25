import React, { useEffect, useState } from 'react';
import { Mail, Save, Loader } from 'lucide-react';
import { emailSettingsApi } from '../api';
import type { SMTPSettingsUpdateRequest, UiPathSettingsUpdateRequest } from '../types';

const SMTPSettings: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [savingSmtp, setSavingSmtp] = useState(false);
    const [savingUiPath, setSavingUiPath] = useState(false);
    const [smtpForm, setSmtpForm] = useState<SMTPSettingsUpdateRequest>({
        host: 'smtp.gmail.com',
        port: 587,
        username: '',
        password: '',
        from_email: '',
        from_name: 'Student Mark Tracker',
        use_tls: true,
        is_enabled: true,
    });
    const [uipathForm, setUiPathForm] = useState<UiPathSettingsUpdateRequest>({
        webhook_url: '',
        api_token: '',
        tenant_name: '',
        process_name: '',
        is_enabled: false,
    });
    const [smtpMeta, setSmtpMeta] = useState<{ source: string; has_password: boolean } | null>(null);
    const [uipathMeta, setUiPathMeta] = useState<{ has_api_token: boolean } | null>(null);
    const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const [smtpData, uipathData] = await Promise.all([
                emailSettingsApi.getSmtpSettings(),
                emailSettingsApi.getUiPathSettings(),
            ]);

            setSmtpForm({
                host: smtpData.host,
                port: smtpData.port,
                username: smtpData.username || '',
                password: '',
                from_email: smtpData.from_email || '',
                from_name: smtpData.from_name,
                use_tls: smtpData.use_tls,
                is_enabled: smtpData.is_enabled,
            });
            setSmtpMeta({ source: smtpData.source, has_password: smtpData.has_password });

            setUiPathForm({
                webhook_url: uipathData.webhook_url || '',
                api_token: '',
                tenant_name: uipathData.tenant_name || '',
                process_name: uipathData.process_name || '',
                is_enabled: uipathData.is_enabled,
            });
            setUiPathMeta({ has_api_token: uipathData.has_api_token });
        } catch (error: any) {
            setStatus({ type: 'error', text: error.response?.data?.detail || 'Failed to load email settings' });
        } finally {
            setLoading(false);
        }
    };

    const updateSmtpField = (key: keyof SMTPSettingsUpdateRequest, value: string | number | boolean) => {
        setSmtpForm((prev) => ({ ...prev, [key]: value }));
    };

    const updateUiPathField = (key: keyof UiPathSettingsUpdateRequest, value: string | boolean) => {
        setUiPathForm((prev) => ({ ...prev, [key]: value }));
    };

    const handleSaveSmtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingSmtp(true);
        setStatus(null);

        try {
            const payload: SMTPSettingsUpdateRequest = {
                ...smtpForm,
                username: smtpForm.username?.trim() || undefined,
                from_email: smtpForm.from_email?.trim() || undefined,
                password: smtpForm.password?.trim() || undefined,
            };

            const data = await emailSettingsApi.updateSmtpSettings(payload);
            setSmtpMeta({ source: data.source, has_password: data.has_password });
            setSmtpForm((prev) => ({ ...prev, password: '' }));
            setStatus({ type: 'success', text: 'SMTP settings saved successfully' });
        } catch (error: any) {
            setStatus({ type: 'error', text: error.response?.data?.detail || 'Failed to save SMTP settings' });
        } finally {
            setSavingSmtp(false);
        }
    };

    const handleSaveUiPath = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingUiPath(true);
        setStatus(null);

        try {
            const payload: UiPathSettingsUpdateRequest = {
                webhook_url: uipathForm.webhook_url.trim(),
                api_token: uipathForm.api_token?.trim() || undefined,
                tenant_name: uipathForm.tenant_name?.trim() || undefined,
                process_name: uipathForm.process_name?.trim() || undefined,
                is_enabled: uipathForm.is_enabled,
            };

            const data = await emailSettingsApi.updateUiPathSettings(payload);
            setUiPathMeta({ has_api_token: data.has_api_token });
            setUiPathForm((prev) => ({ ...prev, api_token: '' }));
            setStatus({ type: 'success', text: 'UiPath settings saved successfully' });
        } catch (error: any) {
            setStatus({ type: 'error', text: error.response?.data?.detail || 'Failed to save UiPath settings' });
        } finally {
            setSavingUiPath(false);
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
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                        Email Automation Settings
                    </h1>
                    <p className="text-gray-600">Configure UiPath and SMTP delivery settings from the UI</p>
                </div>

                <form onSubmit={handleSaveUiPath} className="bg-white rounded-2xl shadow-xl p-6 space-y-5 mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Mail className="w-6 h-6 text-indigo-600" />
                        <h2 className="text-xl font-bold text-gray-800">UiPath Automation Configuration</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">UiPath Webhook URL</label>
                            <input
                                type="url"
                                value={uipathForm.webhook_url}
                                onChange={(e) => updateUiPathField('webhook_url', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="https://your-uipath-endpoint"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Tenant Name (optional)</label>
                            <input
                                type="text"
                                value={uipathForm.tenant_name || ''}
                                onChange={(e) => updateUiPathField('tenant_name', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Process Name (optional)</label>
                            <input
                                type="text"
                                value={uipathForm.process_name || ''}
                                onChange={(e) => updateUiPathField('process_name', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">API Token (optional)</label>
                            <input
                                type="password"
                                value={uipathForm.api_token || ''}
                                onChange={(e) => updateUiPathField('api_token', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder={uipathMeta?.has_api_token ? 'Leave empty to keep existing token' : 'Enter UiPath API token'}
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-6 pt-2">
                        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                            <input
                                type="checkbox"
                                checked={uipathForm.is_enabled}
                                onChange={(e) => updateUiPathField('is_enabled', e.target.checked)}
                                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                            />
                            Enable UiPath automation for email sending
                        </label>
                    </div>

                    {uipathMeta && (
                        <div className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-3">
                            UiPath token set: <span className="font-medium">{uipathMeta.has_api_token ? 'Yes' : 'No'}</span>
                        </div>
                    )}

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={savingUiPath}
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2.5 px-5 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all"
                        >
                            {savingUiPath ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {savingUiPath ? 'Saving...' : 'Save UiPath Settings'}
                        </button>
                    </div>
                </form>

                <form onSubmit={handleSaveSmtp} className="bg-white rounded-2xl shadow-xl p-6 space-y-5">
                    <div className="flex items-center gap-3 mb-2">
                        <Mail className="w-6 h-6 text-indigo-600" />
                        <h2 className="text-xl font-bold text-gray-800">SMTP Fallback Configuration</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Host</label>
                            <input
                                type="text"
                                value={smtpForm.host}
                                onChange={(e) => updateSmtpField('host', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Port</label>
                            <input
                                type="number"
                                value={smtpForm.port}
                                onChange={(e) => updateSmtpField('port', Number(e.target.value))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                min={1}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Username</label>
                            <input
                                type="text"
                                value={smtpForm.username || ''}
                                onChange={(e) => updateSmtpField('username', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="your-email@example.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Password</label>
                            <input
                                type="password"
                                value={smtpForm.password || ''}
                                onChange={(e) => updateSmtpField('password', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder={smtpMeta?.has_password ? 'Leave empty to keep existing password' : 'Enter SMTP password'}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">From Email</label>
                            <input
                                type="email"
                                value={smtpForm.from_email || ''}
                                onChange={(e) => updateSmtpField('from_email', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="noreply@example.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">From Name</label>
                            <input
                                type="text"
                                value={smtpForm.from_name}
                                onChange={(e) => updateSmtpField('from_name', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-6 pt-2">
                        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                            <input
                                type="checkbox"
                                checked={smtpForm.use_tls}
                                onChange={(e) => updateSmtpField('use_tls', e.target.checked)}
                                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                            />
                            Use TLS (STARTTLS)
                        </label>

                        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                            <input
                                type="checkbox"
                                checked={smtpForm.is_enabled}
                                onChange={(e) => updateSmtpField('is_enabled', e.target.checked)}
                                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                            />
                            Enable email automation
                        </label>
                    </div>

                    {smtpMeta && (
                        <div className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-3">
                            Active source: <span className="font-medium">{smtpMeta.source}</span> · Password set: <span className="font-medium">{smtpMeta.has_password ? 'Yes' : 'No'}</span>
                        </div>
                    )}

                    {status && (
                        <div className={`rounded-lg px-4 py-3 text-sm ${status.type === 'success'
                            ? 'bg-green-50 border border-green-200 text-green-700'
                            : 'bg-red-50 border border-red-200 text-red-700'
                            }`}>
                            {status.text}
                        </div>
                    )}

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={savingSmtp}
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2.5 px-5 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all"
                        >
                            {savingSmtp ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {savingSmtp ? 'Saving...' : 'Save SMTP Settings'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SMTPSettings;
