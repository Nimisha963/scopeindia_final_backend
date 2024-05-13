const mongoose = require('mongoose');


const UserSchema = mongoose.Schema({
    firstName :{
        type : String
    },
    lastName :{
        type : String
    },
    email : {
        type : String
    },
    password : {
        type : String
    },
    gender : {
        type : String,
        // enum : ['male', 'female']
    },
    dob : {
        type : Date
    },
    phone : {
        type : Number
    },
    country : {
        type : String
    },
    state : {
        type : String
    },
    city : {
        type : String
    },
    hobbies : {
        type: [mongoose.Schema.Types.Mixed]
    },
    courses:{
        type : Array
    },
    avatar : {
        type : String
    },
    isFirstTime :{
        type : String
    },
    token:{
        type : String
    }
})
module.exports = mongoose.model('scopeproject', UserSchema);