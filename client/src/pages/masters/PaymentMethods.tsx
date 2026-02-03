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
                { key: 'type', label: t('common.type' as any) },
                { key: 'account', label: 'Account Number', render: (i: any) => i.account || '-' }
            ]}
            fields={[
                { name: 'name', label: t('common.name'), required: true },
                {
                    name: 'type',
                    label: t('common.type' as any),
                    required: true,
                    type: 'select',
                    options: [
                        { value: 'CASH', label: 'Cash' },
                        { value: 'TRANSFER', label: 'Transfer Bank (manual checking)' },
                        { value: 'GATEWAY', label: 'Payment Gateway - Duitku (automatic)' }
                    ]
                },
                { name: 'account', label: 'Account Number (Optional)', required: false }
            ]}
        />
    );
}
