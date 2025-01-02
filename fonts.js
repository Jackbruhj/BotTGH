const path = require('path');
const { registerFont } = require('canvas');

// Registrar la fuente Lexend
function loadFonts() {
    const fontPath = path.join(__dirname, 'fonts', 'Lexend.otf'); // Ajusta la ruta según tu estructura
    registerFont(fontPath, { family: 'Lexend' });
}

module.exports = { loadFonts };
