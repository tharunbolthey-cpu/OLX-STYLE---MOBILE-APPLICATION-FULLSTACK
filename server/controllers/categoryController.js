const mongoose = require('mongoose');
const Category = require('../models/Category');
const { ok, fail } = require('../utils/apiResponse');

exports.list = async (req, res) => ok(res, {
  categories: await Category.find({ active: true }).sort({ name: 1 })
});

exports.get = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return fail(res, 'Invalid category id');
  const category = await Category.findOne({ _id: req.params.id, active: true });
  if (!category) return fail(res, 'Category not found', 404);
  ok(res, { category });
};
