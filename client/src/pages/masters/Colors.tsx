import React from 'react';
import MasterGenericPage from './MasterGenericPage';

export default function Colors() {
    return (
        <MasterGenericPage
            title="Colors"
            description="Manage product colors"
            endpoint="colors"
            columns={[
                { key: 'name', label: 'Name' },
                {
                    key: 'hexCode', label: 'Preview', render: (i: any) => (
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: i.hexCode || '#fff' }}></div>
                            <span className="text-xs text-gray-500">{i.hexCode}</span>
                        </div>
                    )
                }
            ]}
            fields={[
                { name: 'name', label: 'Color Name', required: true },
                { name: 'hexCode', label: 'Hex Code (e.g. #FF0000)', type: 'color', required: true }
            ]}
        />
    );
}
