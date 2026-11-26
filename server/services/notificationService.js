const Notification = require('../models/Notification');


/* =========================================================
   BASE NOTIFICATION CREATOR
========================================================= */

async function createNotification(
  user,
  type,
  title,
  message,
  data = {}
) {
  if (!user) {
    return null;
  }

  try {
    return await Notification.create({
      user,
      type,
      title,
      message,
      data
    });
  } catch (error) {
    console.error(
      'Notification creation failed:',
      error
    );

    return null;
  }
}


/* =========================================================
   NEW MESSAGE
========================================================= */

async function notifyNewMessage({
  receiverId,
  senderName,
  conversationId,
  listingId
}) {
  return createNotification(
    receiverId,
    'message',
    'New message',
    `${senderName} sent you a new message.`,
    {
      conversationId,
      listingId
    }
  );
}


/* =========================================================
   LISTING APPROVED
========================================================= */

async function notifyListingApproved({
  sellerId,
  listingId,
  listingTitle
}) {
  return createNotification(
    sellerId,
    'listing_approved',
    'Listing approved',
    `"${listingTitle}" has been approved and is now live.`,
    {
      listingId,
      status: 'approved'
    }
  );
}


/* =========================================================
   LISTING REJECTED
========================================================= */

async function notifyListingRejected({
  sellerId,
  listingId,
  listingTitle
}) {
  return createNotification(
    sellerId,
    'listing_rejected',
    'Listing rejected',
    `"${listingTitle}" was rejected by the admin.`,
    {
      listingId,
      status: 'rejected'
    }
  );
}


/* =========================================================
   FAVORITE
========================================================= */

async function notifyFavorite({
  sellerId,
  listingId,
  listingTitle
}) {
  return createNotification(
    sellerId,
    'favorite',
    'Someone favorited your listing',
    `"${listingTitle}" was added to someone's favorites.`,
    {
      listingId
    }
  );
}


/* =========================================================
   REPORT
========================================================= */

async function notifyReport({
  sellerId,
  listingId,
  listingTitle,
  reportId
}) {
  return createNotification(
    sellerId,
    'report',
    'Your listing was reported',
    `"${listingTitle}" has received a report.`,
    {
      listingId,
      reportId
    }
  );
}


/* =========================================================
   LISTING SOLD
========================================================= */

async function notifyListingSold({
  sellerId,
  listingId,
  listingTitle
}) {
  return createNotification(
    sellerId,
    'listing_sold',
    'Listing sold',
    `"${listingTitle}" has been marked as sold.`,
    {
      listingId,
      status: 'sold'
    }
  );
}


/* =========================================================
   LISTING DELETED BY ADMIN
========================================================= */

async function notifyListingDeleted({
  sellerId,
  listingId,
  listingTitle
}) {
  return createNotification(
    sellerId,
    'listing_deleted',
    'Listing deleted',
    `"${listingTitle}" was removed by the administrator.`,
    {
      listingId,
      status: 'deleted'
    }
  );
}


module.exports = {
  createNotification,
  notifyNewMessage,
  notifyListingApproved,
  notifyListingRejected,
  notifyFavorite,
  notifyReport,
  notifyListingSold,
  notifyListingDeleted
};