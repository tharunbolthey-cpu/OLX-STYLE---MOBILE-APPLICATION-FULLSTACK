const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/User');

const { ok, fail } = require('../utils/apiResponse');

const publicUser = (u) => ({
  id: String(u._id),

  _id: String(u._id),

  name: u.name,

  email: u.email,

  phone: u.phone,

  location: u.location || '',

  avatar: u.avatar || '',

  role: u.role,

  status: u.status,

  createdAt: u.createdAt
});

const token = (u) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  return jwt.sign(
    {
      userId: u._id,
      role: u.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '7d'
    }
  );
};

const cookieOptions = {
  httpOnly: true,
  secure: false,
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/'
};
exports.register = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      confirmPassword
    } = req.body || {};

    if (
      !name?.trim() ||
      !email?.trim() ||
      !phone?.trim() ||
      !password
    ) {
      return fail(
        res,
        'Name, email, phone and password are required'
      );
    }

    if (password !== confirmPassword) {
      return fail(res, 'Passwords do not match');
    }

    if (password.length < 6) {
      return fail(
        res,
        'Password must be at least 6 characters'
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const exists = await User.findOne({
      email: normalizedEmail
    });

    if (exists) {
      return fail(
        res,
        'Email is already registered',
        409
      );
    }

    let avatar = '';

    if (req.file) {
      avatar = `/uploads/${req.file.filename}`;
    }

    const u = await User.create({
      name: name.trim(),

      email: normalizedEmail,

      phone: phone.trim(),

      password: await bcrypt.hash(password, 12),

      avatar
    });

    const authToken = token(u);

    res.cookie(
      'marketly_token',
      authToken,
      cookieOptions
    );

    return ok(
      res,
      {
        token: authToken,
        user: publicUser(u)
      },
      'Registration successful',
      201
    );
  } catch (error) {
    console.error('Registration error:', error);

    return fail(
      res,
      'Registration failed',
      500
    );
  }
};

exports.login = async (req, res) => {
  try {
    const {
      email,
      password
    } = req.body || {};

    if (!email?.trim() || !password) {
      return fail(
        res,
        'Email and password are required'
      );
    }

    const u = await User.findOne({
      email: email.trim().toLowerCase()
    }).select('+password');

    if (
      !u ||
      !(await bcrypt.compare(password, u.password))
    ) {
      return fail(
        res,
        'Invalid email or password',
        401
      );
    }

    if (u.status === 'suspended') {
      return fail(
        res,
        'Account is suspended',
        403
      );
    }

    const authToken = token(u);

    res.cookie(
      'marketly_token',
      authToken,
      cookieOptions
    );

    return ok(
      res,
      {
        token: authToken,
        user: publicUser(u)
      },
      'Login successful'
    );
  } catch (error) {
    console.error('Login error:', error);

    return fail(
      res,
      'Login failed',
      500
    );
  }
};

exports.logout = async (req, res) => {
  res.clearCookie(
    'marketly_token',
    cookieOptions
  );

  return ok(
    res,
    null,
    'Logged out successfully'
  );
};

exports.me = async (req, res) => {
  return ok(res, {
    user: publicUser(req.user)
  });
};