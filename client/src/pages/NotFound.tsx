import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function NotFound() {
    const navigate = useNavigate();
    const { t } = useLanguage();

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="text-center max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
                <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertCircle size={40} className="text-red-500" />
                </div>

                <h1 className="text-6xl font-black text-gray-900 mb-2">404</h1>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('common.notFound') || 'Page Not Found'}</h2>

                <p className="text-gray-500 mb-8 leading-relaxed">
                    {t('common.notFoundDesc') || 'Oops! The page you are looking for does not exist or has been moved.'}
                </p>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        <ArrowLeft size={18} />
                        {t('common.back') || 'Go Back'}
                    </button>

                    <button
                        onClick={() => navigate('/app')}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors shadow-lg shadow-gray-900/10"
                    >
                        <Home size={18} />
                        Go to Dashboard
                    </button>
                </div>
            </div>

            <p className="mt-8 text-gray-400 text-sm">
                &copy; {new Date().getFullYear()} Rumah Dinar. All rights reserved.
            </p>
        </div>
    );
}
