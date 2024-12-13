const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db_access = require('./db.js');
const db = db_access.db ;
const cookieParser = require('cookie-parser');
const server = express();
const port = 8080;
const secret_key = 'DdsdsdKKFDDFDdvfddvxvc4dsdvdsvdb';

server.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}));
server.use(express.json());
server.use(cookieParser());

const generateToken = (id, isAdmin) => {
    return jwt.sign({ id, isAdmin }, secret_key, { expiresIn: '1h' });
}

const verifyToken = (req, res, next) => {
    const token = req.cookies.authToken;
    if (!token)
        return res.status(401).send('unauthorized');
    jwt.verify(token, secret_key, (err, details) => {
        if (err)
            return res.status(403).send('invalid or expired token');
        req.userDetails = details;
        next();
    });
};

// User Routes
//LOGIN
server.post('/user/login', (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    db.get(`SELECT * FROM USER WHERE EMAIL=?`, [email], (err, row) => {
        bcrypt.compare(password, row.PASSWORD, (err, isMatch) => {
            if (err) {
                return res.status(500).send('error comparing password');
            }
            if (!isMatch) {
                return res.status(401).send('invalid credentials');
            }
            let userID = row.ID;
            let isAdmin = row.ISADMIN;
            const token = generateToken(userID, isAdmin);

            res.cookie('authToken', token, {
                httpOnly: true,
                sameSite: 'none',
                secure: true,
                expiresIn: '1h'
            });
            return res.status(200).json({ id: userID, admin: isAdmin });
        });
    });
});


//REGISTER
server.post('/user/register', (req, res) => {
    const { name, email, password } = req.body;
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            return res.status(500).send('error hashing password');
        }
        db.run(`INSERT INTO USER (NAME, EMAIL, PASSWORD, ISADMIN) VALUES (?, ?, ?, ?)`, [name, email, hashedPassword, 0], (err) => {
            if (err) {
                return res.status(401).send(err);
            }
            return res.status(200).send('registration successful');
        });
    });
});

// Sandwich Routes
//ADD SANDWICH 
server.post('/sandwich/add', (req, res) => {
    // const isAdmin = req.userDetails.isAdmin;
    // if (isAdmin !== 1)
    //     return res.status(403).send('You are not an admin');
    const { name, description, price, quantity} = req.body;
    db.run(`INSERT INTO SANDWICH (NAME, DESCRIPTION, PRICE, QUANTITY, USER_ID) VALUES (?, ?, ?, ?, ?)`,
        [name, description, price, quantity, req.userDetails.id], (err) => {
            if (err) {
                console.log(err);
                return res.send(err);
            } else {
                return res.send('Sandwich added successfully');
            }
        });
});

//GET SANDWICH
server.get('/sandwich', (req, res) => {
    const query = `SELECT * FROM SANDWICH`;
    db.all(query, (err, rows) => {
        if (err) {
            console.log(err);
            return res.send(err);
        } else {
            return res.json(rows);
        }
    });
});

//GET SANDWICH BY NAME
server.get('/sandwich/search/', (req, res) => {
    const query = `SELECT * FROM SANDWICH WHERE NAME='${req.body.name}'`;
    db.get(query, (err, row) => {
        if (err) {
            console.log(err);
            return res.send(err);
        } else if (!row) {
            return res.send(`Sandwich with ID '${req.body.name}' not found`);
        } else {
            return res.send(row);
        }
    });
});

//EDIT BY ID --ADMIN
server.put('/sandwich/edit/:id', verifyToken, (req, res) => {
    const isAdmin = req.userDetails.isAdmin;
    if (isAdmin !== 1)
        return res.status(403).send('You are not an admin');
    const { name, description, price, quantity } = req.body;
    const query = `UPDATE SANDWICH SET NAME=?, DESCRIPTION=?, PRICE=?, QUANTITY=? WHERE ID=?`;
    db.run(query, [name, description, price, quantity, req.params.id], (err) => {
        if (err) {
            console.log(err);
            return res.send(err);
        } else {
            return res.send('Sandwich updated successfully');
        }
    });
});

//DELETE BY ID  -ADMIN
server.delete('/sandwich/:id', verifyToken, (req, res) => {
    const isAdmin = req.userDetails.isAdmin;
    if (isAdmin !== 1)
        return res.status(403).send('You are not an admin');
    const query = `DELETE FROM SANDWICH WHERE ID=?`;
    db.run(query, [req.params.id], (err) => {
        if (err) {
            console.log(err);
            return res.send(err);
        } else {
            return res.send('Sandwich deleted successfully');
        }
    });
});

