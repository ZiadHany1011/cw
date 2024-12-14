const express = require('express')
const cors = require('cors');
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt');
const db_access = require('./db.js')
const db = db_access.db
const cookieParser = require('cookie-parser');
const server = express()
const port = 8080
const secret_key = 'DdsdsdKKFDDFDdvfddvxvc4dsdvdsvdb'
server.use(cors({
    origin:"http://localhost:3000",
    credentials:true
}))
server.use(express.json())
server.use(cookieParser())
const generateToken = (id, isAdmin) => {
    return jwt.sign({ id, isAdmin }, secret_key, { expiresIn: '1h' })
}
const verifyToken = (req, res, next) => {
    const token = req.cookies.authToken
    if (!token)
        return res.status(401).send('unauthorized')
    jwt.verify(token, secret_key, (err, details) => {
        if (err)
            return res.status(403).send('invalid or expired token')
        req.userDetails = details

        next()
    })
}

// User Routes
// LOGIN
server.post('/user/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).send('Email and password are required');

    db.get(`SELECT * FROM USER WHERE EMAIL=?`, [email], (err, row) => {
        if (err || !row) return res.status(401).send('Invalid credentials');
        
        bcrypt.compare(password, row.PASSWORD, (err, isMatch) => {
            if (err || !isMatch) return res.status(401).send('Invalid credentials');
            
            const token = generateToken(row.ID, row.ISADMIN);
            res.cookie('authToken', token, {
                httpOnly: true,
                sameSite: 'none',
                secure: true
            });
            return res.status(200).json({ id: row.ID, admin: row.ISADMIN });
        });
    });
});

// REGISTER
server.post('/user/register', (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).send('All fields are required');

    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) return res.status(500).send('Error hashing password');
        
        db.run(`INSERT INTO USER (NAME, EMAIL, PASSWORD, ISADMIN) VALUES (?, ?, ?, ?)`,
            [name, email, hashedPassword, 0], (err) => {
                if (err) return res.status(500).send('Error registering user');
                return res.status(200).send('Registration successful');
            });
    });
});

// Search Sandwiches (For Customers)
server.get('/sandwiches/search', (req, res) => {
    const { query } = req.query; // Assuming the query parameter contains the search term
    db.all('SELECT * FROM SANDWICH WHERE NAME LIKE ? OR DESCRIPTION LIKE ?', [`%${query}%`, `%${query}%`], (err, rows) => {
        if (err) return res.status(500).send('Error searching sandwiches');
        return res.json(rows);
    });
});


// Add Sandwich to Cart (For Customers)
server.post('/cart/add', verifyToken, (req, res) => {
    const userId = req.userDetails.id;
    const { sandwich_id, quantity } = req.body;

    db.get('SELECT * FROM CART_ITEM WHERE USER_ID = ? AND SANDWICH_ID = ?', [userId, sandwich_id], (err, row) => {
        if (err) return res.status(500).send('Error checking cart');
        if (row) {
            db.run('UPDATE CART_ITEM SET QUANTITY = QUANTITY + ? WHERE USER_ID = ? AND SANDWICH_ID = ?', [quantity, userId, sandwich_id], (err) => {
                if (err) return res.status(500).send('Error updating cart');
                return res.status(200).send('Cart updated');
            });
        } else {
            db.run('INSERT INTO CART_ITEM (USER_ID, SANDWICH_ID, QUANTITY) VALUES (?, ?, ?)', [userId, sandwich_id, quantity], (err) => {
                if (err) return res.status(500).send('Error adding to cart');
                return res.status(200).send('Added to cart');
            });
        }
    });
});

// View Cart (For Customers)
server.get('/cart', verifyToken, (req, res) => {
    const userId = req.userDetails.id;
    db.all('SELECT SANDWICH.NAME, SANDWICH.PRICE, CART_ITEM.QUANTITY FROM CART_ITEM JOIN SANDWICH ON CART_ITEM.SANDWICH_ID = SANDWICH.ID WHERE CART_ITEM.USER_ID = ?', [userId], (err, rows) => {
        if (err) return res.status(500).send('Error fetching cart');
        return res.json(rows);
    });
});

// Clear Cart (For Customers)
server.delete('/cart/clear', verifyToken, (req, res) => {
    const userId = req.userDetails.id;
    db.run('DELETE FROM CART_ITEM WHERE USER_ID = ?', [userId], (err) => {
        if (err) return res.status(500).send('Error clearing cart');
        return res.status(200).send('Cart cleared');
    });
});

// Update Cart Item Quantity (For Customers)
server.put('/cart/update/:id', verifyToken, (req, res) => {
    const { quantity } = req.body;
    const cartItemId = req.params.id;
    const userId = req.userDetails.id;

    db.run('UPDATE CART_ITEM SET QUANTITY = ? WHERE ID = ? AND USER_ID = ?', [quantity, cartItemId, userId], (err) => {
        if (err) return res.status(500).send('Error updating cart item');
        return res.status(200).send('Cart item updated');
    });
});


// Submit Feedback (For Customers)
server.post('/feedback', verifyToken, (req, res) => {
    const { sandwich_id, comment } = req.body;
    const userId = req.userDetails.id;

    db.run('INSERT INTO FEEDBACK (USER_ID, SANDWICH_ID, COMMENT) VALUES (?, ?, ?)', [userId, sandwich_id, comment], (err) => {
        if (err) return res.status(500).send('Error submitting feedback');
        return res.status(200).send('Feedback submitted');
    });
});


