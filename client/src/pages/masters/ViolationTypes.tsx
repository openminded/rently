import React from 'react';
import MasterGenericPage from './MasterGenericPage';

export default function ViolationTypes() {
    return (
        <MasterGenericPage
            title="Violation Types"
            description="Manage fines and violation rules"
            endpoint="violation-types"
            columns={[
                { key: 'name', label: 'Violation' },
                { key: 'defaultFine', label: 'Default Fine', render: (i: any) => `Rp ${i.defaultFine?.toLocaleString() || 0}` }
            ]}
            fields={[
                { name: 'name', label: 'Violation Name', required: true },
                { name: 'defaultFine', label: 'Default Fine Amount', type: 'number', required: true }
            ]}
        />
    );
}
