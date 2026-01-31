import React from 'react';
import MasterGenericPage from './MasterGenericPage';
import { useLanguage } from '../../context/LanguageContext';

export default function Categories() {
    const { t } = useLanguage();
    return (
        <MasterGenericPage
            title={t('master.categories.title')}
            description={t('master.categories.desc')}
            endpoint="categories"
            columns={[
                { key: 'name', label: t('common.name'), render: (i: any) => <span className="font-semibold">{i.name}</span> }
            ]}
            fields={[
                { name: 'name', label: t('common.name'), required: true }
            ]}
        />
    );
}
