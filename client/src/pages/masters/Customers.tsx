import React from 'react';
import MasterGenericPage from './MasterGenericPage';

export default function Customers() {
    return (
        <MasterGenericPage
            title="Customers"
            description="Manage customer database"
            endpoint="customers"
            columns={[
                { key: 'name', label: 'Name', render: (i: any) => <span className="font-medium text-gray-900">{i.name}</span> },
                { key: 'phone', label: 'Phone' },
                { key: 'identityCardNumber', label: 'KTP', render: (i: any) => i.identityCardNumber || '-' }
            ]}
            fields={[
                { name: 'name', label: 'Full Name', required: true },
                { name: 'phone', label: 'Phone Number', required: true },
                { name: 'identityCardNumber', label: 'KTP / ID Number', required: false },
                { name: 'address', label: 'Address', required: false }
            ]}
        />
    );
}
