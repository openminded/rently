import React from 'react';
import MasterGenericPage from './MasterGenericPage';
import { useLanguage } from '../../context/LanguageContext';

export default function Sizes() {
    const { t } = useLanguage();
    return (
        <MasterGenericPage
            title={t('master.sizes.title')}
            description={t('master.sizes.desc')}
            endpoint="sizes"
            columns={[
                { key: 'name', label: t('common.name'), render: (i: any) => <span className="font-bold bg-gray-100 px-2 py-1 rounded">{i.name}</span> }
            ]}
            fields={[
                { name: 'name', label: t('common.name'), required: true }
            ]}
        />
    );
}
