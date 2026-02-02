import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Save, Building, Phone, Globe, MessageCircle, WashingMachine } from 'lucide-react';

import { API_BASE_URL } from '../../config/api';

const API_URL = API_BASE_URL;

export default function Settings() {
    const { token, hasRole } = useAuth();
    const { t } = useLanguage();
    const [settings, setSettings] = useState({
        BRAND_NAME: '',
        BRAND_ADDRESS: '',
        BRAND_PHONE: '',
        BRAND_WA: '',
        BRAND_SOCIAL: '',
        BRAND_TAGLINE: '',
        BRAND_LOGO: '',
        ENABLE_MAX_LAUNDRY_DAY: 'false',
        MAX_LAUNDRY_DAYS: '0'
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch(`${API_URL}/settings`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSettings(prev => ({ ...prev, ...data }));
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked.toString() : e.target.value;
        setSettings({ ...settings, [e.target.name]: value });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`${API_URL}/settings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(settings)
            });

            if (res.ok) {
                alert(t('settings.alert.saveSuccess'));
            } else {
                alert(t('settings.alert.saveError'));
            }
        } catch (error) {
            console.error(error);
            alert(t('settings.alert.saveError'));
        } finally {
            setSaving(false);
        }
    };

    if (!hasRole(['SUPERADMIN', 'OWNER'])) {
        return <div className="p-8 text-center text-red-500">{t('common.error')}</div>;
    }

    if (loading) return <div>{t('common.loading')}</div>;

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Building /> {t('settings.title')}
            </h1>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 space-y-6">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">{t('settings.form.brandName')}</label>
                    <input
                        type="text"
                        name="BRAND_NAME"
                        value={settings.BRAND_NAME}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        placeholder="e.g., RUMAH DINAR"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">{t('settings.form.logoUrl')}</label>
                    <div className="space-y-2">
                        <input
                            type="text"
                            name="BRAND_LOGO"
                            value={settings.BRAND_LOGO || ''}
                            onChange={handleChange}
                            className="w-full p-2 border border-gray-300 rounded-lg"
                            placeholder={t('settings.form.logoUrlPlaceholder')}
                        />
                        <div className="bg-blue-50 text-blue-700 p-3 rounded-lg text-sm border border-blue-100 flex items-start gap-2">
                            <span className="text-xl">ℹ️</span>
                            <div>
                                <p className="font-bold">{t('common.actions')} {t('common.editItem')}:</p>
                                <ul className="list-disc list-inside mt-1 space-y-1">
                                    <li>{t('settings.form.logoGuidelines.size')}</li>
                                    <li>{t('settings.form.logoGuidelines.format')}</li>
                                    <li>{t('settings.form.logoGuidelines.maxSize')}</li>
                                    <li>{t('settings.form.logoGuidelines.contrast')}</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">{t('settings.form.tagline')}</label>
                    <input
                        type="text"
                        name="BRAND_TAGLINE"
                        value={settings.BRAND_TAGLINE}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        placeholder="e.g., Sewa Baju & Perlengkapan Pesta"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">{t('settings.form.address')}</label>
                    <textarea
                        name="BRAND_ADDRESS"
                        value={settings.BRAND_ADDRESS}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded-lg h-24"
                        placeholder={t('settings.form.addressPlaceholder')}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
                            <Phone size={14} /> {t('settings.form.phone')}
                        </label>
                        <input
                            type="text"
                            name="BRAND_PHONE"
                            value={settings.BRAND_PHONE}
                            onChange={handleChange}
                            className="w-full p-2 border border-gray-300 rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
                            <MessageCircle size={14} /> {t('settings.form.whatsapp')}
                        </label>
                        <input
                            type="text"
                            name="BRAND_WA"
                            value={settings.BRAND_WA}
                            onChange={handleChange}
                            className="w-full p-2 border border-gray-300 rounded-lg"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
                        <Globe size={14} /> {t('settings.form.socialMedia')}
                    </label>
                    <input
                        type="text"
                        name="BRAND_SOCIAL"
                        value={settings.BRAND_SOCIAL}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        placeholder="@instagram_handle"
                    />
                </div>

                <div className="pt-4 border-t border-gray-100">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <WashingMachine size={20} /> Laundry Rules
                    </h2>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="ENABLE_MAX_LAUNDRY_DAY"
                                name="ENABLE_MAX_LAUNDRY_DAY"
                                checked={settings.ENABLE_MAX_LAUNDRY_DAY === 'true'}
                                onChange={handleChange}
                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <label htmlFor="ENABLE_MAX_LAUNDRY_DAY" className="text-sm font-medium text-gray-700">
                                Enable Maximum Laundry Day Rule
                            </label>
                        </div>

                        {settings.ENABLE_MAX_LAUNDRY_DAY === 'true' && (
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Laundry Buffer (Days)
                                </label>
                                <input
                                    type="number"
                                    name="MAX_LAUNDRY_DAYS"
                                    value={settings.MAX_LAUNDRY_DAYS}
                                    onChange={handleChange}
                                    min="0"
                                    className="w-full md:w-32 p-2 border border-gray-300 rounded-lg"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Items cannot be booked for this many days after return.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="pt-6 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                    >
                        <Save size={18} />
                        {saving ? t('settings.form.saving') : t('common.save')}
                    </button>
                </div>
            </div>
        </div>
    );
}
