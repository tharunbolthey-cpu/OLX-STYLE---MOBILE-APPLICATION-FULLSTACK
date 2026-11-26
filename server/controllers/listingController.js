const mongoose = require('mongoose');

const Listing = require('../models/Listing');

const {
  ok,
  fail
} = require('../utils/apiResponse');

const {
  notifyListingApproved,
  notifyListingRejected,
  notifyListingSold,
  notifyListingDeleted
} = require('../services/notificationService');

const base = (req) =>
  `${req.protocol}://${req.get('host')}`;

const editableFields = [
  'title',
  'description',
  'price',
  'category',
  'subcategory',
  'condition',
  'location'
];

const pick = (source, fields) =>
  fields.reduce((out, key) => {
    if (source[key] !== undefined) {
      out[key] = source[key];
    }

    return out;
  }, {});


/* =========================================================
   GET ACTIVE LISTINGS
========================================================= */

exports.list = async (req, res) => {
  const {
    q,
    category,
    subcategory,
    minPrice,
    maxPrice,
    location,
    condition,
    datePosted,
    sort = 'newest',
    page = 1,
    limit = 12
  } = req.query;

  const filter = {
    status: 'active'
  };

  if (q?.trim()) {
    filter.$text = {
      $search: q.trim()
    };
  }

  if (category) {
    filter.category = category;
  }

  if (subcategory) {
    filter.subcategory = subcategory;
  }

  if (location?.trim()) {
    filter.location = {
      $regex: location.trim(),
      $options: 'i'
    };
  }

  if (condition) {
    filter.condition = condition;
  }

  if (
    minPrice !== undefined ||
    maxPrice !== undefined
  ) {
    const price = {};

    if (
      minPrice !== undefined &&
      Number.isFinite(Number(minPrice))
    ) {
      price.$gte = Number(minPrice);
    }

    if (
      maxPrice !== undefined &&
      Number.isFinite(Number(maxPrice))
    ) {
      price.$lte = Number(maxPrice);
    }

    if (Object.keys(price).length) {
      filter.price = price;
    }
  }

  if (
    datePosted &&
    Number.isFinite(Number(datePosted))
  ) {
    const d = new Date();

    d.setDate(
      d.getDate() -
        Number(datePosted)
    );

    filter.createdAt = {
      $gte: d
    };
  }

  const sortMap = {
    newest: {
      createdAt: -1
    },

    oldest: {
      createdAt: 1
    },

    low: {
      price: 1
    },

    high: {
      price: -1
    }
  };

  const p = Math.max(
    1,
    Number(page) || 1
  );

  const l = Math.min(
    50,
    Math.max(
      1,
      Number(limit) || 12
    )
  );

  const [
    items,
    total
  ] = await Promise.all([
    Listing.find(filter)
      .populate(
        'category',
        'name icon'
      )
      .populate(
        'seller',
        'name avatar location'
      )
      .sort(
        sortMap[sort] ||
          sortMap.newest
      )
      .skip(
        (p - 1) * l
      )
      .limit(l),

    Listing.countDocuments(filter)
  ]);

  return ok(res, {
    items,
    total,
    page: p,
    pages: Math.ceil(
      total / l
    )
  });
};


/* =========================================================
   GET SINGLE LISTING
========================================================= */

exports.get = async (req, res) => {
  if (
    !mongoose.isValidObjectId(
      req.params.id
    )
  ) {
    return fail(
      res,
      'Invalid listing id'
    );
  }

  const item =
    await Listing.findByIdAndUpdate(
      req.params.id,
      {
        $inc: {
          views: 1
        }
      },
      {
        new: true
      }
    )
      .populate(
        'category',
        'name icon'
      )
      .populate(
        'seller',
        'name avatar location createdAt'
      );

  if (!item) {
    return fail(
      res,
      'Listing not found',
      404
    );
  }

  return ok(res, {
    listing: item
  });
};


/* =========================================================
   CREATE LISTING
========================================================= */

