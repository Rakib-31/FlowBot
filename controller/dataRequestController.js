const DataModel = require('../model/data');

module.exports = {

    getData(req, res){
        res.render('index');
    },

    getBotList(req, res){
        res.render('botlist');
    },

    postData(req,res){
        console.log(req.query);
        console.log(req.body);
        DataModel.findOneAndUpdate(req.query, req.body, { upsert: true }, (err) => {
            if(err){
                console.log(err);
                res.send(err);
            }
            else{
                console.log('success');
                res.send({message: 'success'});
            }
        });
    },
}