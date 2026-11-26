const mongoose = require('mongoose');

const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Listing = require('../models/Listing');
const User = require('../models/User');

const {
  ok,
  fail
} = require('../utils/apiResponse');

const {
  notifyNewMessage
} = require('../services/notificationService');


/* =========================================================
   CHECK CONVERSATION MEMBER
========================================================= */

const member = (
  conversation,
  userId
) =>
  [
    String(conversation.buyer),
    String(conversation.seller)
  ].includes(String(userId));


/* =========================================================
   LIST CONVERSATIONS
========================================================= */

exports.list = async (req, res) => {
  const conversations =
    await Conversation.find({
      $or: [
        {
          buyer: req.user._id
        },
        {
          seller: req.user._id
        }
      ]
    })
      .populate(
        'buyer',
        'name avatar'
      )
      .populate(
        'seller',
        'name avatar'
      )
      .populate(
        'listing',
        'title images price status'
      )
      .sort({
        updatedAt: -1
      });

  return ok(res, {
    conversations
  });
};


/* =========================================================
   GET MESSAGES
========================================================= */

exports.messages = async (req, res) => {
  if (
    !mongoose.isValidObjectId(
      req.params.id
    )
  ) {
    return fail(
      res,
      'Invalid conversation id'
    );
  }

  const conversation =
    await Conversation.findById(
      req.params.id
    );

  if (!conversation) {
    return fail(
      res,
      'Conversation not found',
      404
    );
  }

  if (
    !member(
      conversation,
      req.user._id
    )
  ) {
    return fail(
      res,
      'Forbidden',
      403
    );
  }

  await Message.updateMany(
    {
      conversation:
        conversation._id,

      sender: {
        $ne: req.user._id
      },

      read: false
    },
    {
      $set: {
        read: true
      }
    }
  );

  const messages =
    await Message.find({
      conversation:
        conversation._id
    })
      .populate(
        'sender',
        'name avatar'
      )
      .sort({
        createdAt: 1
      });

  return ok(res, {
    messages
  });
};


/* =========================================================
   SEND MESSAGE
========================================================= */

exports.send = async (req, res) => {
  try {

    /* -----------------------------------------------------
       VALIDATE CONVERSATION ID
    ----------------------------------------------------- */

    if (
      !mongoose.isValidObjectId(
        req.params.id
      )
    ) {
      return fail(
        res,
        'Invalid conversation id'
      );
    }


    /* -----------------------------------------------------
       VALIDATE MESSAGE
    ----------------------------------------------------- */

    const text =
      String(
        req.body?.text || ''
      ).trim();

    if (!text) {
      return fail(
        res,
        'Message cannot be empty'
      );
    }

    if (text.length > 2000) {
      return fail(
        res,
        'Message is too long'
      );
    }


    /* -----------------------------------------------------
       FIND CONVERSATION
    ----------------------------------------------------- */

    const conversation =
      await Conversation.findById(
        req.params.id
      );

    if (!conversation) {
      return fail(
        res,
        'Conversation not found',
        404
      );
    }


    /* -----------------------------------------------------
       CHECK USER IS MEMBER
    ----------------------------------------------------- */

    if (
      !member(
        conversation,
        req.user._id
      )
    ) {
      return fail(
        res,
        'Forbidden',
        403
      );
    }


    /* -----------------------------------------------------
       SAVE MESSAGE
    ----------------------------------------------------- */

    const message =
      await Message.create({
        conversation:
          conversation._id,

        sender:
          req.user._id,

        text
      });


    /* -----------------------------------------------------
       UPDATE LAST MESSAGE
    ----------------------------------------------------- */

    conversation.lastMessage =
      text;

    await conversation.save();


    /* -----------------------------------------------------
       FIND RECEIVER
    ----------------------------------------------------- */

    const currentUserId =
      String(req.user._id);

    const buyerId =
      String(conversation.buyer);

    const sellerId =
      String(conversation.seller);

    let receiverId;

    if (
      currentUserId === buyerId
    ) {
      receiverId =
        conversation.seller;
    } else {
      receiverId =
        conversation.buyer;
    }


    /* -----------------------------------------------------
       GET SENDER NAME
    ----------------------------------------------------- */

    const sender =
      await User.findById(
        req.user._id
      ).select('name');

    const senderName =
      sender?.name || 'Someone';


    /* -----------------------------------------------------
       DEBUG LOG
    ----------------------------------------------------- */

    console.log('');
    console.log(
      '========================================'
    );
    console.log(
      'MESSAGE NOTIFICATION'
    );
    console.log(
      'Sender:',
      currentUserId
    );
    console.log(
      'Sender Name:',
      senderName
    );
    console.log(
      'Receiver:',
      String(receiverId)
    );
    console.log(
      'Conversation:',
      String(conversation._id)
    );
    console.log(
      'Listing:',
      String(conversation.listing)
    );
    console.log(
      'Message:',
      text
    );
    console.log(
      '========================================'
    );


    /* -----------------------------------------------------
       CREATE NOTIFICATION
    ----------------------------------------------------- */

    try {

      const notification =
        await notifyNewMessage({
          receiverId:
            receiverId,

          senderName:
            senderName,

          conversationId:
            conversation._id,

          listingId:
            conversation.listing
        });

      console.log(
        'MESSAGE NOTIFICATION CREATED:',
        notification?._id
      );

    } catch (notificationError) {

      console.error(
        'MESSAGE NOTIFICATION ERROR:',
        notificationError
      );

    }


    /* -----------------------------------------------------
       POPULATE MESSAGE
    ----------------------------------------------------- */

    const populated =
      await message.populate(
        'sender',
        'name avatar'
      );


    /* -----------------------------------------------------
       RESPONSE
    ----------------------------------------------------- */

    return ok(
      res,
      {
        message: populated
      },
      'Message sent',
      201
    );

  } catch (error) {

    console.error(
      'SEND MESSAGE ERROR:',
      error
    );

    return fail(
      res,
      error.message ||
        'Failed to send message',
      500
    );
  }
};


/* =========================================================
   START CONVERSATION
========================================================= */

exports.start = async (req, res) => {

  if (
    !mongoose.isValidObjectId(
      req.body?.listing
    )
  ) {
    return fail(
      res,
      'Invalid listing id'
    );
  }


  const listing =
    await Listing.findById(
      req.body.listing
    ).populate(
      'seller',
      'name avatar'
    );


  if (!listing) {
    return fail(
      res,
      'Listing not found',
      404
    );
  }


  if (
    listing.status !== 'active'
  ) {
    return fail(
      res,
      'You can only chat about an active listing'
    );
  }


  if (
    String(listing.seller._id) ===
    String(req.user._id)
  ) {
    return fail(
      res,
      'You cannot chat with yourself'
    );
  }


  let conversation =
    await Conversation.findOne({
      listing:
        listing._id,

      buyer:
        req.user._id,

      seller:
        listing.seller._id
    });


  let created = false;


  if (!conversation) {

    conversation =
      await Conversation.create({
        listing:
          listing._id,

        buyer:
          req.user._id,

        seller:
          listing.seller._id
      });

    created = true;
  }


  await conversation.populate([
    {
      path: 'buyer',
      select: 'name avatar'
    },
    {
      path: 'seller',
      select: 'name avatar'
    },
    {
      path: 'listing',
      select:
        'title images price status'
    }
  ]);


  return ok(
    res,
    {
      conversation
    },
    created
      ? 'Conversation created'
      : 'Conversation ready',
    created
      ? 201
      : 200
  );
};