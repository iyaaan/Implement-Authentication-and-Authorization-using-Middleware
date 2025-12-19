// app.js - SEMUA DALAM SATU FILE
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ===== SIMULASI DATABASE =====
let users = [
    {
        id: 1,
        username: 'admin',
        email: 'admin@test.com',
        password: bcrypt.hashSync('admin123', 10),
        role: 'admin',
        createdAt: new Date()
    },
    {
        id: 2,
        username: 'member1',
        email: 'member1@test.com',
        password: bcrypt.hashSync('member123', 10),
        role: 'member',
        createdAt: new Date()
    }
];

let articles = [
    {
        id: 1,
        title: 'Artikel Public Pertama',
        content: 'Ini adalah artikel yang bisa dibaca semua orang tanpa login.',
        createdBy: null,
        status: 'published',
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: 2,
        title: 'Artikel dari Member',
        content: 'Artikel ini dibuat oleh member setelah login.',
        createdBy: 2,
        status: 'published',
        createdAt: new Date(),
        updatedAt: new Date()
    }
];

let currentUserId = 3;
let currentArticleId = 3;

// ===== MIDDLEWARE =====
const authenticate = (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            req.user = null;
            return next();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'rahasia-tugas-pbp');
        const user = users.find(u => u.id === decoded.userId);
        
        if (!user) {
            throw new Error();
        }

        req.user = user;
        next();
    } catch (error) {
        req.user = null;
        next();
    }
};

// Apply middleware global
app.use(authenticate);

// ===== ROUTES =====

// 1. HOME PAGE - API Documentation
app.get('/', (req, res) => {
    res.json({
        message: '🎯 API Authentication & Authorization',
        description: 'Implementasi Middleware untuk Autentikasi dan Otorisasi',
        author: 'Mahasiswa Nusa Putra',
        matakuliah: 'Pemrograman Berbasis Platform - Semester 3',
        endpoints: {
            public: {
                'GET /': 'API Documentation',
                'GET /articles': 'Get all published articles',
                'GET /articles/:id': 'Get specific article',
                'POST /auth/register': 'Register new user',
                'POST /auth/login': 'Login user'
            },
            protected: {
                'POST /articles': 'Create new article (login required)',
                'PUT /articles/:id': 'Update article (owner or admin)',
                'DELETE /articles/:id': 'Delete article (owner or admin)',
                'GET /articles-admin': 'Get all articles (admin only)',
                'GET /profile': 'Get user profile (login required)'
            }
        },
        test_users: {
            admin: { email: 'admin@test.com', password: 'admin123' },
            member: { email: 'member1@test.com', password: 'member123' }
        }
    });
});

// 2. ARTICLES - PUBLIC (tanpa login)
// Get all articles
app.get('/articles', (req, res) => {
    const publishedArticles = articles.filter(article => article.status === 'published');
    res.json(publishedArticles);
});

// Get single article
app.get('/articles/:id', (req, res) => {
    const article = articles.find(a => 
        a.id.toString() === req.params.id && 
        a.status === 'published'
    );
    
    if (!article) {
        return res.status(404).json({ error: 'Article not found' });
    }
    
    res.json(article);
});

// 3. ARTICLES - PROTECTED (perlu login)
// Create article
app.post('/articles', (req, res) => {
    if (!req.user) {
        return res.status(401).json({ 
            error: 'Authentication required',
            message: 'Silakan login terlebih dahulu untuk membuat artikel'
        });
    }

    const newArticle = {
        id: currentArticleId++,
        title: req.body.title || 'Artikel Baru',
        content: req.body.content || 'Isi artikel...',
        createdBy: req.user.id,
        status: 'published',
        createdAt: new Date(),
        updatedAt: new Date()
    };
    
    articles.push(newArticle);
    
    res.status(201).json({
        message: 'Artikel berhasil dibuat!',
        article: newArticle,
        author: req.user.username
    });
});

// Update article
app.put('/articles/:id', (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const articleIndex = articles.findIndex(a => a.id.toString() === req.params.id);
    
    if (articleIndex === -1) {
        return res.status(404).json({ error: 'Article not found' });
    }

    const article = articles[articleIndex];

    // Authorization check
    if (req.user.role !== 'admin' && article.createdBy !== req.user.id) {
        return res.status(403).json({ 
            error: 'Forbidden',
            message: 'Anda hanya dapat mengedit artikel yang Anda buat sendiri'
        });
    }

    article.title = req.body.title || article.title;
    article.content = req.body.content || article.content;
    article.status = req.body.status || article.status;
    article.updatedAt = new Date();

    res.json({
        message: 'Artikel berhasil diperbarui!',
        article: article
    });
});

