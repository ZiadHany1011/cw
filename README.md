README for Sandwich Ordering System
Overview
This project is a Sandwich Ordering System, built using a Node.js server for the backend and React for the frontend. It allows customers to browse and order sandwiches, manage their cart, and provide feedback. Admins can manage sandwiches, view feedback, and oversee orders. The backend uses SQLite for database storage.

Features
For Customers:
User Registration & Login: Secure authentication using JWT and password hashing with bcrypt.
Browse Sandwiches: View all available sandwiches or search by name/description.
Cart Management: Add, update, view, or clear items in the cart.
Order Placement: Place an order for all items in the cart.
Feedback Submission: Provide feedback on sandwiches.
Order History: View past orders.
For Admins:
Sandwich Management: Add, update, delete sandwiches, or manage stock levels.
View Feedback: Access all customer feedback.
User Management: View all registered users.
Order Management: Access and review all customer orders.

Technologies Used
Backend:
Node.js with Express: For creating the RESTful API.
SQLite: Lightweight database for storing user, sandwich, cart, feedback, and order information.
bcrypt: For secure password hashing.
JWT: For secure token-based authentication.
cors: To enable cross-origin requests.
cookie-parser: To handle cookies for authentication.
Frontend:
React.js: For creating a responsive and dynamic user interface.

Installation and Setup
Prerequisites:
Node.js and npm installed on your machine.
A modern web browser to run the frontend.
Backend Setup:
Clone the repository:
bash
Copy code
git clone https://github.com/<your-username>/<your-repo-name>.git
cd <your-repo-name>


Install dependencies:
bash
Copy code
npm install


Run the server:
bash
Copy code
node server.js
The server will start on port 8080.
Frontend Setup:
Navigate to the frontend directory (if separate) and install dependencies:
bash
Copy code
cd frontend
npm install


Start the React development server:
bash
Copy code
npm start
The frontend will run on port 3000 by default.

API Endpoints
Authentication
POST /user/register: Register a new user.
POST /user/login: Login an existing user.
Sandwiches
GET /sandwiches: Fetch all sandwiches.
GET /sandwiches/search?query=...: Search for sandwiches by name/description.
Cart
POST /cart/add: Add a sandwich to the cart.
GET /cart: View all items in the cart.
PUT /cart/update/:id: Update the quantity of a specific cart item.
DELETE /cart/clear: Clear the cart.
Orders
POST /order/place: Place an order for all cart items.
GET /orders: View past orders.
Feedback
POST /feedback: Submit feedback for a sandwich.
Admin
POST /admin/sandwich: Add a new sandwich.
PUT /admin/sandwich/:id: Update sandwich details.
DELETE /admin/sandwich/:id: Delete a sandwich.
GET /admin/feedback: View all feedback.
DELETE /admin/feedback/:id: Delete feedback.
GET /admin/orders: View all orders.
GET /admin/users: View all users.

Database Schema
Tables
USER
ID, NAME, EMAIL, PASSWORD, ISADMIN
SANDWICH
ID, NAME, DESCRIPTION, PRICE, QUANTITY
CART_ITEM
ID, USER_ID, SANDWICH_ID, QUANTITY
ORDER_ITEM
ID, USER_ID, SANDWICH_ID, QUANTITY, PRICE
FEEDBACK
ID, USER_ID, SANDWICH_ID, COMMENT

Environment Variables
Set the following variables in your .env file:
PORT: The port the server should run on (default: 8080).
SECRET_KEY: Secret key for JWT authentication.

Contributing
Contributions are welcome! If you'd like to contribute:
Fork the repository.
Create a feature branch: git checkout -b feature-name.
Commit your changes: git commit -m 'Add feature'.
Push to the branch: git push origin feature-name.
Submit a pull request.

