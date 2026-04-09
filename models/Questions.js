import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
    question: { type: String, required: true },
    options: { type: [String], required: true }, 
    correctAnswer: { type: String, required: true },
    subject: { type: String, required: true },
    topic: { type: String, required: true }
});

export const Question = mongoose.model('Question', questionSchema);