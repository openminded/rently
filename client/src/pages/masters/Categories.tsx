import React from 'react';
import MasterGenericPage from './MasterGenericPage';

export default function Categories() {
    return (
        <MasterGenericPage
            title="Categories"
            description="Manage product categories (e.g. Kebaya, Jas)"
            endpoint="categories"
            columns={[
                { key: 'name', label: 'Name', render: (i: any) => <span className="font-semibold">{i.name}</span> }
            ]}
            fields={[
                { name: 'name', label: 'Category Name', required: true }
            ]}
        />
    );
}
