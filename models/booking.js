const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    duration: { type: String, required: true }, // "1-hour" or "2-hour"
    type: { type: String, required: true },     // "solo" or "group"
    ideas: { type: String, default: "" },
    status: { type: String, enum: ['Pending', 'Approved', 'Archived'], default: 'Pending' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', BookingSchema);