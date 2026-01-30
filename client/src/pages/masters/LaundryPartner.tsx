import MasterGenericPage from './MasterGenericPage';

export default function LaundryPartner() {
    return (
        <MasterGenericPage
            title="Laundry Partners"
            description="Manage laundry service providers"
            endpoint="laundry-partners"
            columns={[
                { key: 'name', label: 'Partner Name' },
                { key: 'phone', label: 'Phone Number' },
                { key: 'address', label: 'Address' }
            ]}
            fields={[
                { name: 'name', label: 'Partner Name', required: true },
                { name: 'phone', label: 'Phone Number' },
                { name: 'address', label: 'Address', type: 'textarea' }
            ]}
        />
    );
}
