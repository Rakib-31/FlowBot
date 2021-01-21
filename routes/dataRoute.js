const {postData, getData, updateData, getBotList} = require('../controller/dataRequestController');
const router = require('express').Router();

router.get('', getData);
router.get('/flowlist', getBotList);
router.post('/update/:id', updateData);
router.post('/post', postData);


module.exports = router;
