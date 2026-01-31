
import React from 'react';
import MasterGenericPage from './MasterGenericPage';
import { useLanguage } from '../../context/LanguageContext';

export default function DepositVariants() {
    const { t } = useLanguage();
    return (
        <MasterGenericPage
            title={t('master.depositVariants.title')}
            description={t('master.depositVariants.desc')}
            endpoint="deposit-variants"
            columns={[
                { key: 'name', label: t('common.name'), render: (i: any) => <span className="font-semibold">{i.name}</span> },
                { key: 'amount', label: 'Amount', render: (i: any) => <span>Rp {i.amount.toLocaleString('id-ID')}</span> }
            ]}
            fields={[
                { name: 'name', label: t('common.name'), required: true },
                // Assuming MasterGenericPage handles type="number" or defaults to text. 
                // If it doesn't support type, user enters number as text, parsed by backend (which I did handle via parseFloat).
                // But improving UX with type="number" is better if supported.
                { name: 'amount', label: 'Amount (Rp)', required: true, type: 'number' }
            ]}
        />
    );
}
