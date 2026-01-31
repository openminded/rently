import MasterGenericPage from './MasterGenericPage';
import { useLanguage } from '../../context/LanguageContext';

export default function LaundryPartner() {
    const { t } = useLanguage();
    return (
        <MasterGenericPage
            title={t('master.laundryPartners.title')}
            description={t('master.laundryPartners.desc')}
            endpoint="laundry-partners"
            columns={[
                { key: 'name', label: t('common.name') },
                { key: 'phone', label: 'Phone Number' },
                { key: 'address', label: 'Address' }
            ]}
            fields={[
                { name: 'name', label: t('common.name'), required: true },
                { name: 'phone', label: 'Phone Number' },
                { name: 'address', label: 'Address', type: 'textarea' }
            ]}
        />
    );
}
