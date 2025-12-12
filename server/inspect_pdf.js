const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');

const pdfPath = path.join(__dirname, '../HCDA BAMBOO AGROFUSIÓN PARA LEGALIZACIÓN.pdf');

let dataBuffer = fs.readFileSync(pdfPath);

pdf(dataBuffer).then(function (data) {
    console.log(data.text);
}).catch(err => {
    console.error(err);
});
