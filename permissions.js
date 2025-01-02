const rolesConfig = require('./roles.json'); // Configuración de roles

/**
 * Verifica si el usuario tiene un rol autorizado para el comando.
 * @param {Object} message - El mensaje de Discord.
 * @param {String} command - El comando que se está ejecutando.
 * @returns {Boolean} - True si el usuario tiene permiso.
 */
const hasPermission = (message, command) => {
    const allowedRoles = rolesConfig[command] || [];
    return message.member.roles.cache.some(role => allowedRoles.includes(role.name));
};

module.exports = {
    hasPermission,
};
