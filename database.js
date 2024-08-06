// database.js
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('users_db', 'app_users', '1234', {
  host: 'R2D2',
  dialect: 'mssql',
  dialectOptions: {
    instanceName: 'NIMODO',
    options: {
      encrypt: true,
      trustServerCertificate: true,
    },
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  logging: false // Puedes cambiar esto a `false` para desactivar el logging
});

module.exports = sequelize;
