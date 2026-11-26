const mongoose = require('mongoose');

const Report = require('../models/Report');
const Listing = require('../models/Listing');
const Notification = require('../models/Notification');

const { ok, fail } = require('../utils/apiResponse');

exports.create = async (req, res) => {
  try {
    const { listing, reason, description = '' } = req.body || {};

    if (!mongoose.isValidObjectId(listing)) {
      return fail(res, 'Invalid listing id');
    }

    if (!reason) {
      return fail(res, 'Report reason is required');
    }

    const listingExists = await Listing.exists({
      _id: listing
    });

    if (!listingExists) {
      return fail(res, 'Listing not found', 404);
    }

    const report = await Report.create({
      reporter: req.user._id,
      listing,
      reason,
      description: String(description).trim()
    });

    ok(
      res,
      { report },
      'Report submitted',
      201
    );
  } catch (error) {
    console.error('Create report error:', error);
    fail(res, 'Could not submit report', 500);
  }
};

exports.list = async (req, res) => {
  try {
    const reports = await Report.find()
      .populate('reporter', 'name email')
      .populate({
        path: 'listing',
        populate: {
          path: 'seller',
          select: 'name'
        }
      })
      .sort({ createdAt: -1 });

    ok(res, { reports });
  } catch (error) {
    console.error('List reports error:', error);
    fail(res, 'Could not load reports', 500);
  }
};

exports.update = async (req, res) => {
  try {
    const { status } = req.body || {};

    if (!mongoose.isValidObjectId(req.params.id)) {
      return fail(res, 'Invalid report id');
    }

    if (!['open', 'dismissed', 'resolved'].includes(status)) {
      return fail(res, 'Invalid report status');
    }

    const report = await Report.findById(req.params.id);

    if (!report) {
      return fail(res, 'Report not found', 404);
    }

    const oldStatus = report.status;

    report.status = status;

    await report.save();

    /*
     * Notify the reporter when the admin
     * resolves or dismisses the report.
     */
    if (
      status !== oldStatus &&
      ['resolved', 'dismissed'].includes(status)
    ) {
      const listing = await Listing.findById(
        report.listing
      ).select('title');

      const listingTitle =
        listing?.title || 'the reported listing';

      let title;
      let message;

      if (status === 'resolved') {
        title = 'Report Resolved';

        message =
          `Your report about "${listingTitle}" has been reviewed ` +
          `and resolved by our admin team. Thank you for helping ` +
          `keep Marketly safe.`;
      } else {
        title = 'Report Dismissed';

        message =
          `Your report about "${listingTitle}" has been reviewed ` +
          `but no violation was found. Your report has been dismissed.`;
      }

      await Notification.create({
        user: report.reporter,
        type: 'report',
        title,
        message,
        read: false,
        data: {
          reportId: String(report._id),
          listingId: String(report.listing),
          status
        }
      });
    }

    /*
     * Return the updated report.
     */
    const updatedReport = await Report.findById(
      report._id
    )
      .populate('reporter', 'name email')
      .populate({
        path: 'listing',
        populate: {
          path: 'seller',
          select: 'name'
        }
      });

    let responseMessage = 'Report updated';

    if (status === 'resolved') {
      responseMessage =
        'Report resolved and user notified';
    }

    if (status === 'dismissed') {
      responseMessage =
        'Report dismissed and user notified';
    }

    ok(
      res,
      { report: updatedReport },
      responseMessage
    );
  } catch (error) {
    console.error('Update report error:', error);
    fail(res, 'Could not update report', 500);
  }
};