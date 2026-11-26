const User = require('../models/User');
const Listing = require('../models/Listing');
const Report = require('../models/Report');
const Category = require('../models/Category');

const { ok, fail } = require('../utils/apiResponse');

/*
|--------------------------------------------------------------------------
| DASHBOARD STATISTICS
|--------------------------------------------------------------------------
*/

exports.stats = async (req, res) => {
  const [
    users,
    listings,
    active,
    pending,
    sold,
    rejected,
    reports,
    categories
  ] = await Promise.all([
    User.countDocuments(),
    Listing.countDocuments(),
    Listing.countDocuments({ status: 'active' }),
    Listing.countDocuments({ status: 'pending' }),
    Listing.countDocuments({ status: 'sold' }),
    Listing.countDocuments({ status: 'rejected' }),
    Report.countDocuments({ status: 'open' }),
    Category.countDocuments()
  ]);

  ok(res, {
    stats: {
      users,
      listings,
      active,
      pending,
      sold,
      rejected,
      reports,
      categories
    }
  });
};

/*
|--------------------------------------------------------------------------
| USER MANAGEMENT
|--------------------------------------------------------------------------
*/

/*
 * GET /api/admin/users
 */
exports.users = async (req, res) => {
  try {
    const {
      search = '',
      status,
      role,
      page = 1,
      limit = 20
    } = req.query;

    const filter = {};

    const searchText = String(search || '').trim();

    if (searchText) {
      filter.$or = [
        {
          name: {
            $regex: searchText,
            $options: 'i'
          }
        },
        {
          email: {
            $regex: searchText,
            $options: 'i'
          }
        },
        {
          phone: {
            $regex: searchText,
            $options: 'i'
          }
        }
      ];
    }

    if (status) {
      filter.status = status;
    }

    if (role) {
      filter.role = role;
    }

    const p = Math.max(1, Number(page) || 1);
    const l = Math.min(
      100,
      Math.max(1, Number(limit) || 20)
    );

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip((p - 1) * l)
        .limit(l),

      User.countDocuments(filter)
    ]);

    ok(res, {
      users,
      total,
      page: p,
      pages: Math.ceil(total / l)
    });
  } catch (error) {
    console.error('Admin users error:', error);
    fail(res, 'Could not load users', 500);
  }
};

/*
 * GET /api/admin/users/:id
 */
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password');

    if (!user) {
      return fail(res, 'User not found', 404);
    }

    const listings = await Listing.find({
      seller: user._id
    })
      .populate('category', 'name')
      .sort({ createdAt: -1 });

    ok(res, {
      user,
      listings
    });
  } catch (error) {
    console.error('Get admin user error:', error);
    fail(res, 'Could not load user', 500);
  }
};

/*
 * PATCH /api/admin/users/:id/suspend
 */
exports.suspendUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return fail(res, 'User not found', 404);
    }

    if (String(user._id) === String(req.user._id)) {
      return fail(
        res,
        'You cannot suspend your own account',
        400
      );
    }

    if (user.role === 'admin') {
      return fail(
        res,
        'Admin accounts cannot be suspended',
        400
      );
    }

    user.status = 'suspended';

    await user.save();

    ok(
      res,
      {
        user: {
          id: String(user._id),
          name: user.name,
          email: user.email,
          status: user.status
        }
      },
      'User suspended'
    );
  } catch (error) {
    console.error('Suspend user error:', error);
    fail(res, 'Could not suspend user', 500);
  }
};

/*
 * PATCH /api/admin/users/:id/activate
 */
exports.activateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return fail(res, 'User not found', 404);
    }

    user.status = 'active';

    await user.save();

    ok(
      res,
      {
        user: {
          id: String(user._id),
          name: user.name,
          email: user.email,
          status: user.status
        }
      },
      'User activated'
    );
  } catch (error) {
    console.error('Activate user error:', error);
    fail(res, 'Could not activate user', 500);
  }
};

/*
 * DELETE /api/admin/users/:id
 */
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return fail(res, 'User not found', 404);
    }

    if (String(user._id) === String(req.user._id)) {
      return fail(
        res,
        'You cannot delete your own admin account',
        400
      );
    }

    if (user.role === 'admin') {
      return fail(
        res,
        'Admin accounts cannot be deleted',
        400
      );
    }

    await Listing.deleteMany({
      seller: user._id
    });

    await user.deleteOne();

    ok(res, null, 'User deleted');
  } catch (error) {
    console.error('Delete user error:', error);
    fail(res, 'Could not delete user', 500);
  }
};

/*
|--------------------------------------------------------------------------
| CATEGORY MANAGEMENT
|--------------------------------------------------------------------------
*/

/*
 * GET /api/admin/categories
 */
