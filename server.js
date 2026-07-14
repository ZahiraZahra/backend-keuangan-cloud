const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// 🟢 KONEKSI KE DATABASE CLOUD ONLINE (AIVEN.IO)
const db = mysql.createConnection({
    host: 'mysql-882b89c-manuelsipriaganteng-07cc.j.aivencloud.com',
    port: 28706,
    user: 'avnadmin',
    password: 'AVNS_ze9xPgBNas0sDGWHTpf',
    database: 'defaultdb',
    ssl: {
        rejectUnauthorized: false // Wajib untuk koneksi cloud aman Aiven
    }
});

db.connect(err => {
    if (err) {
        console.log("❌ Gagal terhubung ke MySQL Cloud:", err.message);
    } else {
        console.log("✅ MySQL Cloud (Aiven) Berhasil Terhubung!");
        
        // 🟢 OTOMATIS MEMBUAT TABEL JIKA BELUM ADA DI CLOUD
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS transactions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                amount DECIMAL(12, 2) NOT NULL,
                type ENUM('income', 'expense') NOT NULL,
                category VARCHAR(100) NOT NULL,
                date DATE NOT NULL
            );
        `;
        db.query(createTableQuery, (err, result) => {
            if (err) console.log("❌ Gagal membuat tabel:", err.message);
            else console.log("✅ Tabel 'transactions' siap digunakan di Cloud!");
        });
    }
});

// API untuk mengambil data transaksi per bulan
app.get('/api/transactions/:year/:month', (req, res) => {
    const { year, month } = req.params;
    const query = "SELECT * FROM transactions WHERE YEAR(date) = ? AND MONTH(date) = ? ORDER BY date DESC";
    db.query(query, [year, month], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// API untuk menyimpan data transaksi baru dari HP
app.post('/api/transactions', (req, res) => {
    const { title, amount, type, category, date } = req.body;
    const query = "INSERT INTO transactions (title, amount, type, category, date) VALUES (?, ?, ?, ?, ?)";
    db.query(query, [title, amount, type, category, date], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Berhasil disimpan ke Cloud!", id: result.insertId });
    });
});

// API untuk menghapus transaksi
app.delete('/api/transactions/:id', (req, res) => {
    const { id } = req.params;
    const query = "DELETE FROM transactions WHERE id = ?";
    db.query(query, [id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Catatan berhasil dihapus dari Cloud!" });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server siap di port ${PORT}`);
});