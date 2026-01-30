import { Routes, Route } from 'react-router-dom';
import { AuthProvider, ProtectedRoute } from './context/AuthContext';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Inventory from './pages/Inventory';
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
import Invoice from './pages/Invoice';
import BackupRestore from './pages/settings/BackupRestore';
import UserManagement from './pages/settings/UserManagement';

function App() {
  return (
    <Routes>
      {/* Invoice Route - Independent Layout for Printing */}
      <Route path="/invoice/:id" element={<Invoice />} />
      <Route path="/login" element={<Login />} />

      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="pos" element={<POS />} />
        <Route path="inventory/catalog" element={<Inventory />} />
        <Route path="inventory/history" element={<InventoryHistory />} />

        {/* Transaction Routes */}
        <Route path="transactions/booking" element={<Transactions type="booking" />} />
        <Route path="transactions/waiting-pickup" element={<Transactions type="waiting-pickup" />} />
        <Route path="transactions/rent" element={<Transactions type="rent" />} />
        <Route path="transactions/need-return" element={<Transactions type="need-return" />} />
        <Route path="transactions/laundry" element={<Transactions type="laundry" />} />
        <Route path="transactions/completed" element={<Transactions type="completed" />} />

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

        <Route path="settings/backup-restore" element={<BackupRestore />} />
        <Route path="settings/users" element={<UserManagement />} />


      </Route>
    </Routes>
  );
}

export default App;
