-- ========================================
-- DUMMY DATA FOR TESTING - VALIDATED
-- Password for all users: zzzz
-- ========================================

SET FOREIGN_KEY_CHECKS = 0;

-- ========================================
-- 1. USERS (Password: zzzz)
-- ========================================
DELETE FROM `User`;
INSERT INTO `User` (`id`, `username`, `password`, `name`, `role`, `createdAt`, `updatedAt`) VALUES
(1, 'superadmin', '$2b$10$1j/unYbzSjsw4Ymw4QvrN.tq29LzDF9GvEkNtBbaD.oczEWD1SqBK', 'Super Admin', 'SUPERADMIN', NOW(), NOW()),
(2, 'owner', '$2b$10$1j/unYbzSjsw4Ymw4QvrN.tq29LzDF9GvEkNtBbaD.oczEWD1SqBK', 'Owner', 'OWNER', NOW(), NOW()),
(3, 'supervisor', '$2b$10$1j/unYbzSjsw4Ymw4QvrN.tq29LzDF9GvEkNtBbaD.oczEWD1SqBK', 'Supervisor', 'SUPERVISOR', NOW(), NOW()),
(4, 'kasir', '$2b$10$1j/unYbzSjsw4Ymw4QvrN.tq29LzDF9GvEkNtBbaD.oczEWD1SqBK', 'Kasir', 'KASIR', NOW(), NOW());

-- ========================================
-- 2. MASTER DATA
-- ========================================

-- Categories (NO createdAt field in schema!)
DELETE FROM `Category`;
INSERT INTO `Category` (`id`, `name`) VALUES
(1, 'Gaun Pesta'),
(2, 'Kebaya'),
(3, 'Jas Pria'),
(4, 'Baju Anak'),
(5, 'Aksesoris');

-- Brands (NO createdAt field in schema!)
DELETE FROM `Brand`;
INSERT INTO `Brand` (`id`, `name`) VALUES
(1, 'Elegance'),
(2, 'Royal Collection'),
(3, 'Modern Style'),
(4, 'Classic'),
(5, 'Kids Fashion');

-- Colors (NO createdAt field in schema!)
DELETE FROM `Color`;
INSERT INTO `Color` (`id`, `name`, `hexCode`) VALUES
(1, 'Merah', '#FF0000'),
(2, 'Biru', '#0000FF'),
(3, 'Hitam', '#000000'),
(4, 'Putih', '#FFFFFF'),
(5, 'Pink', '#FFC0CB'),
(6, 'Gold', '#FFD700'),
(7, 'Silver', '#C0C0C0'),
(8, 'Hijau', '#008000');

-- Sizes (NO createdAt field in schema!)
DELETE FROM `Size`;
INSERT INTO `Size` (`id`, `name`) VALUES
(1, 'XS'),
(2, 'S'),
(3, 'M'),
(4, 'L'),
(5, 'XL'),
(6, 'XXL');

-- Payment Methods (NO createdAt field in schema!)
DELETE FROM `PaymentMethod`;
INSERT INTO `PaymentMethod` (`id`, `name`, `account`) VALUES
(1, 'Cash', NULL),
(2, 'Transfer BCA', '1234567890'),
(3, 'QRIS', NULL),
(4, 'Debit Card', NULL),
(5, 'Credit Card', NULL);

-- Violation Types (defaultFine, NOT defaultAmount!)
DELETE FROM `ViolationType`;
INSERT INTO `ViolationType` (`id`, `name`, `defaultFine`) VALUES
(1, 'Keterlambatan', 50000),
(2, 'Kerusakan Ringan', 100000),
(3, 'Kerusakan Berat', 500000),
(4, 'Hilang', 1000000),
(5, 'Noda', 75000);

-- Customers (HAS updatedAt!)
DELETE FROM `Customer`;
INSERT INTO `Customer` (`id`, `name`, `phone`, `address`, `identityCardNumber`, `identityCardImage`, `createdAt`, `updatedAt`) VALUES
(1, 'Dewi Lestari', '081234567890', 'Jl. Merdeka No. 123, Jakarta', NULL, NULL, NOW(), NOW()),
(2, 'Budi Santoso', '081234567891', 'Jl. Sudirman No. 45, Jakarta', NULL, NULL, NOW(), NOW()),
(3, 'Siti Nurhaliza', '081234567892', 'Jl. Gatot Subroto No. 78, Jakarta', NULL, NULL, NOW(), NOW()),
(4, 'Ahmad Rizki', '081234567893', 'Jl. Thamrin No. 90, Jakarta', NULL, NULL, NOW(), NOW()),
(5, 'Maya Putri', '081234567894', 'Jl. Kuningan No. 12, Jakarta', NULL, NULL, NOW(), NOW());

