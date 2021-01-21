var db = require("../model/database");

module.exports = {

    getData(req, res){
        res.render('index');
    },

    getBotList(req, res){
        res.render('botlist');
    },

    postData(req,res){
        var data = {
            tenant: req.body.tenant,
            VA_Name: req.body.VA_Name,
            VA_Id: req.body.VA_Id,
            nodes: JSON.stringify(req.body.nodes),
            shape: JSON.stringify(req.body.shape),
            slink: JSON.stringify(req.body.slink)
        };
        var sql =`INSERT OR REPLACE INTO data_flow (tenant, VA_Id, nodes, shape, VA_Name, slink) VALUES (?,?,?,?,?,?)`
        
        db.run(sql, [data.tenant, data.VA_Id, data.nodes, data.shape, data.VA_Name, data.slink], function (err, result) {
            if (err){
                console.log(err);
                res.status(400).json({"error": err.message});
                return;
            }
            console.log(data);
            res.status(200).json({
                "message": "success",
                "data": data,
                "id" : this.lastID
            })
        });
    },

    updateData(req, res){
        console.log('get');
        var data = {
            tenant: req.body.tenant,
            VA_Name: req.body.VA_Name,
            VA_Id: req.body.VA_Id,
            nodes: JSON.stringify(req.body.nodes),
            shape: JSON.stringify(req.body.shape)
        };
        db.run(
            `UPDATE data_flow set 
             tenant = COALESCE(?,tenant), 
             VA_Name = COALESCE(?,VA_Name), 
             VA_Id = COALESCE(?,VA_Id),
             nodes = COALESCE(?,nodes),
             shape = COALESCE(?,shape),
             WHERE id = ?`,
            [data.tenant, data.VA_Name, data.VA_Id,data.nodes, data.shape, req.params.id],
            function (err, result) {
                if (err){
                    res.status(400).json({"error": res.message})
                    return;
                }
                res.json({
                    message: "success",
                    data: data,
                    changes: this.changes
                })
        });
    }
}
