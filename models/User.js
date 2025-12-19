const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

let users = [
    {
        _id: 1,
        username: 'admin',
        email: 'admin@test.com',
        password: bcrypt.hashSync('admin123', 10),
        role: 'admin',
        createdAt: new Date()
    },
    {
        _id: 2,
        username: 'member1',
        email: 'member1@test.com',
        password: bcrypt.hashSync('member123', 10),
        role: 'member',
        createdAt: new Date()
    }
];

let currentId = 3;

class User {
    static findOne(condition) {
        if (condition.email) {
            return users.find(u => u.email === condition.email) || null;
        }
        if (condition._id) {
            return users.find(u => u._id === condition._id) || null;
        }
        if (condition.username) {
            return users.find(u => u.username === condition.username) || null;
        }
        return null;
    }

    static findById(id) {
        return users.find(u => u._id.toString() === id.toString()) || null;
    }

    static create(data) {
        const hashedPassword = bcrypt.hashSync(data.password, 10);
        const newUser = {
            _id: currentId++,
            username: data.username,
            email: data.email,
            password: hashedPassword,
            role: data.role || 'member',
            createdAt: new Date()
        };
        users.push(newUser);
        return newUser;
    }

    comparePassword(candidatePassword) {
        return bcrypt.compareSync(candidatePassword, this.password);
    }

    generateAuthToken() {
        return jwt.sign(
            { userId: this._id, role: this.role },
            process.env.JWT_SECRET || 'rahasia-sangat-aman-untuk-tugas-pbp',
            { expiresIn: '7d' }
        );
    }
}

module.exports = User;