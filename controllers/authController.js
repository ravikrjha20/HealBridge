const Patient = require("../model/patientModel");
const Doctor = require("../model/doctorModel");
const Token = require("../model/token");
const CustomError = require("../errors");
const { StatusCodes } = require("http-status-codes");
const { createTokenUser, attachCookiesToResponse } = require("../utils");
const crypto = require("crypto");

//=========== REGISTRATION =================

// REGISTER A NEW PATIENT
const registerPatient = async (req, res) => {
  const { name, username, email, password } = req.body;
  console.log(name);

  if (!name || !username || !email || !password) {
    throw new CustomError.BadRequestError(
      "Please provide name, username, email, and password"
    );
  }

  const emailExists = await Patient.findOne({ email });
  if (emailExists) {
    throw new CustomError.BadRequestError(
      "An account with this email already exists"
    );
  }

  const usernameExists = await Patient.findOne({ username });
  if (usernameExists) {
    throw new CustomError.BadRequestError("This username is already taken");
  }

  if (/\s/.test(username)) {
    throw new CustomError.BadRequestError("Username cannot contain spaces");
  }

  // First account is an admin
  // const isFirstAccount = (await Patient.countDocuments({})) === 0;
  // const role = isFirstAccount ? 'admin' : 'patient';

  const user = await Patient.create({ name, username, email, password });

  const { password: _, ...safeUser } = user._doc;
  res.status(StatusCodes.CREATED).json({
    msg: "Patient registered successfully. Please log in.",
    user: safeUser,
  });
};
// REGISTER A NEW DOCTOR
const registerDoctor = async (req, res) => {
  const {
    name,
    username,
    email,
    password,
    specialization,
    licenseNumber,
    licenseState,
  } = req.body;

  // Validate all required fields from the request body
  const requiredFields = {
    name,
    username,
    email,
    password,
    specialization,
    licenseNumber,
    licenseState,
  };
  for (const [field, value] of Object.entries(requiredFields)) {
    if (!value) {
      throw new CustomError.BadRequestError(
        `Please provide the required field: ${field}`
      );
    }
  }

  // Check if email already exists
  const emailExists = await Doctor.findOne({ email });
  if (emailExists) {
    throw new CustomError.BadRequestError(
      "An account with this email already exists"
    );
  }

  // Check if username is already taken
  const usernameExists = await Doctor.findOne({ username });
  if (usernameExists) {
    throw new CustomError.BadRequestError("This username is already taken");
  }

  // Check if license number is already registered
  const licenseExists = await Doctor.findOne({
    "license.number": licenseNumber,
  });
  if (licenseExists) {
    throw new CustomError.BadRequestError(
      "This license number is already registered"
    );
  }

  // Create the new doctor document with the correctly nested license object
  const user = await Doctor.create({
    name,
    username,
    email,
    password,
    specialization,
    license: { number: licenseNumber, state: licenseState },
  });

  // Remove the password from the returned user object
  const { password: _, ...safeUser } = user._doc;

  res.status(StatusCodes.CREATED).json({
    msg: "Doctor registered successfully. You may now log in.",
    user: safeUser,
  });
};
//=========== LOGIN (UNIFIED) =================

const login = async (req, res) => {
  const { identifier, password, role } = req.body;

  if (!identifier || !password || !role) {
    throw new CustomError.BadRequestError(
      "Please provide email/username, password, and role ('Patient' or 'Doctor')"
    );
  }

  const Model = role === "Patient" ? Patient : Doctor;
  if (!Model) {
    throw new CustomError.BadRequestError("Invalid role specified.");
  }

  const user = await Model.findOne({
    $or: [{ email: identifier }, { username: identifier }],
  }).select("+password");

  if (!user) {
    throw new CustomError.UnauthenticatedError("Invalid credentials");
  }

  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new CustomError.UnauthenticatedError("Invalid credentials");
  }

  const tokenUser = createTokenUser(user, role);

  let refreshToken = "";
  const existingToken = await Token.findOne({ user: user._id });

  if (existingToken) {
    if (!existingToken.isValid)
      throw new CustomError.UnauthenticatedError(
        "Your account is disabled. Please contact support."
      );
    refreshToken = existingToken.refreshToken;
  } else {
    refreshToken = crypto.randomBytes(40).toString("hex");
    const userAgent = req.headers["user-agent"];
    const ip = req.ip;
    await Token.create({
      refreshToken,
      ip,
      userAgent,
      user: user._id,
      userType: role,
    });
  }

  attachCookiesToResponse({ res, user: tokenUser, refreshToken });

  const { password: _, ...safeUser } = user._doc;
  res.status(StatusCodes.OK).json({ user: safeUser });
};

//=========== LOGOUT (UNIFIED) =================

const logout = async (req, res) => {
  // req.user is populated by the authentication middleware
  await Token.findOneAndDelete({ user: req.user.userId });

  res.cookie("accessToken", "logout", {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.cookie("refreshToken", "logout", {
    httpOnly: true,
    expires: new Date(Date.now()),
  });

  res.status(StatusCodes.OK).json({ msg: "User logged out successfully!" });
};

module.exports = {
  registerPatient,
  registerDoctor,
  login,
  logout,
};