// Cart Routes
//ADD TO CART
server.post('/cart/add', verifyToken, (req, res) => {
    const { sandwichId, quantity, price } = req.body;
    db.run(`INSERT INTO CART_ITEM (USER_ID, SANDWICH_ID, QUANTITY, PRICE) VALUES (?, ?, ?, ?)`,
        [req.userDetails.id, sandwichId, quantity, price], (err) => {
            if (err) {
                console.log(err);
                return res.send(err);
            } else {
                return res.send('Added to cart');
            }
        });
});

//REMOVE FROM CART
server.delete('/cart/remove/:id', verifyToken, (req, res) => {
    const query = `DELETE FROM CART_ITEM WHERE ID=? AND USER_ID=?`;
    db.run(query, [req.params.id, req.userDetails.id], (err) => {
        if (err) {
            console.log(err);
            return res.send(err);
        } else {
            return res.send('Removed from cart');
        }
    });
});

//GET IN THE CART
server.get('/cart', verifyToken, (req, res) => {
    const query = `SELECT * FROM CART_ITEM WHERE USER_ID=?`;
    db.all(query, [req.userDetails.id], (err, rows) => {
        if (err) {
            console.log(err);
            return res.send(err);
        } else {
            return res.json(rows);
        }
    });
});

// Order Routes
//MAKE ORDER
server.post('/order', (req, res) => {
    const { totalAmount, sandwichItems } = req.body;
    db.run(`INSERT INTO ORDER_ITEM (USER_ID, SANDWICH_ID, QUANTITY, PRICE) VALUES (?, ?, ?, ?)`,
        [req.userDetails.id, sandwichItems[0].sandwichId, sandwichItems[0].quantity, sandwichItems[0].price, totalAmount], (err) => {
            if (err) {
                console.log(err);
                return res.send(err);
            } else {
                return res.send('Order placed successfully');
            }
        });
});

//GET ORDERS
server.get('/orders', verifyToken, (req, res) => {
    const query = `SELECT * FROM ORDER_ITEM WHERE USER_ID=?`;
    db.all(query, [req.userDetails.id], (err, rows) => {
        if (err) {
            console.log(err);
            return res.send(err);
        } else {
            return res.json(rows);
        }
    });
});

// Feedback Routes
server.post('/feedback', (req, res) => {
    const { orderItemId, comment} = req.body;
    db.run(`INSERT INTO FEEDBACK (USER_ID, ORDER_ITEM_ID, COMMENT) VALUES (?, ?, ?)`,
        [req.userDetails.id, orderItemId, comment,], (err) => {
            if (err) {
                console.log(err);
                return res.send(err);
            } else {
                return res.send('Feedback submitted successfully');
            }
        });
});

server.get('/feedback/:sandwichId', (req, res) => {
    const query = `SELECT * FROM FEEDBACK WHERE SANDWICH_ID=?`;
    db.all(query, [req.params.sandwichId], (err, rows) => {
        if (err) {
            console.log(err);
            return res.send(err);
        } else {
            return res.json(rows);
        }
    });
});
server.post('/sandwich/:sandwichId/ingredient', verifyToken, (req, res) => {
    const { ingredientId, quantity } = req.body;
    const sandwichId = req.params.sandwichId;

    if (!ingredientId || !quantity) {
        return res.status(400).send('Ingredient ID and quantity are required');
    }

    // Check if the sandwich exists
    db.get(`SELECT * FROM SANDWICH WHERE ID=?`, [sandwichId], (err, row) => {
        if (err || !row) {
            return res.status(404).send('Sandwich not found');
        }

        // Check if the ingredient exists
        db.get(`SELECT * FROM INGREDIENT WHERE ID=?`, [ingredientId], (err, row) => {
            if (err || !row) {
                return res.status(404).send('Ingredient not found');
            }

            // Insert the ingredient into the sandwich
            db.run(`INSERT INTO SANDWICH_INGREDIENTS (SANDWICH_ID, INGREDIENT_ID, QUANTITY) VALUES (?, ?, ?)`,
                [sandwichId, ingredientId, quantity], (err) => {
                    if (err) {
                        console.log(err);
                        return res.status(500).send('Error adding ingredient');
                    } else {
                        return res.send('Ingredient added successfully');
                    }
                });
        });
    });
});
server.get('/sandwich/:sandwichId/ingredients', verifyToken, (req, res) => {
    const sandwichId = req.params.sandwichId;

    // Get ingredients for the sandwich
    const query = `SELECT * FROM SANDWHICH WHERE SANDWICH_ID = ?`;
    db.all(query, [sandwichId], (err, rows) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Error retrieving ingredients');
        } else if (rows.length === 0) {
            return res.status(404).send('No ingredients found for this sandwich');
        } else {
            return res.json(rows);
        }
    });
});

