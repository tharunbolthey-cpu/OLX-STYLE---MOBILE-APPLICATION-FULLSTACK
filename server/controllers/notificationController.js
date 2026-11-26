const Notification = require('../models/Notification');
const { ok, fail } = require('../utils/apiResponse');

exports.list = async (req, res) => {
  const notifications = await Notification.find({
    user: req.user._id
  })
    .sort({ createdAt: -1 })
    .limit(100);

  return ok(res, {
    notifications
  });
};

exports.unreadCount = async (req, res) => {
  const count = await Notification.countDocuments({
    user: req.user._id,
    read: false
  });

  return ok(res, {
    count
  });
};

exports.read = async (req, res) => {
  const notification =
    await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user._id
      },
      {
        read: true
      },
      {
        new: true
      }
    );

  if (!notification) {
    return fail(
      res,
      'Notification not found',
      404
    );
  }

  return ok(res, {
    notification
  });
};

exports.remove = async (req, res) => {
  const notification =
    await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

  if (!notification) {
    return fail(
      res,
      'Notification not found',
      404
    );
  }

  return ok(
    res,
    null,
    'Notification deleted'
  );
};

exports.readAll = async (req, res) => {
  await Notification.updateMany(
    {
      user: req.user._id,
      read: false
    },
    {
      $set: {
        read: true
      }
    }
  );

  return ok(
    res,
    null,
    'All notifications marked as read'
  );
};