-- Laundry Partners (HAS createdAt!)
DELETE FROM `LaundryPartner`;
INSERT INTO `LaundryPartner` (`id`, `name`, `phone`, `address`, `createdAt`) VALUES
(1, 'Laundry Express', '081234560001', 'Jl. Laundry No. 1, Jakarta', NOW()),
(2, 'Clean & Fresh', '081234560002', 'Jl. Bersih No. 2, Jakarta', NOW()),
(3, 'Premium Wash', '081234560003', 'Jl. Premium No. 3, Jakarta', NOW());

-- ========================================
-- 3. INVENTORY (Items & Variants)
-- ========================================

-- Items (HAS createdAt and updatedAt!)
DELETE FROM `Item`;
INSERT INTO `Item` (`id`, `name`, `categoryId`, `brandId`, `rentalPrice`, `description`, `createdAt`, `updatedAt`) VALUES
(1, 'Gaun Pesta Mewah', 1, 2, 500000, 'Gaun pesta mewah untuk acara formal', NOW(), NOW()),
(2, 'Kebaya Modern', 2, 1, 350000, 'Kebaya modern dengan desain elegan', NOW(), NOW()),
(3, 'Jas Pengantin Pria', 3, 4, 450000, 'Jas pengantin pria premium', NOW(), NOW()),
(4, 'Dress Anak Princess', 4, 5, 200000, 'Dress anak tema princess', NOW(), NOW()),
(5, 'Gaun Pesta Elegan', 1, 1, 550000, 'Gaun pesta dengan detail elegan', NOW(), NOW()),
(6, 'Kebaya Tradisional', 2, 4, 400000, 'Kebaya tradisional klasik', NOW(), NOW()),
(7, 'Jas Formal Pria', 3, 3, 350000, 'Jas formal untuk acara resmi', NOW(), NOW()),
(8, 'Baju Anak Superhero', 4, 5, 150000, 'Baju anak tema superhero', NOW(), NOW());

-- Item Variants (HAS createdAt, NO stock field - stock is calculated from instances!)
DELETE FROM `ItemVariant`;
INSERT INTO `ItemVariant` (`id`, `itemId`, `sizeId`, `colorId`, `createdAt`) VALUES
-- Gaun Pesta Mewah
(1, 1, 2, 1, NOW()), -- S, Merah
(2, 1, 3, 6, NOW()), -- M, Gold
(3, 1, 4, 3, NOW()), -- L, Hitam
-- Kebaya Modern
(4, 2, 2, 4, NOW()), -- S, Putih
(5, 2, 3, 5, NOW()), -- M, Pink
(6, 2, 4, 2, NOW()), -- L, Biru
-- Jas Pengantin Pria
(7, 3, 3, 3, NOW()), -- M, Hitam
(8, 3, 4, 3, NOW()), -- L, Hitam
(9, 3, 5, 4, NOW()), -- XL, Putih
-- Dress Anak Princess
(10, 4, 1, 5, NOW()), -- XS, Pink
(11, 4, 2, 4, NOW()), -- S, Putih
-- Gaun Pesta Elegan
(12, 5, 3, 1, NOW()), -- M, Merah
(13, 5, 4, 6, NOW()), -- L, Gold
-- Kebaya Tradisional
(14, 6, 2, 8, NOW()), -- S, Hijau
(15, 6, 3, 1, NOW()), -- M, Merah
-- Jas Formal Pria
(16, 7, 3, 3, NOW()), -- M, Hitam
(17, 7, 4, 2, NOW()), -- L, Biru
-- Baju Anak Superhero
(18, 8, 1, 2, NOW()), -- XS, Biru
(19, 8, 2, 1, NOW()); -- S, Merah