// GET all ingredients
server.get('/ingredients', (req, res) => {
    const query = 'SELECT * FROM INGREDIENT';
    db.all(query, (err, rows) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Error retrieving ingredients');
        } else {
            return res.json(rows);
        }
    });
});
// PUT - Update ingredient stock
server.put('/ingredient/:id/stock', verifyToken, (req, res) => {
    const isAdmin = req.userDetails.isAdmin;
    if (isAdmin !== 1)
        return res.status(403).send('You are not an admin');
    const { stock } = req.body;
    const query = `UPDATE INGREDIENT SET STOCK=? WHERE ID=?`;

    db.run(query, [stock, req.params.id], (err) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Error updating ingredient stock');
        } else {
            return res.send('Ingredient stock updated successfully');
        }
    });
});

server.put('/sandwich/:sandwichId/ingredient/:ingredientId', verifyToken, (req, res) => {
    const { quantity } = req.body;
    const sandwichId = req.params.sandwichId;
    const ingredientId = req.params.ingredientId;

    if (!quantity) {
        return res.status(400).send('Quantity is required');
    }

    // Check if the sandwich and ingredient exist
    db.get(`SELECT * FROM SANDWICH_INGREDIENTS WHERE SANDWICH_ID=? AND INGREDIENT_ID=?`, 
        [sandwichId, ingredientId], (err, row) => {
            if (err || !row) {
                return res.status(404).send('Ingredient not found in this sandwich');
            }

            // Update the quantity
            db.run(`UPDATE SANDWICH_INGREDIENTS SET QUANTITY=? WHERE SANDWICH_ID=? AND INGREDIENT_ID=?`,
                [quantity, sandwichId, ingredientId], (err) => {
                    if (err) {
                        console.log(err);
                        return res.status(500).send('Error updating ingredient quantity');
                    } else {
                        return res.send('Ingredient quantity updated successfully');
                    }
                });
        });
});
server.delete('/sandwich/:sandwichId/ingredient/:ingredientId', verifyToken, (req, res) => {
    const sandwichId = req.params.sandwichId;
    const ingredientId = req.params.ingredientId;

    // Remove the ingredient from the sandwich
    db.run(`DELETE FROM SANDWICH_INGREDIENTS WHERE SANDWICH_ID=? AND INGREDIENT_ID=?`,
        [sandwichId, ingredientId], (err) => {
            if (err) {
                console.log(err);
                return res.status(500).send('Error removing ingredient');
            } else {
                return res.send('Ingredient removed from sandwich');
            }
        });
});
server.get('/sandwich/ingredients', verifyToken, (req, res) => {
    const query = `
        SELECT s.ID AS SandwichID, s.NAME AS SandwichName, i.ID AS IngredientID, i.NAME AS IngredientName, si.QUANTITY
        FROM SANDWICH s
        JOIN SANDWICH_INGREDIENTS si ON si.SANDWICH_ID = s.ID
        JOIN INGREDIENT i ON si.INGREDIENT_ID = i.ID
    `;
    db.all(query, (err, rows) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Error retrieving sandwiches with ingredients');
        } else {
            return res.json(rows);
        }
    });
});
// DELETE - Remove ingredient
server.delete('/ingredient/:id', verifyToken, (req, res) => {
    const isAdmin = req.userDetails.isAdmin;
    if (isAdmin !== 1)
        return res.status(403).send('You are not an admin');
    const query = `DELETE FROM INGREDIENT WHERE ID=?`;
    db.run(query, [req.params.id], (err) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Error removing ingredient');
        } else {
            return res.send('Ingredient removed successfully');
        }
    });
});
// GET sandwich stock (Admin only)
server.get('/sandwich/stock', verifyToken, (req, res) => {
    const isAdmin = req.userDetails.isAdmin;
    if (isAdmin !== 1) return res.status(403).send('You are not authorized to view stock');

    const query = 'SELECT NAME, QUANTITY FROM SANDWICH';
    db.all(query, (err, rows) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Error retrieving sandwich stock');
        } else {
            return res.json(rows);
        }
    });
});

// Start Server
server.listen(port, () => {
    console.log(`Server started at port ${port}`);
    // Execute table creation      
});
