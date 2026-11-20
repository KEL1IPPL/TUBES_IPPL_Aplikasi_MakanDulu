const Tesseract = require('tesseract.js');

const readDocument = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Foto dokumen wajib diunggah'
            });
        }

        const result = await Tesseract.recognize(
            req.file.buffer,
            'ind'
        );

        const extractedText = result.data.text;

        return res.json({
            success: true,
            text: extractedText
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: 'Gagal membaca dokumen'
        });
    }
};

module.exports = { readDocument };