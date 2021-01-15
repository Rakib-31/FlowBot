const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const dataSchema = new Schema({
    tenant: {
        type: String,
        required: false
    },
    VA_Name: {
        type: String,
        required: false
    },
    VA_Id: {
        type: Number,
        required: false
    },
    nodes: []
});

const Data = mongoose.model('Data', dataSchema);
module.exports = Data;