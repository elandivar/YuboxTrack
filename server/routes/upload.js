const express = require('express');
const multer = require('multer');
const path = require('path');
const pdf = require('pdf-img-convert');
const pdfParse = require('pdf-parse');
const proj4 = require('proj4');
const fs = require('fs');

const router = express.Router();

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Ensure uploads dir exists
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Define UTM Zone 17S projection
const utm17s = "+proj=utm +zone=17 +south +ellps=WGS84 +datum=WGS84 +units=m +no_defs";

router.post('/', upload.single('plan'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const filePath = req.file.path;
    const mode = req.body.mode || 'manual'; // 'manual' or 'auto'

    try {
        console.log('Processing file:', filePath);
        let responseData = {
            path: `/uploads/${req.file.filename.replace('.pdf', '.png')}`,
            mode: mode
        };

        // Always convert to image for manual fallback or reference
        console.log('Converting PDF to image...');
        const outputImages = await pdf.convert(filePath);
        console.log('Conversion complete. Saving image...');
        const imagePath = filePath.replace('.pdf', '.png');
        fs.writeFileSync(imagePath, outputImages[0]);
        console.log('Image saved to:', imagePath);
        responseData.imagePath = `/uploads/${path.basename(imagePath)}`;

        if (mode === 'auto') {
            console.log('Auto mode: Extracting text...');
            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdfParse(dataBuffer);
            const text = data.text;
            console.log('Text extracted. Length:', text.length);

            // Regex to find coordinates in the format: P1 P1 - P2 ... EAST NORTH
            // Looking for lines like: P1 ... 654396.100 9744073.130
            // Adjusting regex based on inspection: P\d+.*(\d{6,7}\.\d{3})\s+(\d{7}\.\d{3})
            const regex = /P\d+\s+.*?\s+(\d{6,7}\.\d{3})\s+(\d{7}\.\d{3})/g;
            let match;
            const coordinates = [];

            while ((match = regex.exec(text)) !== null) {
                const easting = parseFloat(match[1]);
                const northing = parseFloat(match[2]);

                // Convert to Lat/Lng
                const [lng, lat] = proj4(utm17s, 'EPSG:4326', [easting, northing]);
                coordinates.push([lat, lng]);
            }
            console.log('Coordinates found:', coordinates.length);

            if (coordinates.length > 0) {
                responseData.coordinates = coordinates;
            } else {
                responseData.warning = "No coordinates found in PDF.";
            }
        }

        res.json(responseData);

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).send('Error processing PDF');
    }
});

module.exports = router;
