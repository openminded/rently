import React from 'react';
import MasterGenericPage from './MasterGenericPage';
import { useLanguage } from '../../context/LanguageContext';

export default function ViolationTypes() {
    const { t } = useLanguage();
    return (
        <MasterGenericPage
            title={t('master.violations.title')}
            description={t('master.violations.desc')}
            endpoint="violation-types"
            columns={[
                { key: 'name', label: t('common.name') },
                { key: 'defaultFine', label: 'Default Fine', render: (i: any) => `Rp ${i.defaultFine?.toLocaleString() || 0}` }
            ]}
            fields={[
                { name: 'name', label: t('common.name'), required: true },
                { name: 'defaultFine', label: 'Default Fine Amount', type: 'number', required: true }
            ]}
        />
    );
}
