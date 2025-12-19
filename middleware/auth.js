const jwt = require('jsonwebtoken');

// Simulasi user database
const users = [
    { _id: 1, username: 'admin', email: 'admin@test.com', password: 'admin123', role: 'admin' },
    { _id: 2, username: 'member1', email: 'member1@test.com', password: 'member123', role: 'member' },
];

const authenticate = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            req.user = null;
            return next();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'rahasia-sangat-aman-untuk-tugas-pbp');
        
        const user = users.find(u => u._id === decoded.userId);
        
        if (!user) {
            throw new Error();
        }

        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        req.user = null;
        next();
    }
};

module.exports = authenticate;