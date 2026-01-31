import React from 'react';
import MasterGenericPage from './MasterGenericPage';
import { useLanguage } from '../../context/LanguageContext';

export default function PaymentMethods() {
    const { t } = useLanguage();
    return (
        <MasterGenericPage
            title={t('master.payments.title')}
            description={t('master.payments.desc')}
            endpoint="payment-methods"
            columns={[
                { key: 'name', label: t('common.name') },
                { key: 'account', label: 'Account Number', render: (i: any) => i.account || '-' }
            ]}
            fields={[
                { name: 'name', label: t('common.name'), required: true },
                { name: 'account', label: 'Account Number (Optional)', required: false }
            ]}
        />
    );
}
