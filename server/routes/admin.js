const router = require('express').Router();

const controller = require('../controllers/adminController');

const {
  protect,
  authorize
} = require('../middleware/auth');

/*
|--------------------------------------------------------------------------
| Dashboard
|--------------------------------------------------------------------------
*/

router.get(
  '/stats',
  protect,
  authorize('admin'),
  controller.stats
);

/*
|--------------------------------------------------------------------------
| Users
|--------------------------------------------------------------------------
*/

router.get(
  '/users',
  protect,
  authorize('admin'),
  controller.users
);

router.get(
  '/users/:id',
  protect,
  authorize('admin'),
  controller.getUser
);

router.patch(
  '/users/:id/suspend',
  protect,
  authorize('admin'),
  controller.suspendUser
);

router.patch(
  '/users/:id/activate',
  protect,
  authorize('admin'),
  controller.activateUser
);

router.delete(
  '/users/:id',
  protect,
  authorize('admin'),
  controller.deleteUser
);

/*
|--------------------------------------------------------------------------
| Categories
|--------------------------------------------------------------------------
*/

router.get(
  '/categories',
  protect,
  authorize('admin'),
  controller.categories
);

router.get(
  '/categories/:id',
  protect,
  authorize('admin'),
  controller.getCategory
);

router.post(
  '/categories',
  protect,
  authorize('admin'),
  controller.createCategory
);

router.put(
  '/categories/:id',
  protect,
  authorize('admin'),
  controller.updateCategory
);

router.patch(
  '/categories/:id/toggle',
  protect,
  authorize('admin'),
  controller.toggleCategory
);

router.delete(
  '/categories/:id',
  protect,
  authorize('admin'),
  controller.deleteCategory
);

/*
|--------------------------------------------------------------------------
| Listings
|--------------------------------------------------------------------------
*/

router.get(
  '/listings',
  protect,
  authorize('admin'),
  controller.listings
);

module.exports = router;