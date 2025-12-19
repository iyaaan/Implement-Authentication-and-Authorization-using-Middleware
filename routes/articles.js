const express = require('express');
const router = express.Router();
const Article = require('../models/Article.js');
const authenticate = require('../middleware/auth.js');
const authorize = require('../middleware/authorize.js');

// Public routes (no authentication required)
router.get('/', async (req, res) => {
    try {
        const articles = Article.find({ status: 'published' }).populate();
        res.json(articles);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const article = Article.findOne({ 
            _id: req.params.id, 
            status: 'published' 
        });
        
        if (!article) {
            return res.status(404).json({ error: 'Article not found' });
        }
        
        res.json(article);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// CREATE article - Requires authentication
router.post('/', authenticate, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required to create articles' });
        }

        const article = Article.create({
            title: req.body.title,
            content: req.body.content,
            createdBy: req.user._id
        });

        res.status(201).json(article);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// UPDATE article - Requires authentication + authorization
router.put('/:id', authenticate, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const article = Article.findById(req.params.id);
        
        if (!article) {
            return res.status(404).json({ error: 'Article not found' });
        }

        // Check authorization
        if (req.user.role !== 'admin' && article.createdBy !== req.user._id) {
            return res.status(403).json({ error: 'You can only edit your own articles' });
        }

        article.title = req.body.title || article.title;
        article.content = req.body.content || article.content;
        article.status = req.body.status || article.status;

        article.save();
        res.json(article);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// DELETE article - Requires authentication + authorization
router.delete('/:id', authenticate, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const article = Article.findById(req.params.id);
        
        if (!article) {
            return res.status(404).json({ error: 'Article not found' });
        }

        // Check authorization
        if (req.user.role !== 'admin' && article.createdBy !== req.user._id) {
            return res.status(403).json({ error: 'You can only delete your own articles' });
        }

        article.deleteOne();
        res.json({ message: 'Article deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin-only routes
router.get('/admin/all', authenticate, authorize(['admin']), async (req, res) => {
    try {
        // Simulasi semua artikel (termasuk draft)
        const allArticles = [
            {
                _id: 1,
                title: 'Artikel Public',
                content: 'Ini artikel public',
                createdBy: null,
                status: 'published',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                _id: 2,
                title: 'Artikel Member',
                content: 'Ini artikel member',
                createdBy: 2,
                status: 'published',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                _id: 3,
                title: 'Artikel Draft',
                content: 'Ini artikel draft',
                createdBy: 1,
                status: 'draft',
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];
        
        res.json(allArticles);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;