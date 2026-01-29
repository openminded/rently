import React from 'react';
import MasterGenericPage from './MasterGenericPage';

export default function PaymentMethods() {
    return (
        <MasterGenericPage
            title="Payment Methods"
            description="Manage allowed payment types (e.g. Transfer, Cash)"
            endpoint="payment-methods"
            columns={[
                { key: 'name', label: 'Name' },
                { key: 'account', label: 'Account Number', render: (i: any) => i.account || '-' }
            ]}
            fields={[
                { name: 'name', label: 'Method Name', required: true },
                { name: 'account', label: 'Account Number (Optional)', required: false }
            ]}
        />
    );
}
