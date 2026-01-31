import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, ProtectedRoute } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import Login from './pages/Login';
import LandingPage from './pages/LandingPage';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Inventory from './pages/Inventory';
import Showcase from './pages/Showcase';
import InventoryHistory from './pages/InventoryHistory';
import Transactions from './pages/Transactions';
import Laundry from './pages/Laundry';
import Categories from './pages/masters/Categories';
import Brands from './pages/masters/Brands';
import Colors from './pages/masters/Colors';
import Sizes from './pages/masters/Sizes';
import PaymentMethods from './pages/masters/PaymentMethods';
import ViolationTypes from './pages/masters/ViolationTypes';
import Customers from './pages/masters/Customers';
import LaundryPartner from './pages/masters/LaundryPartner';
import DepositVariants from './pages/masters/DepositVariants';
import Invoice from './pages/Invoice';
import BackupRestore from './pages/settings/BackupRestore';
import UserManagement from './pages/settings/UserManagement';
import Settings from './pages/settings/Settings';
import AppConfig from './pages/settings/AppConfig';
import Broadcast from './pages/Broadcast';
import Finance from './pages/Finance';

function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Invoice Route - Independent Layout for Printing */}
            <Route path="/invoice/:id" element={<Invoice />} />

            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />

            {/* Protected App Routes */}
            <Route path="/app" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="pos" element={<POS />} />
              <Route path="inventory/catalog" element={<Inventory />} />
              <Route path="inventory/showcase" element={<Showcase />} />
              <Route path="inventory/history" element={<InventoryHistory />} />

              {/* Transaction Routes */}
              <Route path="transactions" element={<Transactions type="booking" />} />
              <Route path="transactions/:type" element={<Transactions type="booking" />} />

              {/* Laundry Routes */}
              <Route path="laundry" element={<Laundry />} />

              {/* Master Data Routes */}
              <Route path="masters/categories" element={<Categories />} />
              <Route path="masters/brands" element={<Brands />} />
              <Route path="masters/colors" element={<Colors />} />
              <Route path="masters/sizes" element={<Sizes />} />
              <Route path="masters/payments" element={<PaymentMethods />} />
              <Route path="masters/violations" element={<ViolationTypes />} />
              <Route path="masters/customers" element={<Customers />} />
              <Route path="masters/laundry-partners" element={<LaundryPartner />} />
              <Route path="masters/deposit-variants" element={<DepositVariants />} />

              {/* Settings Routes */}
              <Route path="settings/backup-restore" element={<BackupRestore />} />
              <Route path="settings/users" element={<UserManagement />} />
              <Route path="settings/brand" element={<Settings />} />
              <Route path="settings/app-config" element={<AppConfig />} />
              <Route path="broadcast" element={<Broadcast />} />
              <Route path="broadcast/:tab" element={<Broadcast />} />

              {/* Finance Route */}
              <Route path="finance" element={<Finance />} />

            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </LanguageProvider >
  );
}

export default App;
