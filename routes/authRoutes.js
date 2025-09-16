const express = require("express");
const router = express.Router();

const {
  registerPatient,
  registerDoctor,
  login,
  logout,
} = require("../controllers/authController");

const { authenticateUser } = require("../middleware/authentication");
router.post("/register/patient", registerPatient);
router.post("/register/doctor", registerDoctor);
router.post("/login", login);
router.delete("/logout", authenticateUser, logout);

module.exports = router;
