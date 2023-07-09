const mongoose = require('mongoose');
const schema = mongoose.Schema;

const BookSchema = new schema({
    name: {
        type: String,
        required: [true, 'Name is required']
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative']
    },
    edition: {
        type: Number,
        required: [true, 'Edition is required'],
        min: [1, 'Edition cannot be less than 1']
    },
    authors: {
        type: String,
        required: [true, 'Author is required']
    },
    publisher: {
        type: String,
        required: [true, 'Publisher is required']
    },
    category: {
        type: String,
        enum: ["computer", "mechanical", "electrical", "civil"],
        required: [true, 'Category is required']
    },
    image: {
        type: String,
        required: [true, 'Image is required']
    },
    owner: {
        type: schema.Types.ObjectId,
        ref: 'User',
    },
}, { timestamps: true });

module.exports = mongoose.model('OldBook', BookSchema);
