import React from 'react';
import MasterGenericPage from './MasterGenericPage';
import { useLanguage } from '../../context/LanguageContext';

export default function Colors() {
    const { t } = useLanguage();
    return (
        <MasterGenericPage
            title={t('master.colors.title')}
            description={t('master.colors.desc')}
            endpoint="colors"
            columns={[
                { key: 'name', label: t('common.name') },
                {
                    key: 'hexCode', label: 'Preview', render: (i: any) => (
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: i.hexCode || '#fff' }}></div>
                            <span className="text-xs text-gray-500">{i.hexCode}</span>
                        </div>
                    )
                }
            ]}
            fields={[
                { name: 'name', label: t('common.name'), required: true },
                { name: 'hexCode', label: 'Hex Code (e.g. #FF0000)', type: 'color', required: true }
            ]}
        />
    );
}
