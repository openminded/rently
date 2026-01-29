import React from 'react';
import MasterGenericPage from './MasterGenericPage';

export default function Sizes() {
    return (
        <MasterGenericPage
            title="Sizes"
            description="Manage sizing standards (e.g. S, M, L, XL)"
            endpoint="sizes"
            columns={[
                { key: 'name', label: 'Size Label', render: (i: any) => <span className="font-bold bg-gray-100 px-2 py-1 rounded">{i.name}</span> }
            ]}
            fields={[
                { name: 'name', label: 'Size Name', required: true }
            ]}
        />
    );
}