// Admin Routes

// Add Sandwich (For Admin)
server.post('/admin/sandwich', verifyToken, (req, res) => {
    const isAdmin = req.userDetails.isAdmin;
    if (isAdmin !== 1) return res.status(403).send('Not an admin');

    const { name, description, price, quantity } = req.body;
    const userId = req.userDetails.id; // Assuming the admin who adds the sandwich is the user

    db.run('INSERT INTO SANDWICH (NAME, DESCRIPTION, PRICE, QUANTITY, USER_ID) VALUES (?, ?, ?, ?, ?)', [name, description, price, quantity, userId], (err) => {
        if (err) return res.status(500).send('Error adding sandwich');
        return res.status(200).send('Sandwich added');
    });
});

// Admin Delete Sandwich (For Admin)
server.delete('/admin/sandwich/:id', verifyToken, (req, res) => {
    const isAdmin = req.userDetails.isAdmin;
    if (isAdmin !== 1) return res.status(403).send('Not an admin');

    const sandwichId = req.params.id;

    // First, ensure the sandwich exists
    db.get('SELECT * FROM SANDWICH WHERE ID = ?', [sandwichId], (err, row) => {
        if (err) return res.status(500).send('Error fetching sandwich');
        if (!row) return res.status(404).send('Sandwich not found');

        // Delete the sandwich
        db.run('DELETE FROM SANDWICH WHERE ID = ?', [sandwichId], (err) => {
            if (err) return res.status(500).send('Error deleting sandwich');
            return res.status(200).send('Sandwich deleted');
        });
    });
});

// Admin Update Sandwich (For Admin)
server.put('/admin/sandwich/:id', verifyToken, (req, res) => {
    const isAdmin = req.userDetails.isAdmin;
    if (isAdmin !== 1) return res.status(403).send('Not an admin');

    const sandwichId = req.params.id;
    const { name, description, price, quantity } = req.body;

    // First, ensure the sandwich exists
    db.get('SELECT * FROM SANDWICH WHERE ID = ?', [sandwichId], (err, row) => {
        if (err) return res.status(500).send('Error fetching sandwich');
        if (!row) return res.status(404).send('Sandwich not found');

        // Update the sandwich details
        db.run('UPDATE SANDWICH SET NAME = ?, DESCRIPTION = ?, PRICE = ?, QUANTITY = ? WHERE ID = ?', [name, description, price, quantity, sandwichId], (err) => {
            if (err) return res.status(500).send('Error updating sandwich');
            return res.status(200).send('Sandwich updated');
        });
    });
});

// Manage Sandwich Stock (For Admin)
server.put('/admin/sandwich/:id/stock', verifyToken, (req, res) => {
    const isAdmin = req.userDetails.isAdmin;
    if (isAdmin !== 1) return res.status(403).send('Not an admin');

    const sandwichId = req.params.id;
    const { quantity } = req.body;

    db.run('UPDATE SANDWICH SET QUANTITY = QUANTITY + ? WHERE ID = ?', [quantity, sandwichId], (err) => {
        if (err) return res.status(500).send('Error updating sandwich stock');
        return res.status(200).send('Sandwich stock updated');
    });
});

// Manage Feedback (For Admin)
server.get('/admin/feedback', verifyToken, (req, res) => {
    const isAdmin = req.userDetails.isAdmin;
    if (isAdmin !== 1) return res.status(403).send('Not an admin');

    db.all('SELECT * FROM FEEDBACK', (err, rows) => {
        if (err) return res.status(500).send('Error fetching feedback');
        return res.json(rows);
    });
});

// Delete Feedback (For Admin)
server.delete('/admin/feedback/:id', verifyToken, (req, res) => {
    const isAdmin = req.userDetails.isAdmin;
    if (isAdmin !== 1) return res.status(403).send('Not an admin');

    const feedbackId = req.params.id;

    db.run('DELETE FROM FEEDBACK WHERE ID = ?', [feedbackId], (err) => {
        if (err) return res.status(500).send('Error deleting feedback');
        return res.status(200).send('Feedback deleted');
    });
});

// Get Orders (For Admin)
server.get('/admin/orders', verifyToken, (req, res) => {
    const isAdmin = req.userDetails.isAdmin;
    if (isAdmin !== 1) return res.status(403).send('Not an admin');

    db.all('SELECT * FROM ORDER', (err, rows) => {
        if (err) return res.status(500).send('Error fetching orders');
        return res.json(rows);
    });
});


// Get All Users (For Admin)
server.get('/admin/users', verifyToken, (req, res) => {
    const isAdmin = req.userDetails.isAdmin;
    if (isAdmin !== 1) return res.status(403).send('Not an admin');

    db.all('SELECT ID, NAME, EMAIL, ISADMIN FROM USER', (err, rows) => {
        if (err) return res.status(500).send('Error fetching users');
        return res.json(rows);
    });
});

server.listen(port, () => {
    console.log(`Server started on port ${port}`);
    db.serialize(() => {
        db.run(db_access.createUserTable, (err) => {
            if (err) console.log("Error creating user table", err);
        });
        db.run(db_access.createSandwichTable, (err) => {
            if (err) console.log("Error creating sandwich table", err);
        });
        db.run(db_access.createCartItemTable, (err) => {
            if (err) console.log("Error creating cart table", err);
        });
        db.run(db_access.createFeedbackTable, (err) => {
            if (err) console.log("Error creating feedback table", err);
        });
    });
});


