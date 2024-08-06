// server.js
const express = require('express');
const sequelize = require('./database');
const User = require('./models/User');
const State = require('./models/State');

const app = express();
const port = 3000;

app.use(express.json());

// Sincronizar con la base de datos
sequelize.sync().then(() => {
  console.log('Base de datos y tablas creadas');
}).catch(err => {
  console.error('Error al sincronizar la base de datos:', err);
});

// Ruta para obtener todos los usuarios
app.get('/users', async (req, res) => {
  try {
    const users = await User.findAll({ include: State });
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
});

// Ruta para obtener un solo usuario por ID
app.get('/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findByPk(id, { include: State });
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
});

// Ruta para crear un nuevo usuario
app.post('/users', async (req, res) => {
  const { name, lastName, birthdate, email, address, photoSource, password, stateId } = req.body;
  try {
    const newUser = await User.create({ name, lastName, birthdate, email, address, photoSource, password, stateId });
    res.json(newUser);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
});

// Ruta para actualizar un usuario
app.put('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { name, lastName, birthdate, email, address, photoSource, password, stateId } = req.body;
  try {
    const user = await User.findByPk(id);
    if (user) {
      user.name = name;
      user.lastName = lastName;
      user.birthdate = birthdate;
      user.email = email;
      user.address = address;
      user.photoSource = photoSource;
      user.password = password;
      user.stateId = stateId;
      await user.save();
      res.json(user);
    } else {
      res.status(404).send('Usuario no encontrado');
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
});

// Ruta para eliminar un usuario
app.delete('/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findByPk(id);
    if (user) {
      await user.destroy();
      res.send('Usuario eliminado');
    } else {
      res.status(404).send('Usuario no encontrado');
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
});

app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});
