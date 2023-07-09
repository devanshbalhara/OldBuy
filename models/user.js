const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');


const UserSchema = new schema({
    email: {
        type: String,
        required: [true, 'Email Should be provided'],
        unique: true,
        match: [/^([a-zA-Z0-9_\-\.]+)@dtu\.ac\.in$/, 'Please fill a valid email address']
    }
});
UserSchema.plugin(uniqueValidator);
UserSchema.plugin(uniqueValidator, { message: 'Error, expected {PATH} to be unique.' });
UserSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model('User', UserSchema);
