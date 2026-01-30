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
                { key: 'address', label: 'Address' },
                { key: 'identityCardNumber', label: 'KTP', render: (i: any) => i.identityCardNumber || '-' },
                {
                    key: 'identityCardImage',
                    label: 'KTP File',
                    render: (i: any) => i.identityCardImage
                        ? <a href={`http://localhost:3000${i.identityCardImage}`} target="_blank" className="text-blue-600 hover:underline text-xs">View</a>
                        : <span className="text-gray-400 text-xs">-</span>
                }
            ]}
            fields={[
                { name: 'name', label: 'Full Name', required: true },
                { name: 'phone', label: 'Phone Number', required: true },
                { name: 'address', label: 'Address', required: true },
                { name: 'identityCardNumber', label: 'KTP / ID Number', required: true },
                { name: 'identityCardImage', label: 'KTP Image', type: 'file', required: true }
            ]}
        />
    );
}
