import mongoose from 'mongoose';

// Define the schema based on your project requirements [cite: 51, 52]
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true }, // [cite: 61, 62]
    email: { type: String, required: true, unique: true },    // [cite: 77, 78]
    password: { type: String, required: true }                // [cite: 70, 71]
});

// Create the Model [cite: 52]
export const User = mongoose.model('User', userSchema);