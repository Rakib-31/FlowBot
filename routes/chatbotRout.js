const {postData,getPage, getData, getSingelData} = require('../controller/chatbotController');
const router = require('express').Router();

router.get('/', getPage);
router.get('/data/:VA_Name', getSingelData);
router.get('/data', getData);
router.post('/post', postData);

module.exports = router;
