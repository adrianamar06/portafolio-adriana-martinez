const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    shootDate: { type: Date, required: true },
    packageSelected: { type: String, required: true },
    status: { type: String, default: 'Pending' },
    // New optimized media storage array
    optimizedPhotos: [{ type: String }] 
});

module.exports = mongoose.model('Booking', bookingSchema);