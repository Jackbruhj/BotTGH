const mysql = require('mysql2');
const { hasPermission } = require('./permissions'); // Importa la validación de roles
const rolesConfig = require('./roles.json'); // Configuración de roles
const { generateUserImage } = require('./generateImage.js'); // Importa la función de generación de imágenes
const { AttachmentBuilder } = require('discord.js'); // Para enviar la imagen generada


// Configuración de conexión a la base de datos
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'jackygolden',
    database: process.env.DB_NAME || 'nombre_base'
});

const REQUIRED_ROLE = ["King of Heroes 👑", "Sacerdote Misterioso ⛪", "Ruler-📜"];

module.exports = {
    register: (message, args) => {
        if (!hasPermission(message, 'register')) {
            return message.reply('No tienes permiso para usar este comando.');
        }
    
        // Extraer el nombre de usuario de Discord y Roblox
        let discordUsuario;
        const robloxUsuario = args[1];
    
        if (message.mentions.users.size > 0) {
            // Si mencionas al usuario, obtenemos su nombre#etiqueta
            discordUsuario = message.mentions.users.first().tag; // Ejemplo: MiUsuarioDiscord#1234
        } else {
            // Si no mencionas al usuario, asumimos que pasaste el nombre directamente
            discordUsuario = args[0]; // Ejemplo: MiUsuarioDiscord#1234
        }
    
        if (!discordUsuario || !robloxUsuario) {
            return message.reply('Uso incorrecto. Ejemplo: `!J register MiUsuarioDiscord#1234 MiUsuarioRoblox` o `!J register @Usuario MiUsuarioRoblox`');
        }
    
        // Consulta para registrar al usuario
        const query = 'INSERT INTO usuarios (discord_usuario, roblox_usuario) VALUES (?, ?)';
        db.query(query, [discordUsuario, robloxUsuario], (err) => {
            if (err) {
                console.error(err);
                // Manejar el error en caso de usuario duplicado
                if (err.code === 'ER_DUP_ENTRY') {
                    return message.reply('El usuario ya está registrado.');
                }
                return message.reply('Hubo un error al registrar al usuario.');
            }
            message.reply(`Usuario \`${discordUsuario}\` registrado exitosamente con Roblox: \`${robloxUsuario}\`.`);
        });
    },
    
    add: async (message, args) => {
        if (!hasPermission(message, 'add')) {
            return message.reply('No tienes permiso para usar este comando.');
        }
    
        const [usuario, puntos] = args;
    
        if (!usuario || !puntos || isNaN(puntos)) {
            return message.reply('Uso incorrecto. Ejemplo: `!J add @Usuario 10`');
        }
    
        const cleanedUsuario = usuario.replace(/^<@!?(\d+)>$/, '$1');
        const member = message.guild.members.cache.get(cleanedUsuario);
    
        if (!member) {
            return message.reply('No se encontró el usuario mencionado.');
        }
    
        // Consulta para obtener los puntos actuales del usuario
        const fetchQuery = `
            SELECT discord_usuario, puntos_heroe, rango, puntos_necesarios
            FROM usuarios 
            WHERE discord_usuario = ?
        `;
    
        db.query(fetchQuery, [member.user.username], (err, rows) => {
            if (err) {
                console.error(err);
                return message.reply('Hubo un error al obtener los datos del usuario.');
            }
            if (rows.length === 0) {
                return message.reply(`No se encontró el usuario con nombre de Discord: ${member.user.username}`);
            }
    
            const { discord_usuario, puntos_heroe } = rows[0];
            const nuevosPuntos = puntos_heroe + parseInt(puntos);
    
            // Calcular el nuevo rango y los puntos necesarios
            let nuevoRango = 'F';
            let puntosNecesarios = 0;
            let rolId = ''; // ID del rol correspondiente
    
            if (nuevosPuntos >= 30000) {
                nuevoRango = 'EX';
                puntosNecesarios = 0;
                rolId = '1322447462975143997';
            } else if (nuevosPuntos >= 20000) {
                nuevoRango = 'A';
                puntosNecesarios = 30000 - nuevosPuntos;
                rolId = '1322447370926952468';
            } else if (nuevosPuntos >= 15000) {
                nuevoRango = 'B';
                puntosNecesarios = 20000 - nuevosPuntos;
                rolId = '1322447279726268417';
            } else if (nuevosPuntos >= 10000) {
                nuevoRango = 'C';
                puntosNecesarios = 15000 - nuevosPuntos;
                rolId = '1322447132908720159';
            } else if (nuevosPuntos >= 5000) {
                nuevoRango = 'D';
                puntosNecesarios = 10000 - nuevosPuntos;
                rolId = '1322447060267569236';
            } else if (nuevosPuntos >= 1000) {
                nuevoRango = 'E';
                puntosNecesarios = 5000 - nuevosPuntos;
                rolId = '1322446967246295160';
            } else {
                nuevoRango = 'F';
                puntosNecesarios = 1000 - nuevosPuntos;
            }
    
            // Actualizar los puntos, rango y puntos necesarios
            const updateQuery = `
                UPDATE usuarios
                SET 
                    puntos_heroe = ?,
                    rango = ?,
                    puntos_necesarios = ?
                WHERE discord_usuario = ?
            `;
    
            const params = [nuevosPuntos, nuevoRango, puntosNecesarios, member.user.username];
    
            db.query(updateQuery, params, async (err, result) => {
                if (err) {
                    console.error(err);
                    return message.reply('Hubo un error al actualizar los puntos del usuario.');
                }
                if (result.affectedRows === 0) {
                    return message.reply(`No se encontró el usuario con nombre de Discord: ${member.user.username}`);
                }
    
                // Asignar el rol al usuario si tiene un nuevo rango
                if (rolId) {
                    try {
                        const role = message.guild.roles.cache.get(rolId);
                        if (!role) {
                            return message.reply('No se encontró el rol para este rango. Verifica la configuración.');
                        }
                        await member.roles.add(role);
                        message.reply(`🎉 El usuario "${discord_usuario}" ha alcanzado el rango **${nuevoRango}** y se le ha asignado el rol **${role.name}**.`);
                    } catch (error) {
                        console.error('Error al asignar el rol:', error);
                        return message.reply('Hubo un error al asignar el rol al usuario.');
                    }
                }
    
                message.reply(
                    `✅ **Puntos actualizados** para el usuario "${discord_usuario}":\n` +
                    `- **Puntos actuales:** ${nuevosPuntos}\n` +
                    `- **Rango:** ${nuevoRango}\n` +
                    (puntosNecesarios > 0
                        ? `- **Faltan ${puntosNecesarios} puntos** para el siguiente rango.`
                        : `- ¡Ya está en el rango máximo! 🎉`)
                );
            });
        });
    },
    
    
    
    
    delete: (message, args) => {
        if (!hasPermission(message, 'delete')) {
            return message.reply('No tienes permiso para usar este comando.');
        }

        const [id] = args;
        if (!id) {
            return message.reply('Uso incorrecto. Ejemplo: `!J delete 1`');
        }

        const query = 'DELETE FROM usuarios WHERE id = ?';
        db.query(query, [id], (err, result) => {
            if (err) {
                console.error(err);
                return message.reply('Hubo un error al eliminar al usuario.');
            }
            if (result.affectedRows === 0) {
                return message.reply('No se encontró el usuario especificado.');
            }
            message.reply(`El usuario con ID ${id} ha sido eliminado del sistema.`);
        });
    },

    setrole: (message, args) => {
        const [command, role] = args;
        if (!command || !role) {
            return message.reply('Uso incorrecto. Ejemplo: `!J setrole register Moderador`');
        }

        if (!rolesConfig[command]) {
            return message.reply(`El comando "${command}" no existe.`);
        }

        if (!rolesConfig[command].includes(role)) {
            rolesConfig[command].push(role);
        }

        const fs = require('fs');
        fs.writeFile('./roles.json', JSON.stringify(rolesConfig, null, 4), (err) => {
            if (err) {
                console.error(err);
                return message.reply('Hubo un error al actualizar los roles.');
            }
            message.reply(`El rol "${role}" ahora tiene acceso al comando "${command}".`);
        });
    },

    user: async (message, args) => {
        let discordUsuario;
    
        // Verifica si hay una mención
        if (message.mentions.users.size > 0) {
            discordUsuario = message.mentions.users.first().tag; // Obtiene el usuario mencionado
        } else if (args.length > 0) {
            discordUsuario = args[0]; // Usa el argumento si no hay mención
        }
    
        // Valida si se proporcionó un usuario
        if (!discordUsuario) {
            return message.reply('Uso incorrecto. Ejemplo: `!J user @usuario` o `!J user MiUsuarioDiscord`');
        }
    
        const query = `
            SELECT discord_usuario, roblox_usuario, puntos_heroe, puntos_necesarios, rango 
            FROM usuarios 
            WHERE discord_usuario = ?
        `;
    
        // Consulta en la base de datos
        db.query(query, [discordUsuario], async (err, rows) => {
            if (err) {
                console.error('Error al buscar al usuario:', err.message);
                return message.reply('Hubo un error al buscar al usuario.');
            }
            
            // Si no se encuentra al usuario
            if (rows.length === 0) {
                return message.reply(`No se encontró un usuario con Discord: ${discordUsuario}`);
            }
    
            // Extraer datos del usuario
            const { discord_usuario, roblox_usuario, puntos_heroe, puntos_necesarios, rango } = rows[0];
            const avatarURL = message.mentions.users.size > 0
                ? message.mentions.users.first().displayAvatarURL({ extension: 'png', size: 128 })
                : message.author.displayAvatarURL({ extension: 'png', size: 128 });
    
            try {
                // Generar la imagen con los datos del usuario
                const imageBuffer = await generateUserImage(
                    discord_usuario,
                    roblox_usuario,
                    puntos_heroe,
                    puntos_necesarios,
                    avatarURL,
                    rango // Aquí ahora se pasa el rango
                );
    
                // Crear un attachment con la imagen generada
                const { AttachmentBuilder } = require('discord.js'); // Asegúrate de importar esto si aún no lo hiciste
                const attachment = new AttachmentBuilder(imageBuffer, { name: 'user_stats.png' });
    
                // Enviar la imagen como mensaje
                await message.reply({ files: [attachment] });
            } catch (error) {
                console.error('Error al generar la imagen:', error.message);
                return message.reply('Hubo un error al generar la imagen del usuario.');
            }
        });
    },
    
    
};