-- Item Instances (SKUs) - HAS createdAt!
DELETE FROM `ItemInstance`;
INSERT INTO `ItemInstance` (`sku`, `itemVariantId`, `status`, `createdAt`) VALUES
-- Gaun Pesta Mewah - S Merah (2 pcs)
('GPM-S-RED-001', 1, 'AVAILABLE', NOW()),
('GPM-S-RED-002', 1, 'AVAILABLE', NOW()),
-- Gaun Pesta Mewah - M Gold (2 pcs)
('GPM-M-GLD-001', 2, 'AVAILABLE', NOW()),
('GPM-M-GLD-002', 2, 'AVAILABLE', NOW()),
-- Gaun Pesta Mewah - L Hitam (1 pc)
('GPM-L-BLK-001', 3, 'AVAILABLE', NOW()),
-- Kebaya Modern - S Putih (2 pcs)
('KBY-S-WHT-001', 4, 'AVAILABLE', NOW()),
('KBY-S-WHT-002', 4, 'AVAILABLE', NOW()),
-- Kebaya Modern - M Pink (2 pcs)
('KBY-M-PNK-001', 5, 'AVAILABLE', NOW()),
('KBY-M-PNK-002', 5, 'AVAILABLE', NOW()),
-- Kebaya Modern - L Biru (1 pc)
('KBY-L-BLU-001', 6, 'AVAILABLE', NOW()),
-- Jas Pengantin - M Hitam (2 pcs)
('JAS-M-BLK-001', 7, 'AVAILABLE', NOW()),
('JAS-M-BLK-002', 7, 'AVAILABLE', NOW()),
-- Jas Pengantin - L Hitam (2 pcs)
('JAS-L-BLK-001', 8, 'AVAILABLE', NOW()),
('JAS-L-BLK-002', 8, 'AVAILABLE', NOW()),
-- Jas Pengantin - XL Putih (1 pc)
('JAS-XL-WHT-001', 9, 'AVAILABLE', NOW()),
-- Dress Anak - XS Pink (3 pcs)
('DRS-XS-PNK-001', 10, 'AVAILABLE', NOW()),
('DRS-XS-PNK-002', 10, 'AVAILABLE', NOW()),
('DRS-XS-PNK-003', 10, 'AVAILABLE', NOW()),
-- Dress Anak - S Putih (2 pcs)
('DRS-S-WHT-001', 11, 'AVAILABLE', NOW()),
('DRS-S-WHT-002', 11, 'AVAILABLE', NOW()),
-- Gaun Elegan - M Merah (2 pcs)
('GEL-M-RED-001', 12, 'AVAILABLE', NOW()),
('GEL-M-RED-002', 12, 'AVAILABLE', NOW()),
-- Gaun Elegan - L Gold (1 pc)
('GEL-L-GLD-001', 13, 'AVAILABLE', NOW()),
-- Kebaya Tradisional - S Hijau (2 pcs)
('KBT-S-GRN-001', 14, 'AVAILABLE', NOW()),
('KBT-S-GRN-002', 14, 'AVAILABLE', NOW()),
-- Kebaya Tradisional - M Merah (2 pcs)
('KBT-M-RED-001', 15, 'AVAILABLE', NOW()),
('KBT-M-RED-002', 15, 'AVAILABLE', NOW()),
-- Jas Formal - M Hitam (2 pcs)
('JSF-M-BLK-001', 16, 'AVAILABLE', NOW()),
('JSF-M-BLK-002', 16, 'AVAILABLE', NOW()),
-- Jas Formal - L Biru (2 pcs)
('JSF-L-BLU-001', 17, 'AVAILABLE', NOW()),
('JSF-L-BLU-002', 17, 'AVAILABLE', NOW()),
-- Baju Anak Superhero - XS Biru (2 pcs)
('BAK-XS-BLU-001', 18, 'AVAILABLE', NOW()),
('BAK-XS-BLU-002', 18, 'AVAILABLE', NOW()),
-- Baju Anak Superhero - S Merah (2 pcs)
('BAK-S-RED-001', 19, 'AVAILABLE', NOW()),
('BAK-S-RED-002', 19, 'AVAILABLE', NOW());

SET FOREIGN_KEY_CHECKS = 1;

-- ========================================
-- SUMMARY
-- ========================================
SELECT 'Dummy data seeded successfully!' AS Status;
SELECT COUNT(*) AS Users FROM `User`;
SELECT COUNT(*) AS Categories FROM `Category`;
SELECT COUNT(*) AS Brands FROM `Brand`;
SELECT COUNT(*) AS Colors FROM `Color`;
SELECT COUNT(*) AS Sizes FROM `Size`;
SELECT COUNT(*) AS PaymentMethods FROM `PaymentMethod`;
SELECT COUNT(*) AS ViolationTypes FROM `ViolationType`;
SELECT COUNT(*) AS Customers FROM `Customer`;
SELECT COUNT(*) AS LaundryPartners FROM `LaundryPartner`;
SELECT COUNT(*) AS Items FROM `Item`;
SELECT COUNT(*) AS ItemVariants FROM `ItemVariant`;
SELECT COUNT(*) AS ItemInstances FROM `ItemInstance`;
