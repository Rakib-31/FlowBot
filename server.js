const express = require('express');
const app = express();
const bodyparser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const dataRoute = require('./routes/dataRoute');
const chatbotRoute = require('./routes/chatbotRout');
var db = require("./model/database");
require('dotenv').config()

const port = process.env.PORT || 4000;

app.use(bodyparser.urlencoded({extended: false}));
app.use(bodyparser.json());

app.use(cors());

app.use(express.static(__dirname + '/css'));
app.use(express.static(__dirname + '/js'));
app.use(express.static(__dirname + '/asset'));
app.use('/', dataRoute);
app.use('/chatbot', chatbotRoute);

app.set('view engine', 'ejs');

// mongoose.connect('mongodb+srv://Hasan:mongodb31_password@cluster0-n0s4m.mongodb.net/Flowbot?retryWrites=true&w=majority', {useNewUrlParser: true}, () => {
//     console.log('Database connected');
// });

app.listen(port, () => {
    console.log(`server started on port ${port}`);
});