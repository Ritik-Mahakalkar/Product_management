const express = require("express");
const mysql = require("mysql2");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());
app.use("/uploads", express.static("uploads"));


const db = mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "",
    database: process.env.DB_NAME || "product_db"
});

db.connect(err => {
    if (err) throw err;
    console.log("MySQL Connected...");
});

// Multer Setup for Image Upload
const storage = multer.diskStorage({
    destination: "./uploads/",
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });


app.post("/products", upload.single("image"), (req, res) => {
    const { name, description, price, category, stock } = req.body;
    const image = req.file ? req.file.filename : null;

    const sql = "INSERT INTO products (name, description, price, category, stock, image) VALUES (?, ?, ?, ?, ?, ?)";
    db.query(sql, [name, description, price, category, stock, image], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: "Product added", productId: result.insertId });
    });
});


app.get("/products", (req, res) => {
    db.query("SELECT * FROM products", (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});


app.put("/products/:id", upload.single("image"), (req, res) => {
    const { name, description, price, category, stock } = req.body;
    const image = req.file ? req.file.filename : null;
    const { id } = req.params;

    let sql = "UPDATE products SET name=?, description=?, price=?, category=?, stock=?";
    let values = [name, description, price, category, stock];

    if (image) {
        sql += ", image=?";
        values.push(image);
    }
    sql += " WHERE id=?";
    values.push(id);

    db.query(sql, values, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Product updated" });
    });
});


app.delete("/products/:id", (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM products WHERE id=?", [id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Product deleted" });
    });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