exports.categories = async (req, res) => {
  try {
    const categories = await Category.find()
      .sort({ name: 1 });

    ok(res, {
      categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    fail(res, 'Could not load categories', 500);
  }
};

/*
 * GET /api/admin/categories/:id
 */
exports.getCategory = async (req, res) => {
  try {
    const category = await Category.findById(
      req.params.id
    );

    if (!category) {
      return fail(res, 'Category not found', 404);
    }

    ok(res, {
      category
    });
  } catch (error) {
    console.error('Get category error:', error);
    fail(res, 'Could not load category', 500);
  }
};

/*
 * POST /api/admin/categories
 */
exports.createCategory = async (req, res) => {
  try {
    const {
      name,
      icon,
      subcategories,
      active
    } = req.body || {};

    if (!name?.trim()) {
      return fail(
        res,
        'Category name is required'
      );
    }

    const finalName = name.trim();

    const existing = await Category.findOne({
      name: finalName
    });

    if (existing) {
      return fail(
        res,
        'Category already exists',
        409
      );
    }

    let finalSubcategories = [];

    if (Array.isArray(subcategories)) {
      finalSubcategories = subcategories
        .map((item) => String(item).trim())
        .filter(Boolean);
    }

    const category = await Category.create({
      name: finalName,
      icon: icon?.trim() || 'tag',
      subcategories: finalSubcategories,
      active: active !== undefined
        ? Boolean(active)
        : true
    });

    ok(
      res,
      {
        category
      },
      'Category created',
      201
    );
  } catch (error) {
    console.error('Create category error:', error);

    if (error.code === 11000) {
      return fail(
        res,
        'Category already exists',
        409
      );
    }

    fail(
      res,
      'Could not create category',
      500
    );
  }
};

/*
 * PUT /api/admin/categories/:id
 */
exports.updateCategory = async (req, res) => {
  try {
    const category = await Category.findById(
      req.params.id
    );

    if (!category) {
      return fail(
        res,
        'Category not found',
        404
      );
    }

    const {
      name,
      icon,
      subcategories,
      active
    } = req.body || {};

    if (name !== undefined) {
      if (!String(name).trim()) {
        return fail(
          res,
          'Category name cannot be empty'
        );
      }

      category.name = String(name).trim();
    }

    if (icon !== undefined) {
      category.icon =
        String(icon).trim() || 'tag';
    }

    if (subcategories !== undefined) {
      if (!Array.isArray(subcategories)) {
        return fail(
          res,
          'Subcategories must be an array'
        );
      }

      category.subcategories = subcategories
        .map((item) => String(item).trim())
        .filter(Boolean);
    }

    if (active !== undefined) {
      category.active = Boolean(active);
    }

    const duplicate = await Category.findOne({
      _id: {
        $ne: category._id
      },
      name: category.name
    });

    if (duplicate) {
      return fail(
        res,
        'Another category already uses this name',
        409
      );
    }

    await category.save();

    ok(
      res,
      {
        category
      },
      'Category updated'
    );
  } catch (error) {
    console.error('Update category error:', error);

    if (error.code === 11000) {
      return fail(
        res,
        'Another category already uses this name',
        409
      );
    }

    fail(
      res,
      'Could not update category',
      500
    );
  }
};

/*
 * PATCH /api/admin/categories/:id/toggle
 */
exports.toggleCategory = async (req, res) => {
  try {
    const category = await Category.findById(
      req.params.id
    );

    if (!category) {
      return fail(
        res,
        'Category not found',
        404
      );
    }

    category.active = !category.active;

    await category.save();

    ok(
      res,
      {
        category
      },
      category.active
        ? 'Category activated'
        : 'Category deactivated'
    );
  } catch (error) {
    console.error('Toggle category error:', error);
    fail(
      res,
      'Could not change category status',
      500
    );
  }
};

/*
 * DELETE /api/admin/categories/:id
 */
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(
      req.params.id
    );

    if (!category) {
      return fail(
        res,
        'Category not found',
        404
      );
    }

    const listingCount =
      await Listing.countDocuments({
        category: category._id
      });

    if (listingCount > 0) {
      return fail(
        res,
        `Cannot delete this category because ${listingCount} listing(s) use it`
      );
    }

    await category.deleteOne();

    ok(
      res,
      null,
      'Category deleted'
    );
  } catch (error) {
    console.error('Delete category error:', error);
    fail(
      res,
      'Could not delete category',
      500
    );
  }
};

/*
|--------------------------------------------------------------------------
| LISTING MANAGEMENT
|--------------------------------------------------------------------------
*/

/*
 * GET /api/admin/listings
 */
exports.listings = async (req, res) => {
  try {
    const {
      status,
      search = '',
      page = 1,
      limit = 20
    } = req.query;

    const filter = {};

    if (status) {
      filter.status = status;
    }

    const searchText = String(search || '').trim();

    if (searchText) {
      filter.$or = [
        {
          title: {
            $regex: searchText,
            $options: 'i'
          }
        },
        {
          location: {
            $regex: searchText,
            $options: 'i'
          }
        }
      ];
    }

    const p = Math.max(
      1,
      Number(page) || 1
    );

    const l = Math.min(
      100,
      Math.max(
        1,
        Number(limit) || 20
      )
    );

    const [listings, total] =
      await Promise.all([
        Listing.find(filter)
          .populate(
            'category',
            'name'
          )
          .populate(
            'seller',
            'name email phone'
          )
          .sort({
            createdAt: -1
          })
          .skip((p - 1) * l)
          .limit(l),

        Listing.countDocuments(filter)
      ]);

    ok(res, {
      listings,
      total,
      page: p,
      pages: Math.ceil(total / l)
    });
  } catch (error) {
    console.error('Admin listings error:', error);
    fail(
      res,
      'Could not load listings',
      500
    );
  }
};