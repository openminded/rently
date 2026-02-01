import { useState } from 'react';
import { Download, Upload, RefreshCw, Trash2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

import { API_BASE_URL } from '../../config/api';

const API_URL = `${API_BASE_URL}/backup`;

export default function BackupRestore() {
    const { token } = useAuth();
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('');
    const [restoreFile, setRestoreFile] = useState<File | null>(null);

    // Simulate Progress Bar
    const simulateProgress = (duration: number) => {
        setProgress(0);
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 90) {
                    clearInterval(interval);
                    return 90;
                }
                return prev + 10;
            });
        }, duration / 10);
        return interval;
    };

    const handleBackup = async () => {
        setLoading(true);
        setStatus(t('backup.status.generating'));
        const interval = simulateProgress(2000);

        try {
            const res = await fetch(`${API_URL}/download`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Backup failed');

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `pos_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            setProgress(100);
            setStatus(t('backup.status.downloadSuccess'));
        } catch (error) {
            console.error(error);
            setStatus(t('common.error'));
            alert(t('common.error'));
        } finally {
            clearInterval(interval);
            setTimeout(() => { setLoading(false); setProgress(0); }, 3000);
        }
    };

    const handleRestore = async () => {
        if (!restoreFile) return alert(t('backup.alert.selectFile'));
        if (!confirm(t('backup.alert.confirmRestore'))) return;

        setLoading(true);
        setStatus(t('backup.status.restoring'));
        const interval = simulateProgress(5000);

        try {
            const formData = new FormData();
            formData.append('backupFile', restoreFile);

            const res = await fetch(`${API_URL}/restore`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Restore failed');
            }

            setProgress(100);
            setStatus(t('backup.status.restoreSuccess'));
            setTimeout(() => window.location.reload(), 2000);
        } catch (error: any) {
            console.error(error);
            setStatus(`${t('common.error')}: ${error.message}`);
            alert(`${t('common.error')}: ${error.message}`);
            setLoading(false);
        } finally {
            clearInterval(interval);
        }
    };

    const handleReset = async () => {
        if (!confirm(t('backup.alert.confirmReset'))) return;
        const confirmText = prompt(t('backup.alert.typeReset'));
        if (confirmText !== 'RESET') return alert(t('backup.alert.resetCancelled'));

        setLoading(true);
        setStatus(t('backup.status.clearing'));
        const interval = simulateProgress(3000);

        try {
            const res = await fetch(`${API_URL}/reset`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Reset failed');

            setProgress(100);
            setStatus(t('backup.status.clearSuccess'));
            setTimeout(() => window.location.reload(), 2000);
        } catch (error) {
            console.error(error);
            setStatus(t('common.error'));
            alert(t('common.error'));
            setLoading(false);
        } finally {
            clearInterval(interval);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 p-4">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">{t('backup.title')}</h1>
                <p className="text-gray-500">{t('backup.subtitle')}</p>
            </div>

            {loading && (
                <div className="bg-blue-50 border border-blue-100 p-6 rounded-xl text-center space-y-4 animate-in fade-in slide-in-from-top-4">
                    <RefreshCw className="mx-auto text-blue-600 animate-spin" size={32} />
                    <h3 className="font-semibold text-blue-900">{status}</h3>
                    <div className="w-full bg-blue-200 rounded-full h-2.5">
                        <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                    </div>
                    <p className="text-xs text-blue-500">{progress}%</p>
                </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
                {/* Backup Section */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                        <Download className="text-green-600" size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{t('backup.card.backup.title')}</h3>
                    <p className="text-sm text-gray-500 mb-6">{t('backup.card.backup.desc')}</p>
                    <button
                        onClick={handleBackup}
                        disabled={loading}
                        className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400"
                    >
                        <Download size={18} /> {t('backup.card.backup.action')}
                    </button>
                </div>

                {/* Restore Section */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                        <Upload className="text-orange-600" size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{t('backup.card.restore.title')}</h3>
                    <p className="text-sm text-gray-500 mb-6">{t('backup.card.restore.desc')}</p>

                    <div className="space-y-4">
                        <div className="relative">
                            <input
                                type="file"
                                accept=".json"
                                onChange={(e) => setRestoreFile(e.target.files ? e.target.files[0] : null)}
                                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                            />
                        </div>
                        <button
                            onClick={handleRestore}
                            disabled={loading || !restoreFile}
                            className="w-full py-3 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-300"
                        >
                            <RefreshCw size={18} /> {t('backup.card.restore.action')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Reset Section */}
            <div className="mt-8 bg-red-50 p-6 rounded-2xl border border-red-100">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-red-100 rounded-xl">
                        <AlertTriangle className="text-red-600" size={24} />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-red-900 mb-1">{t('backup.card.danger.title')}</h3>
                        <p className="text-sm text-red-700 mb-6">{t('backup.card.danger.desc')}</p>
                        <button
                            onClick={handleReset}
                            disabled={loading}
                            className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            <Trash2 size={18} /> {t('backup.card.danger.action')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
