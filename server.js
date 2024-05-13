const express = require('express');
const app = express();
const cors = require('cors');
const UserRouter = require('./routes/Main.js');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
require("dotenv").config()


const mongodbUrl = `mongodb+srv://nimisha:${process.env.MONGO_PASSWORD}@scopemongodb.aoydy1x.mongodb.net/?retryWrites=true&w=majority&appName=ScopeMongodb`;

const path = require('path');
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: false}));

app.use('/public', express.static(path.join(__dirname, 'uploads')))
app.use('/scope',UserRouter)
app.use(cookieParser());

mongoose.connect(mongodbUrl).then(()=>{
    app.listen(process.env.PORT,(err)=>{
        if(err) throw err
        console.log("Server is running on port " + process.env.PORT)
    })
}
    
).catch(err => {
console.log(err)
})