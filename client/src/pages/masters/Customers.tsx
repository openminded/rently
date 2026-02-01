import React from 'react';
import MasterGenericPage from './MasterGenericPage';
import { useLanguage } from '../../context/LanguageContext';
import { getImageUrl } from '../../config/api';

export default function Customers() {
    const { t } = useLanguage();
    return (
        <MasterGenericPage
            title={t('master.customers.title')}
            description={t('master.customers.desc')}
            endpoint="customers"
            columns={[
                { key: 'name', label: t('common.name'), render: (i: any) => <span className="font-medium text-gray-900">{i.name}</span> },
                { key: 'phone', label: 'Phone' },
                { key: 'address', label: 'Address' },
                { key: 'identityCardNumber', label: 'KTP', render: (i: any) => i.identityCardNumber || '-' },
                {
                    key: 'identityCardImage',
                    label: 'KTP File',
                    render: (i: any) => i.identityCardImage
                        ? <a href={getImageUrl(i.identityCardImage)} target="_blank" className="text-blue-600 hover:underline text-xs">{t('common.actions')}</a>
                        : <span className="text-gray-400 text-xs">-</span>
                }
            ]}
            fields={[
                { name: 'name', label: t('common.name'), required: true },
                { name: 'phone', label: 'Phone Number', required: true },
                { name: 'address', label: 'Address', required: true },
                { name: 'identityCardNumber', label: 'KTP / ID Number', required: true },
                { name: 'identityCardImage', label: 'KTP Image', type: 'file', required: true }
            ]}
        />
    );
}
