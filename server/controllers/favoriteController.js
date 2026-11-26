const mongoose = require('mongoose');

const Favorite = require('../models/Favorite');
const Listing = require('../models/Listing');

const {
  ok,
  fail
} = require('../utils/apiResponse');

const {
  notifyFavorite
} = require('../services/notificationService');

exports.add = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.listingId)) {
    return fail(res, 'Invalid listing id');
  }

  const listing = await Listing.findById(
    req.params.listingId
  );

  if (!listing) {
    return fail(
      res,
      'Listing not found',
      404
    );
  }

  // Prevent seller from favoriting their own listing.
  if (
    String(listing.seller) ===
    String(req.user._id)
  ) {
    return fail(
      res,
      'You cannot favorite your own listing'
    );
  }

  /*
   * Only create a notification when this is
   * actually a NEW favorite.
   *
   * If the user already favorited the listing,
   * no duplicate notification is created.
   */
  const result = await Favorite.updateOne(
    {
      user: req.user._id,
      listing: listing._id
    },
    {
      $setOnInsert: {
        user: req.user._id,
        listing: listing._id
      }
    },
    {
      upsert: true
    }
  );

  const wasCreated =
    result.upsertedCount === 1;

  if (
    wasCreated &&
    listing.seller
  ) {
    try {
      await notifyFavorite({
        sellerId: listing.seller,
        listingId: listing._id,
        listingTitle: listing.title
      });
    } catch (error) {
      console.error(
        'Failed to create favorite notification:',
        error
      );
    }
  }

  return ok(
    res,
    {
      favorite: true
    },
    'Added to favorites',
    201
  );
};

exports.remove = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.listingId)) {
    return fail(res, 'Invalid listing id');
  }

  await Favorite.deleteOne({
    user: req.user._id,
    listing: req.params.listingId
  });

  return ok(
    res,
    {
      favorite: false
    },
    'Removed from favorites'
  );
};

exports.list = async (req, res) => {
  const favorites = await Favorite.find({
    user: req.user._id
  })
    .populate({
      path: 'listing',
      populate: [
        {
          path: 'category',
          select: 'name icon'
        },
        {
          path: 'seller',
          select: 'name location avatar'
        }
      ]
    })
    .sort({
      createdAt: -1
    });

  return ok(res, {
    favorites
  });
};

exports.check = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.listingId)) {
    return fail(res, 'Invalid listing id');
  }

  const favorite =
    await Favorite.exists({
      user: req.user._id,
      listing: req.params.listingId
    });

  return ok(res, {
    favorite: !!favorite
  });
};