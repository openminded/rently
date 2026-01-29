import React from 'react';
import MasterGenericPage from './MasterGenericPage';

export default function Brands() {
    return (
        <MasterGenericPage
            title="Brands"
            description="Manage product brands (e.g. Zara, H&M, Local)"
            endpoint="brands"
            columns={[
                { key: 'name', label: 'Name', render: (i: any) => <span className="font-medium">{i.name}</span> }
            ]}
            fields={[
                { name: 'name', label: 'Brand Name', required: true }
            ]}
        />
    );
}
