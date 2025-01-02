const { createCanvas, loadImage } = require('@napi-rs/canvas');
const path = require('path');
const { loadFonts } = require('./fonts'); // Importar la función para cargar las fuentes

async function generateUserImage(discord_usuario, roblox_usuario, puntos_heroe, puntos_necesarios, avatarURL, rango) {
    try {
        // Mapear los rangos con las plantillas correspondientes
        const rangoTemplates = {
            'EX': 'template.png',
            'A': 'template1.png',
            'B': 'template2.png',
            'C': 'template3.png',
            'D': 'template4.png',
            'E': 'template5.png',
            'F': 'template6.png',
        };

        // Verificar si el rango es válido y obtener la ruta de la plantilla
        const templateFilename = rangoTemplates[rango];
        if (!templateFilename) {
            throw new Error(`Rango inválido: ${rango}`);
        }

        const templatePath = path.join(__dirname, 'assets', templateFilename);
        const template = await loadImage(templatePath).catch(err => {
            throw new Error(`Error al cargar la plantilla: ${err.message}`);
        });

        // Corregir el nombre de Discord, eliminar solo los símbolos innecesarios
        const cleanDiscordUser = discord_usuario.replace(/^<@!?(\d+)>$/, 'Desconocido').trim();

        // Si el nombre no tiene el formato incorrecto, usar el nombre directamente
        const discordName = discord_usuario.startsWith('@') ? discord_usuario : `@${cleanDiscordUser}`;

        // Crear canvas con dimensiones de la plantilla
        const canvas = createCanvas(template.width, template.height);
        const ctx = canvas.getContext('2d');

        // Dibujar la plantilla
        ctx.drawImage(template, 0, 0);

        // Cargar avatar y recortar como círculo
        const avatar = await loadImage(avatarURL).catch(err => {
            throw new Error(`Error al cargar el avatar: ${err.message}`);
        });

        // Configuración del círculo
        const circleX = 115; // Nueva posición X del centro del círculo
        const circleY = 130; // Nueva posición Y del centro del círculo
        const circleRadius = 80; // Nuevo radio del círculo

        // Configuración de la imagen
        const imageX = 34; // Nueva posición X de la imagen dentro del círculo
        const imageY = 49; // Nueva posición Y de la imagen dentro del círculo
        const imageWidth = 160; // Nuevo ancho de la imagen
        const imageHeight = 160; // Nueva altura de la imagen

        ctx.save();
        ctx.beginPath();
        ctx.arc(circleX, circleY, circleRadius, 0, Math.PI * 2, true); // Configurar el círculo
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, imageX, imageY, imageWidth, imageHeight); // Configurar la imagen
        ctx.restore();

        // Agregar texto de Discord y Roblox
        ctx.font = '28px "Lexend", sans-serif'; // Usa la fuente registrada previamente
        ctx.lineWidth = 5;                      // Define el grosor del contorno
        ctx.strokeStyle = '#000000';            // Color del contorno
        ctx.fillStyle = '#ffffff';              // Color del texto
        ctx.strokeText(`Usuario: ${discord_usuario}`, 220, 88);
        ctx.fillText(`Usuario: ${discord_usuario}`, 220, 88);

        ctx.strokeText(`Usuario de Roblox: ${roblox_usuario}`, 50, 35);
        ctx.fillText(`Usuario de Roblox: ${roblox_usuario}`, 50, 35);

        // Agregar puntos de héroe
        ctx.font = '30px "Lexend", bold sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.lineWidth = 6;
        ctx.strokeStyle = '#000000';
        const texto = `${puntos_heroe}`;
        const textoWidth = ctx.measureText(texto).width;
        const x = 380;
        const y = 167;
        ctx.strokeText(texto, x - textoWidth / 2, y); // Ajustar para que esté centrado
        ctx.fillText(texto, x - textoWidth / 2, y); // Ajustar para que esté centrado

        ctx.font = '24px sans-serif';           // Establece la fuente
        ctx.lineWidth = 5;                      // Grosor del contorno
        ctx.strokeStyle = '#000000';            // Color del contorno
        ctx.fillStyle = '#ffffff';              // Color del texto
        ctx.strokeText(`Siguiente rango en: ${puntos_necesarios} puntos`, 220, 250);
        ctx.fillText(`Siguiente rango en: ${puntos_necesarios} puntos`, 220, 250);

        return canvas.toBuffer('image/png');
    } catch (error) {
        console.error('Error generando imagen:', error.message);
        throw error;
    }
}

module.exports = { generateUserImage };
