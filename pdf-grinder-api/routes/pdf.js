const express = require('express');
const router = express.Router();

const upload = require('../middlewares/upload');
const { mergePDFs } = require('../controllers/pdfController');

router.get('/test', (req, res) => {
    res.send('PDF Grinder API is working!');
});

router.post('/merge', upload.array('files', 10), mergePDFs);

module.exports = router;
