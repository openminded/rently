import React from 'react';
import MasterGenericPage from './MasterGenericPage';
import { useLanguage } from '../../context/LanguageContext';

export default function Brands() {
    const { t } = useLanguage();
    return (
        <MasterGenericPage
            title={t('master.brands.title')}
            description={t('master.brands.desc')}
            endpoint="brands"
            columns={[
                { key: 'name', label: t('common.name'), render: (i: any) => <span className="font-medium">{i.name}</span> }
            ]}
            fields={[
                { name: 'name', label: t('common.name'), required: true }
            ]}
        />
    );
}
