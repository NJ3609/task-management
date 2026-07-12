const User = require('../models/User');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const signToken = require('../utils/signToken');

function sanitizeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

const register = catchAsync(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    return next(new AppError('An account with this email already exists.', 409));
  }

  // Only allow role to be set here for demo/seeding convenience;
  // in production, admin creation would go through a separate,
  // protected endpoint restricted to existing admins.
  const user = await User.create({ name, email, password, role });
  const token = signToken(user._id);

  res.status(201).json({
    status: 'success',
    token,
    data: { user: sanitizeUser(user) },
  });
});

const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Incorrect email or password.', 401));
  }

  const token = signToken(user._id);

  res.status(200).json({
    status: 'success',
    token,
    data: { user: sanitizeUser(user) },
  });
});

module.exports = { register, login };
