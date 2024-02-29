# Loan Management System

This web application is built using the Node.js Express framework with a SQL database for efficient data management. The frontend is designed with HTML, CSS, and Bootstrap to ensure a user-friendly interface.

## Features

### Loan Management

- **Admin Functionality:**
  - Register customers by providing their name, address, contact details, image, and information about the asset they want a loan for.
  - Add different Loan Types to the system.
  - View and manage customer information and loan details.
  - Edit or delete customer and loan information.
  - Search for customer ID and view their transaction history.

- **Customer Interaction:**
  - Customers provide necessary details, including their asset information and its value.
  - The system assesses the asset's value to determine loan eligibility.
  - Upon approval, the system generates installment dates and creates a PDF for the customer.
  - Customers are required to pay installments on time; delays result in fines, with a 2% penalty for late payments.

## Usage

To run this software on your local machine, follow these steps:

1. Clone or download this repository.

2. Take the database from the "database" folder and import it into your database system, ensuring the database name matches the one specified in the file.

3. Ensure Node.js is installed on your machine.

4. Open the application in your preferred code editor (e.g., Visual Studio Code).

5. Run the following command in the terminal:
   ```
   npm install
   ```

   This will install all the necessary dependencies.

6. Run the server using the following command:
   ```
   node server.js
   ```

   Access the application in your browser at http://localhost:3000 to see the results.

## Contributions

Feel free to contribute to the development of this project by submitting pull requests or reporting issues.

**Note:** Make sure to adhere to best practices and coding standards when contributing.

Thank you for using our Loan Management System!