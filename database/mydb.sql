-- phpMyAdmin SQL Dump
-- version 5.1.3
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 19, 2022 at 10:39 AM
-- Server version: 10.4.22-MariaDB
-- PHP Version: 7.4.28

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `mydb`
--

-- --------------------------------------------------------

--
-- Table structure for table `customer`
--

CREATE TABLE `customer` (
  `customer_id` int(11) NOT NULL,
  `type_id` int(11) NOT NULL,
  `type_name` varchar(200) NOT NULL,
  `type_amount` float NOT NULL,
  `installment_amount` float NOT NULL,
  `customer_name ` varchar(255) NOT NULL,
  `customer_contact` varchar(255) NOT NULL,
  `customer_address` varchar(255) NOT NULL,
  `cus_asset` varchar(255) NOT NULL,
  `asset_price` float NOT NULL,
  `img` varchar(200) NOT NULL,
  `date` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `customer`
--

INSERT INTO `customer` (`customer_id`, `type_id`, `type_name`, `type_amount`, `installment_amount`, `customer_name `, `customer_contact`, `customer_address`, `cus_asset`, `asset_price`, `img`, `date`) VALUES
(1, 1, 'Home Loan', 300000, 25000, 'Jude Suares', '09123456789', 'jude@gmail.com', '50000', 50000, 'download.jpg', '2022-04-19'),
(2, 2, 'Phone Loan', 20000, 3333, 'Princely Cezar', '09120118823', 'Brgy.San Pedro, Binalbagan', '100000', 5000, 'images.png', '2022-04-19');

-- --------------------------------------------------------

--
-- Table structure for table `installment`
--

CREATE TABLE `installment` (
  `install_id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `amount` float NOT NULL,
  `remaining` float NOT NULL,
  `status` varchar(11) NOT NULL,
  `fine` float NOT NULL,
  `ins_date` varchar(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `installment`
--

INSERT INTO `installment` (`install_id`, `customer_id`, `amount`, `remaining`, `status`, `fine`, `ins_date`) VALUES
(1, 1, 25000, 275000, 'Late', 50, '2020-05-12'),
(2, 3, 25000, 275000, 'Late', 50, '2020-05-15'),
(3, 2, 25000, 275000, 'On Time', 0, '2020-05-08'),
(4, 2, 25000, 250000, 'Late', 50, '2020-06-13'),
(5, 3, 25000, 250000, 'Late', 50, '2020-06-13'),
(6, 4, 3333.33, 16666.7, 'Late', 50, '2020-04-24'),
(7, 4, 3333.33, 13333.4, 'On Time', 0, '2020-04-11'),
(8, 4, 6666.66, 6666.74, 'Delayed', 66.6666, '2020-05-15'),
(9, 4, 6666.66, 6666.74, 'Delayed', 66.6666, '2020-05-08'),
(10, 4, 3333.33, 10000.1, 'On Time', 0, '2020-04-18'),
(11, 4, 3333.33, 6666.77, 'On Time', 0, '2020-04-25'),
(12, 2, 25000, 225000, 'On Time', 0, '2020-06-18'),
(13, 2, 50000, 175000, 'Delayed', 500, '2020-09-24'),
(14, 2, 50000, 125000, 'Delayed', 500, '2020-12-11'),
(15, 3, 50000, 200000, 'Delayed', 500, '2020-08-07'),
(16, 3, 50000, 150000, 'Delayed', 500, '2020-10-15'),
(17, 3, 25000, 125000, 'Late', 50, '2020-11-07'),
(18, 3, 25000, 100000, 'On Time', 0, '2020-12-05'),
(19, 6, 25000, 275000, 'Late', 50, '2020-04-11'),
(20, 6, 50000, 225000, 'Delayed', 500, '2020-06-13'),
(21, 7, 3333.33, 16666.7, 'Late', 50, '2020-04-11'),
(22, 6, 25000, 200000, 'Late', 50, '2020-04-11');

-- --------------------------------------------------------

--
-- Table structure for table `loan_info`
--

CREATE TABLE `loan_info` (
  `type_id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `type_amount` float NOT NULL,
  `remaining_amount` float NOT NULL,
  `installment_no` int(11) NOT NULL,
  `installment_remaining` int(11) NOT NULL,
  `installment_amount` float NOT NULL,
  `date` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `loan_info`
--

INSERT INTO `loan_info` (`type_id`, `customer_id`, `type_amount`, `remaining_amount`, `installment_no`, `installment_remaining`, `installment_amount`, `date`) VALUES
(1, 1, 300000, 275000, 12, 11, 25000, '2020-04-09'),
(1, 2, 300000, 125000, 12, 5, 25000, '2020-04-09'),
(1, 3, 300000, 100000, 12, 4, 25000, '2020-04-09'),
(2, 4, 20000, 6666.77, 6, 2, 3333.33, '2020-04-09'),
(1, 5, 300000, 300000, 12, 12, 25000, '2020-04-10'),
(1, 6, 300000, 200000, 12, 8, 25000, '2020-04-10'),
(2, 7, 20000, 16666.7, 6, 5, 3333.33, '2020-04-10'),
(1, 8, 300000, 300000, 12, 12, 25000, '2022-04-19'),
(2, 9, 20000, 20000, 6, 6, 3333, '2022-04-19');

-- --------------------------------------------------------

--
-- Table structure for table `customer_registration`
--

CREATE TABLE customer_registration (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    customer_contact VARCHAR(20) NULL,
    customer_address VARCHAR(255) NULL,
    loan_type VARCHAR(255) NULL,
    date DATE NULL,
    image_path VARCHAR(255) NULL
);


--
-- Dumping data for table `schedule`
--

INSERT INTO `schedule` (`install_no`, `customer_id`, `customer_name `, `Time`, `status`) VALUES
(1, 1, 'Nishad', '2020-05-09', 'paid'),


-- --------------------------------------------------------

--
-- Table structure for table `type`
--

CREATE TABLE `scheme` (
  `type_id` int(11) NOT NULL,
  `name` varchar(20) NOT NULL,
  `amount` float NOT NULL,
  `r_asset` float NOT NULL,
  `no_installment` int(11) NOT NULL,
  `Install_amount` float NOT NULL,
  `duration` varchar(20) NOT NULL,
  `date` varchar(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `type`
--

INSERT INTO `type` (`type_id`, `name`, `amount`, `r_asset`, `no_installment`, `Install_amount`, `duration`, `date`) VALUES
(1, 'Home Loan', 300000, 10000, 12, 25000, 'month', '2022-04-19 '),
(2, 'Phone Loan', 20000, 5000, 6, 3333.33, 'week', '2022-04-19 ');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `father_name` varchar(200) NOT NULL,
  `likee` varchar(200) NOT NULL,
  `pass` varchar(255) NOT NULL,
  `time` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `father_name`, `likee`, `pass`, `time`) VALUES
(1, 'Juan Delacruz', 'admin@juan.com', 'Pedro Delacruz', 'Programming', 'admin123', '2022-04-19 03:21:50');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `customer`
--
ALTER TABLE `customer`
  ADD PRIMARY KEY (`customer_id`),
  ADD KEY `type` (`type_id`);

--
-- Indexes for table `installment`
--
ALTER TABLE `installment`
  ADD PRIMARY KEY (`install_id`);

--
-- Indexes for table `loan_info`
--
ALTER TABLE `loan_info`
  ADD KEY `type_id` (`type_id`),
  ADD KEY `customer_id` (`customer_id`),
  ADD KEY `customer_id_2` (`customer_id`);

--
-- Indexes for table `schedule`
--
ALTER TABLE `schedule`
  ADD KEY `customer_id` (`customer_id`);

--
-- Indexes for table `type`
--
ALTER TABLE `type`
  ADD PRIMARY KEY (`type_id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `customer`
--
ALTER TABLE `customer`
  MODIFY `customer_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `installment`
--
ALTER TABLE `installment`
  MODIFY `install_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `loan_info`
--
ALTER TABLE `loan_info`
  MODIFY `customer_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `type`
--
ALTER TABLE `type`
  MODIFY `type_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
