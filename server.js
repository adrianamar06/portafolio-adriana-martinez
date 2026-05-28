require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 5000;

// Import Database Models
const Booking = require('./models/booking');
const User = require('./models/user');

// Middleware Configs
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '/')));

// --- INITIALIZE SECURE SESSION TRACKING ---
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        maxAge: 1000 * 60 * 60 * 2, // Session stays alive for 2 hours
        secure: false // Set to true later when we deploy with HTTPS/SSL on Render
    }
}));

// --- CLOUD DATABASE CONNECTION & ADMIN AUTO-PROVISIONING ---
mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('🍃 Connected flawlessly to MongoDB Cloud Matrix!');
        
        // Auto-provision your master admin account securely if it doesn't exist yet
        const adminExists = await User.findOne({ username: 'adrianamartinez' });
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('anona12345', 12);
            const defaultAdmin = new User({
                username: 'adrianamartinez',
                password: hashedPassword
            });
            await defaultAdmin.save();
            console.log('👤 Secure master admin account [adrianamartinez] auto-provisioned!');
        }
    })
    .catch(err => console.error('❌ Database connection error:', err));

// --- GATED BACKEND SECURITY MIDDLEWARE ---
// Intercepts requests and verifies if the browser has an active admin session cookie
const requireAdmin = (req, res, next) => {
    if (req.session && req.session.isAdmin) {
        next(); // Authorization granted! Proceed to the endpoint logic
    } else {
        res.status(401).json({ success: false, message: "Unauthorized access denied." });
    }
};

// --- AUTHENTICATION API ROUTES ---

// Process login credentials
app.post('/api/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid username or password." });
        }

        // Compare the submitted password with the securely encrypted database hash
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Invalid username or password." });
        }

        // Mark the user session token as an authenticated Admin status state
        req.session.isAdmin = true;
        req.session.username = user.username;

        res.json({ success: true, message: "Login successful!" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server login processing error." });
    }
});

// Process logout clearing
app.post('/api/admin/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).json({ success: false, message: "Logout failed." });
        res.clearCookie('connect.sid');
        res.json({ success: true, message: "Logged out completely." });
    });
});

// Verifies session status on page reloads
app.get('/api/admin/check-session', (req, res) => {
    if (req.session && req.session.isAdmin) {
        res.json({ loggedIn: true });
    } else {
        res.json({ loggedIn: false });
    }
});

// --- CORE BOOKING LOGIC API ENDPOINTS ---

// Public endpoint: Save an incoming client booking request
app.post('/api/book', async (req, res) => {
    try {
        const { name, email, duration, type, ideas } = req.body;
        const newBooking = new Booking({ name, email, duration, type, ideas });
        await newBooking.save();
        res.status(201).json({ success: true, message: "Booking request saved perfectly!" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error, please try again." });
    }
});

// Gated Dashboard endpoint: Retrieve all client bookings (Requires active admin cookie session)
app.get('/api/admin/bookings', requireAdmin, async (req, res) => {
    try {
        const bookings = await Booking.find().sort({ createdAt: -1 });
        res.json({ success: true, bookings });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch bookings." });
    }
});

// Gated Dashboard endpoint: Update booking workflow status (Requires active admin cookie session)
app.patch('/api/admin/bookings/:id', requireAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        const updatedBooking = await Booking.findByIdAndUpdate(req.params.id, { status }, { new: true });
        res.json({ success: true, booking: updatedBooking });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to update booking status." });
    }
});

// Start the secure full-stack architecture engine
app.listen(PORT, () => {
    console.log(`Secure full-stack engine running at http://localhost:${PORT}`);
});