-- Reset Transactional Data (Keep Users and Master Data)
-- Run this SQL in your MySQL client (phpMyAdmin, MySQL Workbench, etc.)

-- Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

-- Delete transactional data
DELETE FROM `Payment`;
DELETE FROM `Fine`;
DELETE FROM `TransactionItem`;
DELETE FROM `Transaction`;
DELETE FROM `LaundryLog`;
DELETE FROM `LaundryBatch`;
DELETE FROM `Expense`;
DELETE FROM `ItemInstance`;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Reset auto-increment counters
ALTER TABLE `Payment` AUTO_INCREMENT = 1;
ALTER TABLE `Fine` AUTO_INCREMENT = 1;
ALTER TABLE `TransactionItem` AUTO_INCREMENT = 1;
ALTER TABLE `Transaction` AUTO_INCREMENT = 1;
ALTER TABLE `LaundryLog` AUTO_INCREMENT = 1;
ALTER TABLE `LaundryBatch` AUTO_INCREMENT = 1;
ALTER TABLE `Expense` AUTO_INCREMENT = 1;

SELECT 'Transactional data reset complete!' AS Status;