exports.create = async (req, res) => {
  const {
    title,
    description,
    price,
    category,
    subcategory,
    condition,
    location
  } = req.body || {};

  if (
    !title?.trim() ||
    !description?.trim() ||
    price === undefined ||
    !category ||
    !condition ||
    !location?.trim()
  ) {
    return fail(
      res,
      'Title, description, price, category, condition and location are required'
    );
  }

  if (
    !mongoose.isValidObjectId(
      category
    )
  ) {
    return fail(
      res,
      'Invalid category',
      400
    );
  }

  if (
    !Number.isFinite(
      Number(price)
    ) ||
    Number(price) < 0
  ) {
    return fail(
      res,
      'Price must be a valid non-negative number'
    );
  }

  const images =
    (req.files || []).map(
      (file) =>
        `${base(req)}/uploads/${file.filename}`
    );

  const item =
    await Listing.create({
      title: title.trim(),

      description:
        description.trim(),

      price: Number(price),

      category,

      subcategory:
        subcategory || '',

      condition,

      location:
        location.trim(),

      seller:
        req.user._id,

      images,

      status: 'pending'
    });

  return ok(
    res,
    {
      listing: item
    },
    'Listing submitted for approval',
    201
  );
};


/* =========================================================
   UPDATE LISTING
========================================================= */

exports.update = async (req, res) => {
  if (
    !mongoose.isValidObjectId(
      req.params.id
    )
  ) {
    return fail(
      res,
      'Invalid listing id'
    );
  }

  const item =
    await Listing.findById(
      req.params.id
    );

  if (!item) {
    return fail(
      res,
      'Listing not found',
      404
    );
  }

  if (
    String(item.seller) !==
      String(req.user._id) &&
    req.user.role !== 'admin'
  ) {
    return fail(
      res,
      'You cannot edit this listing',
      403
    );
  }

  const changes = pick(
    req.body || {},
    editableFields
  );

  if (
    changes.category &&
    !mongoose.isValidObjectId(
      changes.category
    )
  ) {
    return fail(
      res,
      'Invalid category'
    );
  }

  if (
    changes.price !== undefined &&
    (
      !Number.isFinite(
        Number(changes.price)
      ) ||
      Number(changes.price) < 0
    )
  ) {
    return fail(
      res,
      'Price must be a valid non-negative number'
    );
  }

  Object.assign(
    item,
    changes
  );

  if (req.files?.length) {
    item.images =
      req.files.map(
        (file) =>
          `${base(req)}/uploads/${file.filename}`
      );
  }

  /*
   * Normal sellers editing an active listing
   * must send it back for approval.
   *
   * Admin edits do not change status.
   */
  if (
    req.user.role !== 'admin'
  ) {
    item.status = 'pending';
  }

  await item.save();

  return ok(
    res,
    {
      listing: item
    },
    'Listing updated'
  );
};


/* =========================================================
   DELETE LISTING
========================================================= */

exports.remove = async (req, res) => {
  if (
    !mongoose.isValidObjectId(
      req.params.id
    )
  ) {
    return fail(
      res,
      'Invalid listing id'
    );
  }

  const item =
    await Listing.findById(
      req.params.id
    );

  if (!item) {
    return fail(
      res,
      'Listing not found',
      404
    );
  }

  const isOwner =
    String(item.seller) ===
    String(req.user._id);

  const isAdmin =
    req.user.role === 'admin';

  /*
   * Seller can delete their own listing.
   */
  if (isOwner && !isAdmin) {
    const listingTitle =
      item.title;

    const listingId =
      item._id;

    await item.deleteOne();

    return ok(
      res,
      null,
      'Listing deleted'
    );
  }

  /*
   * Admin deletion is ONLY allowed
   * for sold listings.
   */
  if (isAdmin) {
    if (item.status !== 'sold') {
      return fail(
        res,
        'Admin can delete only sold listings'
      );
    }

    const sellerId =
      item.seller;

    const listingId =
      item._id;

    const listingTitle =
      item.title;

    await item.deleteOne();

    /*
     * Notify seller after successful deletion.
     */
    try {
      await notifyListingDeleted({
        sellerId,
        listingId,
        listingTitle
      });
    } catch (error) {
      console.error(
        'Failed to create listing deleted notification:',
        error
      );
    }

    return ok(
      res,
      null,
      'Sold listing deleted by admin'
    );
  }

  return fail(
    res,
    'Forbidden',
    403
  );
};


/* =========================================================
   MY LISTINGS
========================================================= */

