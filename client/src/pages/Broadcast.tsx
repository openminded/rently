import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    MessageSquare,
    Link,
    Link2Off,
    RefreshCw,
    Plus,
    Trash2,
    Edit2,
    Send,
    History,
    Layout,
    Smartphone
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const API_URL = 'http://localhost:3000/api';

export default function Broadcast() {
    const { token } = useAuth();
    const { t } = useLanguage();
    const { tab } = useParams();
    const navigate = useNavigate();

    // Derive activeTab from URL parameter
    const activeTab = (tab === 'campaigns' ? 'history' : (tab || 'connection')) as 'connection' | 'templates' | 'history';

    // Connection State
    const [connStatus, setConnStatus] = useState<'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'QR'>('DISCONNECTED');
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [loadingConn, setLoadingConn] = useState(false);

    // Templates State
    const [templates, setTemplates] = useState<any[]>([]);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [currentTemplate, setCurrentTemplate] = useState<any>(null);
    const [templateForm, setTemplateForm] = useState({ name: '', content: '' });

    // History State
    const [history, setHistory] = useState<any[]>([]);
    const [showBroadcastModal, setShowBroadcastModal] = useState(false);
    const [broadcastForm, setBroadcastForm] = useState({
        name: '',
        content: '',
        templateId: '',
        scheduledAt: '',
        targets: '' // JSON or raw string for phone numbers
    });

    useEffect(() => {
        fetchStatus();
        fetchTemplates();
        fetchHistory();

        const interval = setInterval(() => {
            if (activeTab === 'connection') fetchStatus();
        }, 5000);

        return () => clearInterval(interval);
    }, [activeTab]);

    const fetchStatus = async () => {
        try {
            const res = await fetch(`${API_URL}/whatsapp/status`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) return;
            const data = await res.json();
            setConnStatus(data.status);

            if (data.status === 'QR') {
                const qrRes = await fetch(`${API_URL}/whatsapp/qr`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const qrData = await qrRes.json();
                setQrCode(qrData.qr);
            } else {
                setQrCode(null);
            }
        } catch (error) {
            console.error('Failed to fetch status:', error);
        }
    };

    const fetchTemplates = async () => {
        try {
            const res = await fetch(`${API_URL}/broadcast/templates`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch templates');
            const data = await res.json();
            if (Array.isArray(data)) {
                setTemplates(data);
            }
        } catch (error) {
            console.error('Failed to fetch templates:', error);
        }
    };

    const fetchHistory = async () => {
        try {
            const res = await fetch(`${API_URL}/broadcast/history`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch history');
            const data = await res.json();
            if (Array.isArray(data)) {
                setHistory(data);
            }
        } catch (error) {
            console.error('Failed to fetch history:', error);
        }
    };

    const handleConnAction = async (action: 'logout' | 'reconnect') => {
        setLoadingConn(true);
        try {
            await fetch(`${API_URL}/whatsapp/${action}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchStatus();
        } catch (error) {
            console.error(`Failed to ${action}:`, error);
        } finally {
            setLoadingConn(false);
        }
    };

    const saveTemplate = async () => {
        try {
            const method = currentTemplate ? 'PUT' : 'POST';
            const url = currentTemplate ? `${API_URL}/broadcast/templates/${currentTemplate.id}` : `${API_URL}/broadcast/templates`;

            await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(templateForm)
            });

            setShowTemplateModal(false);
            fetchTemplates();
        } catch (error) {
            console.error('Failed to save template:', error);
        }
    };

    const deleteTemplate = async (id: number) => {
        if (!confirm('Are you sure?')) return;
        try {
            await fetch(`${API_URL}/broadcast/templates/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchTemplates();
        } catch (error) {
            console.error('Failed to delete template:', error);
        }
    };

    const startBroadcast = async () => {
        try {
            // Parse targets (simple comma separated line for now)
            const targetList = broadcastForm.targets.split('\n')
                .filter(line => line.trim())
                .map(line => {
                    // split by | first to separate items
                    const [main, items] = line.split('|');
                    const [phone, name] = main.split(',');
                    return {
                        phone: phone?.trim(),
                        name: name?.trim() || '',
                        items: items?.trim() || ''
                    };
                });

            await fetch(`${API_URL}/broadcast/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...broadcastForm,
                    targets: targetList
                })
            });

            setShowBroadcastModal(false);
            fetchHistory();
        } catch (error) {
            console.error('Failed to start broadcast:', error);
        }
    };

    const handleLoadReminder = async (type: 'PICKUP' | 'RETURN') => {
        try {
            const res = await fetch(`${API_URL}/broadcast/reminders?type=${type}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            if (data.targets && data.targets.length > 0) {
                const targetString = data.targets.map((t: any) => `${t.phone},${t.name}|${t.items || ''}`).join('\n');
                setBroadcastForm(prev => ({
                    ...prev,
                    name: `Manual Reminder ${type} - ${new Date().toLocaleDateString()}`,
                    content: data.content,
                    templateId: data.templateId ? String(data.templateId) : '',
                    targets: targetString
                }));
            } else {
                alert(`Tidak ada data ${type} untuk hari ini.`);
            }
        } catch (error) {
            console.error('Failed to load reminder:', error);
            alert('Gagal memuat data reminder.');
        }
    };

    // Auto-load from URL query or State
    useEffect(() => {
        // 1. Check State (from Transactions Modal)
        const locState = (location as any).state;
        if (locState && locState.targets) {
            const { targets, content, templateId, type } = locState;
            const targetString = targets.map((t: any) => `${t.phone},${t.name}|${t.items || ''}`).join('\n');
            setBroadcastForm(prev => ({
                ...prev,
                name: `Manual Reminder ${type} - ${new Date().toLocaleDateString()}`,
                content: content || '',
                templateId: templateId ? String(templateId) : '',
                targets: targetString
            }));
            setShowBroadcastModal(true);
            // Clear state so it doesn't persist on refresh
            window.history.replaceState({}, document.title);
            return;
        }

        // 2. Check Query Params (Direct Link Shortcut)
        const params = new URLSearchParams(location.search);
        const loadType = params.get('load');
        if (loadType === 'PICKUP') {
            handleLoadReminder('PICKUP');
            setShowBroadcastModal(true);
            navigate('/app/broadcast', { replace: true });
        } else if (loadType === 'RETURN') {
            handleLoadReminder('RETURN');
            setShowBroadcastModal(true);
            navigate('/app/broadcast', { replace: true });
        }
    }, [location.search, (location as any).state]);

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <MessageSquare className="text-purple-600" /> {t('broadcast.title')}
                </h1>

                <div className="bg-gray-100 p-1 rounded-lg flex">
                    <button
                        onClick={() => navigate('/app/broadcast/connection')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'connection' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Link className="inline-block mr-2" size={16} /> {t('broadcast.tab.connection')}
                    </button>
                    <button
                        onClick={() => navigate('/app/broadcast/templates')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'templates' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Layout className="inline-block mr-2" size={16} /> {t('broadcast.tab.templates')}
                    </button>
                    <button
                        onClick={() => navigate('/app/broadcast/campaigns')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'history' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <History className="inline-block mr-2" size={16} /> {t('broadcast.tab.campaigns')}
                    </button>
                </div>
            </div>

            {/* Connection Tab */}
            {activeTab === 'connection' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center space-y-6">
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center ${connStatus === 'CONNECTED' ? 'bg-green-100 text-green-600' :
                            connStatus === 'QR' ? 'bg-orange-100 text-orange-600' :
                                'bg-red-100 text-red-600'
                            }`}>
                            <Smartphone size={40} />
                        </div>

                        <div>
                            <h2 className="text-xl font-bold">{t('broadcast.status')}</h2>
                            <p className="text-gray-500 mt-1">
                                {connStatus === 'CONNECTED' ? t('broadcast.linked') :
                                    connStatus === 'QR' ? 'Scan the QR code to connect your account.' :
                                        'Disconnected. Please wait or refresh.'}
                            </p>
                            <span className={`inline-block mt-4 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${connStatus === 'CONNECTED' ? 'bg-green-500 text-white' :
                                connStatus === 'QR' ? 'bg-orange-500 text-white' :
                                    'bg-gray-500 text-white'
                                }`}>
                                {connStatus}
                            </span>
                        </div>

                        <div className="flex flex-col gap-3 w-full max-w-xs">
                            {connStatus === 'CONNECTED' ? (
                                <button
                                    onClick={() => handleConnAction('logout')}
                                    disabled={loadingConn}
                                    className="w-full bg-red-50 text-red-600 py-2.5 rounded-xl font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Link2Off size={18} /> Logout
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={() => handleConnAction('reconnect')}
                                        disabled={loadingConn}
                                        className="w-full bg-purple-600 text-white py-2.5 rounded-xl font-bold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <RefreshCw size={18} className={loadingConn ? 'animate-spin' : ''} /> Refresh QR
                                    </button>

                                    <button
                                        onClick={() => {
                                            if (confirm('Reset Session? This will delete current session data and require re-scan.')) {
                                                handleConnAction('logout');
                                            }
                                        }}
                                        disabled={loadingConn}
                                        className="w-full bg-gray-100 text-gray-600 py-2.5 rounded-xl font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Trash2 size={18} /> Reset Session
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center min-h-[400px]">
                        {connStatus === 'CONNECTED' ? (
                            <div className="text-center space-y-4">
                                <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto">
                                    <RefreshCw size={32} />
                                </div>
                                <h3 className="font-bold text-lg">Already Linked!</h3>
                                <p className="text-gray-500 text-sm max-w-xs">You can now start sending broadcasts or direct messages to your customers.</p>
                            </div>
                        ) : qrCode ? (
                            <div className="space-y-4 text-center">
                                <div className="p-4 bg-white border-2 border-dashed border-gray-200 rounded-xl inline-block">
                                    <img src={qrCode} alt="WhatsApp QR Code" className="w-64 h-64" />
                                </div>
                                <p className="text-xs text-gray-500 animate-pulse">Scanning is required from your WhatsApp Mobile App</p>
                            </div>
                        ) : (
                            <div className="text-center space-y-4">
                                <div className="w-12 h-12 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto animate-spin">
                                    <RefreshCw size={24} />
                                </div>
                                <p className="text-gray-400 text-sm">Generating QR Code...</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Templates Tab */}
            {activeTab === 'templates' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-bold">Message Templates</h2>
                        <button
                            onClick={() => {
                                setCurrentTemplate(null);
                                setTemplateForm({ name: '', content: '' });
                                setShowTemplateModal(true);
                            }}
                            className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-purple-700"
                        >
                            <Plus size={18} /> New Template
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {templates.map(tpl => (
                            <div key={tpl.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
                                <div>
                                    <h3 className="font-bold text-gray-900 border-b pb-2 mb-3">{tpl.name}</h3>
                                    <p className="text-sm text-gray-600 line-clamp-4 whitespace-pre-wrap">{tpl.content}</p>
                                </div>
                                <div className="mt-4 flex justify-end gap-2">
                                    <button
                                        onClick={() => {
                                            setCurrentTemplate(tpl);
                                            setTemplateForm({ name: tpl.name, content: tpl.content });
                                            setShowTemplateModal(true);
                                        }}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => deleteTemplate(tpl.id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-bold">Broadcast History</h2>
                        <button
                            onClick={() => setShowBroadcastModal(true)}
                            className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-purple-700 transition-all hover:scale-105"
                        >
                            <Send size={18} /> Start New Broadcast
                        </button>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-700 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4">Campaign Name</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Targets</th>
                                    <th className="px-6 py-4 text-right">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {history.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold">{item.name || 'Instant Broadcast'}</div>
                                            <div className="text-xs text-gray-500">{item.template?.name || 'Manual Content'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.status === 'SENT' ? 'bg-green-100 text-green-700' :
                                                item.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                                                    'bg-blue-100 text-blue-700'
                                                }`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">
                                                {Array.isArray(item.targets) ? item.targets.length : 0} recipients
                                            </div>
                                            {Array.isArray(item.results) && (
                                                <div className="text-xs text-gray-500">
                                                    {item.results.filter((r: any) => r.status === 'SUCCESS').length} delivered
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right text-gray-500 text-xs">
                                            {new Date(item.createdAt).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Template Modal */}
            {showTemplateModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 bg-gray-50">
                            <h2 className="text-lg font-bold">{currentTemplate ? 'Edit Template' : 'New Template'}</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Template Name</label>
                                <input
                                    type="text"
                                    value={templateForm.name}
                                    onChange={e => setTemplateForm({ ...templateForm, name: e.target.value })}
                                    className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-600 outline-none"
                                    placeholder="Order Completion, Marketing, etc."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Content</label>
                                <textarea
                                    value={templateForm.content}
                                    onChange={e => setTemplateForm({ ...templateForm, content: e.target.value })}
                                    className="w-full p-2.5 border border-gray-300 rounded-xl h-40 focus:ring-2 focus:ring-purple-600 outline-none"
                                    placeholder="Hello {{name}}, your order is ready!"
                                />
                                <p className="text-[10px] text-gray-400 mt-2">Use {'{{name}}'} to personalize the message.</p>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <button onClick={() => setShowTemplateModal(false)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700">Cancel</button>
                            <button
                                onClick={saveTemplate}
                                className="bg-purple-600 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-purple-700"
                            >
                                Save Template
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Broadcast Modal */}
            {showBroadcastModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-gray-900">New Broadcast Campaign</h2>
                            <button onClick={() => setShowBroadcastModal(false)} className="text-gray-400 hover:text-gray-600"><Plus className="rotate-45" /></button>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                {/* Shortcuts */}
                                <div className="flex gap-2 mb-2">
                                    <button
                                        onClick={() => handleLoadReminder('PICKUP')}
                                        className="flex-1 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-xs font-bold hover:bg-blue-100 border border-blue-200"
                                    >
                                        Load Pickup Hari Ini
                                    </button>
                                    <button
                                        onClick={() => handleLoadReminder('RETURN')}
                                        className="flex-1 bg-orange-50 text-orange-700 px-3 py-2 rounded-lg text-xs font-bold hover:bg-orange-100 border border-orange-200"
                                    >
                                        Load Return Hari Ini
                                    </button>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Campaign Name</label>
                                    <input
                                        type="text"
                                        value={broadcastForm.name}
                                        onChange={e => setBroadcastForm({ ...broadcastForm, name: e.target.value })}
                                        className="w-full p-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-purple-600"
                                        placeholder="Promo Eid Al-Fitr"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Use Template</label>
                                    <select
                                        value={broadcastForm.templateId}
                                        onChange={e => {
                                            const tpl = templates.find(t => String(t.id) === e.target.value);
                                            setBroadcastForm({
                                                ...broadcastForm,
                                                templateId: e.target.value,
                                                content: tpl ? tpl.content : broadcastForm.content
                                            });
                                        }}
                                        className="w-full p-2.5 border border-gray-300 rounded-xl outline-none"
                                    >
                                        <option value="">Manual Entry / Custom Content</option>
                                        {templates.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Message Content</label>
                                    <textarea
                                        value={broadcastForm.content}
                                        onChange={e => setBroadcastForm({ ...broadcastForm, content: e.target.value })}
                                        className="w-full p-2.5 border border-gray-300 rounded-xl h-40 outline-none focus:ring-2 focus:ring-purple-600"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1 flex justify-between">
                                        Recipients List
                                        <span className="text-[10px] text-gray-400 font-normal">Format: phone,name (per line)</span>
                                    </label>
                                    <textarea
                                        value={broadcastForm.targets}
                                        onChange={e => setBroadcastForm({ ...broadcastForm, targets: e.target.value })}
                                        className="w-full p-2.5 border border-gray-300 rounded-xl h-56 outline-none focus:ring-2 focus:ring-purple-600 font-mono text-xs"
                                        placeholder="628123456789,John Doe&#10;628987654321,Jane Smith"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Schedule (Optional)</label>
                                    <input
                                        type="datetime-local"
                                        value={broadcastForm.scheduledAt}
                                        onChange={e => setBroadcastForm({ ...broadcastForm, scheduledAt: e.target.value })}
                                        className="w-full p-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-purple-600"
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1 italic">Leave empty to send immediately.</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <button onClick={() => setShowBroadcastModal(false)} className="px-4 py-2 text-sm font-bold text-gray-500">Cancel</button>
                            <button
                                onClick={startBroadcast}
                                disabled={!broadcastForm.content || !broadcastForm.targets}
                                className="bg-purple-600 text-white px-8 py-2.5 rounded-xl text-sm font-bold hover:bg-purple-700 disabled:opacity-50"
                            >
                                Send Messages
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
