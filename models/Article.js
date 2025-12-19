// Mock Article model untuk testing tanpa MongoDB
let articles = [
    {
        _id: 1,
        title: 'Artikel Public Pertama',
        content: 'Ini adalah artikel yang bisa dibaca semua orang tanpa login.',
        createdBy: null,
        status: 'published',
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        _id: 2,
        title: 'Artikel dari Member',
        content: 'Artikel ini dibuat oleh member setelah login.',
        createdBy: 2,
        status: 'published',
        createdAt: new Date(),
        updatedAt: new Date()
    }
];

let currentId = 3;

class Article {
    static find(condition = {}) {
        let result = [...articles];
        
        if (condition.status) {
            result = result.filter(a => a.status === condition.status);
        }
        
        return {
            populate: function() {
                return result.map(article => {
                    // Simulasi populate
                    return article;
                });
            },
            sort: function() {
                return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            }
        };
    }

    static findOne(condition) {
        let article = null;
        
        if (condition._id && condition.status) {
            article = articles.find(a => 
                a._id.toString() === condition._id.toString() && 
                a.status === condition.status
            );
        } else if (condition._id) {
            article = articles.find(a => a._id.toString() === condition._id.toString());
        }
        
        return article || null;
    }

    static findById(id) {
        return articles.find(a => a._id.toString() === id.toString()) || null;
    }

    static create(data) {
        const newArticle = {
            _id: currentId++,
            title: data.title,
            content: data.content,
            createdBy: data.createdBy,
            status: 'published',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        articles.push(newArticle);
        return newArticle;
    }

    save() {
        const index = articles.findIndex(a => a._id === this._id);
        if (index !== -1) {
            this.updatedAt = new Date();
            articles[index] = this;
        }
        return this;
    }

    deleteOne() {
        const index = articles.findIndex(a => a._id === this._id);
        if (index !== -1) {
            articles.splice(index, 1);
        }
        return this;
    }
}

module.exports = Article;