exports.my = async (req, res) => {
  const listings =
    await Listing.find({
      seller: req.user._id
    })
      .populate(
        'category',
        'name'
      )
      .sort({
        createdAt: -1
      });

  return ok(res, {
    listings
  });
};


/* =========================================================
   MARK LISTING AS SOLD
========================================================= */

exports.markSold = async (req, res) => {
  if (
    !mongoose.isValidObjectId(
      req.params.id
    )
  ) {
    return fail(
      res,
      'Invalid listing id'
    );
  }

  const item =
    await Listing.findById(
      req.params.id
    );

  if (!item) {
    return fail(
      res,
      'Listing not found',
      404
    );
  }

  if (
    String(item.seller) !==
    String(req.user._id)
  ) {
    return fail(
      res,
      'Forbidden',
      403
    );
  }

  if (
    item.status !== 'active'
  ) {
    return fail(
      res,
      'Only active listings can be marked as sold'
    );
  }

  item.status = 'sold';

  await item.save();

  /*
   * THIS WAS MISSING BEFORE.
   *
   * The seller gets a notification after
   * the listing has successfully become sold.
   */
  try {
    await notifyListingSold({
      sellerId: item.seller,
      listingId: item._id,
      listingTitle: item.title
    });
  } catch (error) {
    console.error(
      'Failed to create sold notification:',
      error
    );
  }

  return ok(
    res,
    {
      listing: item
    },
    'Marked as sold'
  );
};


/* =========================================================
   REPOST
========================================================= */

exports.repost = async (req, res) => {
  if (
    !mongoose.isValidObjectId(
      req.params.id
    )
  ) {
    return fail(
      res,
      'Invalid listing id'
    );
  }

  const item =
    await Listing.findById(
      req.params.id
    );

  if (!item) {
    return fail(
      res,
      'Listing not found',
      404
    );
  }

  if (
    String(item.seller) !==
    String(req.user._id)
  ) {
    return fail(
      res,
      'Forbidden',
      403
    );
  }

  if (
    ![
      'sold',
      'expired',
      'rejected'
    ].includes(item.status)
  ) {
    return fail(
      res,
      'This listing cannot be reposted yet'
    );
  }

  item.status = 'pending';
  item.createdAt = new Date();

  await item.save();

  return ok(
    res,
    {
      listing: item
    },
    'Listing submitted for repost approval'
  );
};


/* =========================================================
   ADMIN APPROVE
========================================================= */

exports.approve = async (req, res) => {
  if (
    !mongoose.isValidObjectId(
      req.params.id
    )
  ) {
    return fail(
      res,
      'Invalid listing id'
    );
  }

  const item =
    await Listing.findById(
      req.params.id
    );

  if (!item) {
    return fail(
      res,
      'Listing not found',
      404
    );
  }

  item.status = 'active';

  item.expiresAt =
    new Date(
      Date.now() +
        30 *
          24 *
          60 *
          60 *
          1000
    );

  await item.save();

  try {
    await notifyListingApproved({
      sellerId: item.seller,
      listingId: item._id,
      listingTitle: item.title
    });
  } catch (error) {
    console.error(
      'Failed to create approval notification:',
      error
    );
  }

  return ok(
    res,
    {
      listing: item
    },
    'Listing approved'
  );
};


/* =========================================================
   ADMIN REJECT
========================================================= */

exports.reject = async (req, res) => {
  if (
    !mongoose.isValidObjectId(
      req.params.id
    )
  ) {
    return fail(
      res,
      'Invalid listing id'
    );
  }

  const item =
    await Listing.findById(
      req.params.id
    );

  if (!item) {
    return fail(
      res,
      'Listing not found',
      404
    );
  }

  item.status = 'rejected';

  await item.save();

  try {
    await notifyListingRejected({
      sellerId: item.seller,
      listingId: item._id,
      listingTitle: item.title
    });
  } catch (error) {
    console.error(
      'Failed to create rejection notification:',
      error
    );
  }

  return ok(
    res,
    {
      listing: item
    },
    'Listing rejected'
  );
};


/* =========================================================
   ADMIN LIST
========================================================= */

exports.adminList = async (req, res) => {
  const listings =
    await Listing.find()
      .populate(
        'category',
        'name'
      )
      .populate(
        'seller',
        'name email'
      )
      .sort({
        createdAt: -1
      });

  return ok(res, {
    listings
  });
};