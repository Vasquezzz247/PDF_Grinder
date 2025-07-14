const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { PDFDocument } = require('pdf-lib');

const mergePDFs = async (req, res) => {
    try {
        const files = req.files;

        if (!files || files.length < 2) {
            return res.status(400).json({ message: 'At least two PDF files are required.' });
        }

        const mergedPdf = await PDFDocument.create();

        for (const file of files) {
            const filePath = path.join(process.env.UPLOAD_DIR, file.filename);
            const fileBuffer = await fs.readFile(filePath);

            const pdf = await PDFDocument.load(fileBuffer);
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());

            copiedPages.forEach((page) => {
                mergedPdf.addPage(page);
            });
        }

        const mergedPdfBytes = await mergedPdf.save();

        const outputFilename = `${uuidv4()}.pdf`;
        const outputPath = path.join(process.env.MERGED_DIR, outputFilename);

        await fs.writeFile(outputPath, mergedPdfBytes);

        // delete original uploaded PDFs to clean up
        for (const file of files) {
            const filePath = path.join(process.env.UPLOAD_DIR, file.filename);
            await fs.remove(filePath);
        }

        res.download(outputPath, outputFilename, (err) => {
            if (err) {
                console.error('Download error:', err);
                res.status(500).json({ message: 'Error sending the file.' });
            }
        });
    } catch (error) {
        console.error('Merge error:', error);
        res.status(500).json({ message: 'Something went wrong while merging PDFs.' });
    }
};

module.exports = { mergePDFs };