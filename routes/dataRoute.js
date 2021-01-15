const {postData, getData, getBotList} = require('../controller/dataRequestController');
const router = require('express').Router();

router.get('', getData);
router.get('/flowlist', getBotList);
router.post('/post', postData);

module.exports = router;
