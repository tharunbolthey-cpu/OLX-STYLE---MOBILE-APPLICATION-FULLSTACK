const mongoose = require('mongoose');

const User = require('../models/User');

const Listing = require('../models/Listing');

const bcrypt = require('bcryptjs');

const {
  ok,
  fail
} = require('../utils/apiResponse');

exports.profile = async (req, res) => {
  return ok(res, {
    user: req.user
  });
};

exports.update = async (req, res) => {
  try {
    const changes = {};

    if (req.body?.name !== undefined) {
      changes.name = String(
        req.body.name
      ).trim();
    }

    if (req.body?.phone !== undefined) {
      changes.phone = String(
        req.body.phone
      ).trim();
    }

    if (req.body?.location !== undefined) {
      changes.location = String(
        req.body.location
      ).trim();
    }

    if (
      changes.name !== undefined &&
      changes.name.length < 2
    ) {
      return fail(
        res,
        'Name must contain at least 2 characters'
      );
    }

    if (
      changes.phone !== undefined &&
      !changes.phone
    ) {
      return fail(
        res,
        'Phone number is required'
      );
    }

    if (req.file) {
      changes.avatar =
        `/uploads/${req.file.filename}`;
    }

    if (!Object.keys(changes).length) {
      return fail(
        res,
        'No profile changes supplied'
      );
    }

    const user =
      await User.findByIdAndUpdate(
        req.user._id,
        changes,
        {
          new: true,
          runValidators: true
        }
      ).select('-password');

    if (!user) {
      return fail(
        res,
        'User not found',
        404
      );
    }

    return ok(
      res,
      {
        user
      },
      'Profile updated successfully'
    );
  } catch (error) {
    console.error(
      'Update profile error:',
      error
    );

    return fail(
      res,
      'Could not update profile',
      500
    );
  }
};

exports.changePassword = async (
  req,
  res
) => {
  const {
    currentPassword,
    newPassword
  } = req.body || {};

  if (
    !currentPassword ||
    !newPassword
  ) {
    return fail(
      res,
      'Current and new passwords are required'
    );
  }

  if (newPassword.length < 6) {
    return fail(
      res,
      'New password must be at least 6 characters'
    );
  }

  const user =
    await User.findById(
      req.user._id
    ).select('+password');

  if (
    !user ||
    !(await bcrypt.compare(
      currentPassword,
      user.password
    ))
  ) {
    return fail(
      res,
      'Current password is incorrect',
      400
    );
  }

  user.password =
    await bcrypt.hash(
      newPassword,
      12
    );

  await user.save();

  return ok(
    res,
    null,
    'Password updated'
  );
};

exports.seller = async (
  req,
  res
) => {
  if (
    !mongoose.isValidObjectId(
      req.params.id
    )
  ) {
    return fail(
      res,
      'Invalid seller id'
    );
  }

  const user =
    await User.findById(
      req.params.id
    ).select(
      'name avatar location createdAt'
    );

  if (!user) {
    return fail(
      res,
      'Seller not found',
      404
    );
  }

  const listings =
    await Listing.find({
      seller: user._id,
      status: 'active'
    })
      .populate(
        'category',
        'name icon'
      )
      .sort({
        createdAt: -1
      });

  return ok(res, {
    seller: user,
    listings
  });
};

exports.list = async (
  req,
  res
) => {
  return ok(res, {
    users:
      await User.find()
        .select('-password')
        .sort({
          createdAt: -1
        })
  });
};

exports.suspend = async (
  req,
  res
) => {
  if (
    !mongoose.isValidObjectId(
      req.params.id
    )
  ) {
    return fail(
      res,
      'Invalid user id'
    );
  }

  if (
    String(req.user._id) ===
    String(req.params.id)
  ) {
    return fail(
      res,
      'You cannot suspend yourself'
    );
  }

  const user =
    await User.findByIdAndUpdate(
      req.params.id,
      {
        status: 'suspended'
      },
      {
        new: true
      }
    ).select('-password');

  if (!user) {
    return fail(
      res,
      'User not found',
      404
    );
  }

  return ok(
    res,
    {
      user
    },
    'User suspended'
  );
};

exports.activate = async (
  req,
  res
) => {
  if (
    !mongoose.isValidObjectId(
      req.params.id
    )
  ) {
    return fail(
      res,
      'Invalid user id'
    );
  }

  const user =
    await User.findByIdAndUpdate(
      req.params.id,
      {
        status: 'active'
      },
      {
        new: true
      }
    ).select('-password');

  if (!user) {
    return fail(
      res,
      'User not found',
      404
    );
  }

  return ok(
    res,
    {
      user
    },
    'User activated'
  );
};

exports.remove = async (
  req,
  res
) => {
  if (
    !mongoose.isValidObjectId(
      req.params.id
    )
  ) {
    return fail(
      res,
      'Invalid user id'
    );
  }

  if (
    String(req.user._id) ===
    String(req.params.id)
  ) {
    return fail(
      res,
      'You cannot delete yourself'
    );
  }

  const user =
    await User.findByIdAndDelete(
      req.params.id
    );

  if (!user) {
    return fail(
      res,
      'User not found',
      404
    );
  }

  await Listing.deleteMany({
    seller: user._id
  });

  return ok(
    res,
    null,
    'User deleted'
  );
};