const DataModel = require('../model/data');
var db = require("../model/database");
module.exports = {

    getPage(req, res){
        res.render('chatbot');
    },

    getData(req, res){
        //console.log(req.query);
        var sql = "select * from data_flow"
        var params = [req.query.id];
        db.all(sql, req.query, (err, row) => {
            if (err) {
                //console.log('error');
            res.status(400).json({"error":err.message});
            return;
            }
            res.status(200).json({
                "message":"success",
                "data":row
            });
            //console.log(row);
            //console.log('success');
        });
    },

    getSingelData(req, res){
        console.log(req.params);
        var sql = "select * from data_flow where VA_Name = ?"
        var params = [req.params.VA_Name];
        db.all(sql, params, (err, row) => {
            if (err) {
                console.log('error');
            res.status(400).json({"error":err.message});
            return;
            }
            res.status(200).json({
                "message":"success",
                "data":row
            });
            console.log(row);
            console.log('success');
        });
    },

    postData(req,res){

    },
}