// Delete article
app.delete('/articles/:id', (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const articleIndex = articles.findIndex(a => a.id.toString() === req.params.id);
    
    if (articleIndex === -1) {
        return res.status(404).json({ error: 'Article not found' });
    }

    const article = articles[articleIndex];

    // Authorization check
    if (req.user.role !== 'admin' && article.createdBy !== req.user.id) {
        return res.status(403).json({ 
            error: 'Forbidden',
            message: 'Anda hanya dapat menghapus artikel yang Anda buat sendiri'
        });
    }

    articles.splice(articleIndex, 1);
    
    res.json({ 
        message: 'Artikel berhasil dihapus!',
        deletedArticleId: req.params.id
    });
});

// 4. ADMIN ONLY ROUTES
// Get all articles (admin only - termasuk draft)
app.get('/articles-admin', (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (req.user.role !== 'admin') {
        return res.status(403).json({ 
            error: 'Forbidden',
            message: 'Hanya admin yang dapat mengakses semua artikel'
        });
    }
    
    res.json({
        message: 'Semua artikel (termasuk draft)',
        total: articles.length,
        articles: articles
    });
});

// 5. AUTH ROUTES
// Register
app.post('/auth/register', async (req, res) => {
    try {
        const { username, email, password, role = 'member' } = req.body;
        
        // Validasi input
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Username, email, dan password diperlukan' });
        }
        
        // Check if user exists
        const existingUser = users.find(user => user.email === email || user.username === username);
        if (existingUser) {
            return res.status(400).json({ error: 'User sudah terdaftar' });
        }
        
        // Create new user
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
            id: currentUserId++,
            username,
            email,
            password: hashedPassword,
            role: role,
            createdAt: new Date()
        };
        
        users.push(newUser);
        
        // Generate token
        const token = jwt.sign(
            { userId: newUser.id, role: newUser.role },
            process.env.JWT_SECRET || 'rahasia-tugas-pbp',
            { expiresIn: '7d' }
        );
        
        res.status(201).json({
            message: 'Registrasi berhasil!',
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role
            },
            token: token
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Login
app.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email dan password diperlukan' });
        }
        
        // Find user
        const user = users.find(u => u.email === email);
        if (!user) {
            return res.status(401).json({ error: 'Email atau password salah' });
        }
        
        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Email atau password salah' });
        }
        
        // Generate token
        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET || 'rahasia-tugas-pbp',
            { expiresIn: '7d' }
        );
        
        res.json({
            message: 'Login berhasil!',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            },
            token: token
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// 6. USER PROFILE
app.get('/profile', (req, res) => {
    if (!req.user) {
        return res.status(401).json({ 
            error: 'Authentication required',
            message: 'Silakan login untuk melihat profil'
        });
    }
    
    res.json({
        message: 'Profil user',
        user: {
            id: req.user.id,
            username: req.user.username,
            email: req.user.email,
            role: req.user.role,
            createdAt: req.user.createdAt
        }
    });
});

// 7. TESTING ENDPOINT (untuk cek auth)
app.get('/test-auth', (req, res) => {
    res.json({
        isAuthenticated: !!req.user,
        user: req.user || 'No user logged in',
        headers: req.headers
    });
});

// ===== SERVER START =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log('🚀 SERVER BERHASIL DIMULAI!');
    console.log('='.repeat(50));
    console.log(`📡 Port: ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log('\n🎯 ENDPOINT YANG TERSEDIA:');
    console.log('   GET  /              - Dokumentasi API');
    console.log('   GET  /articles      - Semua artikel (PUBLIC)');
    console.log('   POST /auth/login    - Login user');
    console.log('   POST /articles      - Buat artikel (BUTUH LOGIN)');
    console.log('\n👤 USER TEST:');
    console.log('   Admin:  email=admin@test.com, password=admin123');
    console.log('   Member: email=member1@test.com, password=member123');
    console.log('\n🔧 CARA TESTING:');
    console.log('   1. Buka browser -> http://localhost:3000');
    console.log('   2. Login dulu -> POST /auth/login');
    console.log('   3. Gunakan token untuk akses protected routes');
    console.log('='.repeat(50));
});