const {postData,getPage, getData} = require('../controller/chatbotController');
const router = require('express').Router();

router.get('/', getPage);
router.get('/data', getData);
router.post('/post', postData);

module.exports = router;
