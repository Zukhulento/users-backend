require("dotenv").config();

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const sequelize = require("./database");
const { Op } = require("sequelize");
const User = require("./models/User");
const State = require("./models/State");
const authenticateToken = require("./middlewares/authenticateToken");

const app = express();
app.use(express.json());
const port = 3000;

// Secret key for JWT
const SECRET_KEY = process.env.SECRET_KEY;

// Cors config
// ! Se especifica Authorization para permitir el envío de tokens
app.use(
  cors({
    origin: "*", // * para permitir todas las peticiones
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"], // Agrega Authorization si estás enviando tokens
    credentials: true, // Si necesitas enviar cookies o headers de autorización
  })
);

// DB Sync
sequelize
  .sync()
  .then(() => {
    console.log("Base de datos y tablas creadas");
  })
  .catch((err) => {
    console.error("Error al sincronizar la base de datos:", err);
  });
// TODO Auth Routes
// ? Register user
app.post("/register", async (req, res) => {
  console.log(req.body);
  const { name, username, lastName, email, photoSource, password } = req.body;

  try {
    // Verificar si el email o username ya están en uso
    const existingUser =
      (await User.findOne({ where: { email } })) ||
      (await User.findOne({ where: { username } }));
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Email o username ya están en uso" });
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear el nuevo usuario
    const newUser = await User.create({
      email,
      lastName,
      name,
      password: hashedPassword,
      photoSource,
      stateId: "1",
      username,
    });

    res.status(201).json(newUser);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error en el servidor");
  }
});

// ? Login user
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Encuentra al usuario por username o email
    const user = await User.findOne({
      where: {
        [Op.or]: [{ username: username || null }, { email: username || null }],
      },
    });

    if (!user) {
      return res.status(404).send("Usuario no encontrado");
    }

    // Verifica la contraseña
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).send("Contraseña incorrecta");
    }

    // Genera un token JWT
    const token = jwt.sign({ id: user.id }, process.env.SECRET_KEY, {
      expiresIn: "1h",
    });

    res.json({ token });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error en el servidor");
  }
});
// ? Logout user
app.post("/logout", authenticateToken, async (req, res) => {
  // Aquí, en un entorno real, podrías realizar acciones como invalidar tokens en el servidor si es necesario.
  // Dado que usamos JWT, generalmente el logout se maneja en el cliente eliminando el token.
  res.send("Successfull logout.");
});

// ? Current User Data
app.get("/me", authenticateToken, async (req, res) => {
  const userId = req.user.id; // Obtén el ID del usuario desde el token

  try {
    // Buscar el usuario en la base de datos
    const user = await User.findByPk(userId, { include: State });

    if (user) {
      res.json(user); // Devuelve los datos del usuario
    } else {
      res.status(404).send("Usuario no encontrado"); // Si el usuario no se encuentra, respuesta 404
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error en el servidor"); // Manejo de errores
  }
});

//! Endpoints...
// TODO: State routes
// ? Save State
app.post("/state", authenticateToken, async (req, res) => {
  const { name } = req.body;
  console.log(name);
  try {
    const newState = await State.create({
      name: name,
    });
    res.status(201).json(newState);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error en el servidor");
  }
});
// ? Get all states
app.get("/states", authenticateToken, async (req, res) => {
  try {
    const states = await State.findAll();
    res.json(states);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error en el servidor");
  }
});
// ? Get user By ID
app.get("/users/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findByPk(id, { include: State });
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error en el servidor");
  }
});
// TODO: User Routes
// ? Get all users
app.get("/users", authenticateToken, async (req, res) => {
  try {
    const users = await User.findAll({ include: State });
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error en el servidor");
  }
});
// ? Create user
app.post("/users", authenticateToken, async (req, res) => {
  const {
    name,
    username,
    lastName,
    birthdate,
    email,
    address,
    photoSource,
    password,
    stateId,
  } = req.body;
  try {
    const newUser = await User.create({
      name,
      username,
      lastName,
      birthdate,
      email,
      address,
      photoSource,
      password,
      stateId,
    });
    res.json(newUser);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error en el servidor");
  }
});

// ? Update user
app.put("/users/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const {
    name,
    username,
    lastName,
    birthdate,
    email,
    address,
    photoSource,
    password,
    stateId,
  } = req.body;
  try {
    const user = await User.findByPk(id);
    if (user) {
      user.name = name;
      user.username = username;
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
      res.status(404).send("Usuario no encontrado");
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error en el servidor");
  }
});

// ? Delete user
app.delete("/users/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findByPk(id);
    if (user) {
      await user.destroy();
      res.send("Usuario eliminado");
    } else {
      res.status(404).send("Usuario no encontrado");
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error en el servidor");
  }
});

//* Start server
app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});
