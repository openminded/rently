import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Inventory from './pages/Inventory';
import Transactions from './pages/Transactions';
import Categories from './pages/masters/Categories';
import Brands from './pages/masters/Brands';
import Colors from './pages/masters/Colors';
import Sizes from './pages/masters/Sizes';
import PaymentMethods from './pages/masters/PaymentMethods';
import ViolationTypes from './pages/masters/ViolationTypes';
import Customers from './pages/masters/Customers';
import Invoice from './pages/Invoice';
import Returns from './pages/Returns';

function App() {
  return (
    <Routes>
      {/* Invoice Route - Independent Layout for Printing */}
      <Route path="/invoice/:id" element={<Invoice />} />

      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="pos" element={<POS />} />
        <Route path="inventory" element={<Inventory />} />

        {/* Transaction Routes */}
        <Route path="transactions/booking" element={<Transactions type="booking" />} />
        <Route path="transactions/waiting-pickup" element={<Transactions type="waiting-pickup" />} />
        <Route path="transactions/rent" element={<Transactions type="rent" />} />
        <Route path="transactions/need-return" element={<Transactions type="need-return" />} />
        <Route path="transactions/laundry" element={<Transactions type="laundry" />} />
        <Route path="transactions/completed" element={<Transactions type="completed" />} />

        {/* Master Data Routes */}
        <Route path="masters/categories" element={<Categories />} />
        <Route path="masters/brands" element={<Brands />} />
        <Route path="masters/colors" element={<Colors />} />
        <Route path="masters/sizes" element={<Sizes />} />
        <Route path="masters/payments" element={<PaymentMethods />} />
        <Route path="masters/violations" element={<ViolationTypes />} />
        <Route path="masters/customers" element={<Customers />} />


      </Route>
    </Routes>
  );
}

export default App;
