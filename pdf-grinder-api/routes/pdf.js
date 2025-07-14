const express = require('express');
const router = express.Router();

// temporal: ruta base
router.get('/test', (req, res) => {
    res.send('PDF Grinder API is working!');
});

module.exports = router;