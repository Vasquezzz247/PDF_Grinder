const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const pdfRoutes = require('./routes/pdf');
app.use('/api', pdfRoutes);

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});