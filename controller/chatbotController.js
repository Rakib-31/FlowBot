const DataModel = require('../model/data');

module.exports = {

    getPage(req, res){
        res.render('chatbot');
    },

    getData(req, res){
        DataModel.find(req.query)
        .exec(function(err, data) {
            if (err){
                console.log(err);
                return res.status(400).json(err);
            }
            res.status(200).json(data);
        }); 
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