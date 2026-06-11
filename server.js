const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');
const User = require('./models/user');
const Booking = require('./models/booking');

const app = express();

// Middleware infrastructure configurations
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'usf_bulls_cyber_security_key_2026',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 1 day session lifecycle
}));

process.env.MONGO_URI

mongoose.connect(MONGO_URI)
    .then(() => console.log("Database tunnel connected successfully."))
    .catch(err => console.error("Database connection failure:", err));

// 1. TEMPORARY BACKDOOR ROOT GENERATOR (Solves credential mismatches instantly)
app.get('/api/admin/setup-root', async (req, res) => {
    try {
        await User.deleteMany({ username: "adrianamartinez" });
        const hashedPassword = await bcrypt.hash("anona12345", 10);
        
        const masterAdmin = new User({
            username: "adrianamartinez",
            password: hashedPassword
        });
        
        await masterAdmin.save();
        res.send("SUCCESS: Master admin created flawlessly. You can close this tab and log in now!");
    } catch (err) {
        res.status(500).send("Setup error: " + err.message);
    }
});

// 2. SECURITY AUTHENTICATION PROCESSOR
app.post('/api/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username: username.trim() });
        
        if (!user) {
            return res.status(401).json({ error: "Invalid username parameters." });
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid password encryption verification match." });
        }
        
        req.session.isAdmin = true;
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Server processing bottleneck encountered." });
    }
});

// 3. SESSION STATUS GATEKEEPER
app.get('/api/admin/check-session', (req, res) => {
    res.json({ loggedIn: !!req.session.isAdmin });
});

// 4. LOGOUT MANAGEMENT
app.post('/api/admin/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// 5. FETCH BOOKINGS METRICS
app.get('/api/admin/bookings', async (req, res) => {
    if (!req.session.isAdmin) return res.status(401).json({ error: "Unauthorized access." });
    try {
        const bookings = await Booking.find().sort({ _id: -1 });
        res.json({ success: true, bookings });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 6. PHOTO ASSET OPTIMIZATION HOOK ROUTE
app.post('/api/bookings/:id/photos', async (req, res) => {
    if (!req.session.isAdmin) return res.status(401).json({ error: "Unauthorized access." });
    try {
        const { photoUrl } = req.body;
        const updatedBooking = await Booking.findByIdAndUpdate(
            req.params.id,
            { $push: { optimizedPhotos: photoUrl } },
            { new: true }
        );
        res.json({ success: true, updatedBooking });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Catch-all route to serve the visual application entry point
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server executing live on channel ${PORT}`));