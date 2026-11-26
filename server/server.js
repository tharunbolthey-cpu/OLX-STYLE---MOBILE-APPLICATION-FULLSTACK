require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');

const connectDB = require('./config/db');

const {
  notFound,
  errorHandler
} = require('./middleware/error');

const User = require('./models/User');
const Conversation = require('./models/Conversation');
const Message = require('./models/Message');

const {
  notifyNewMessage
} = require('./services/notificationService');


/* =========================================================
   EXPRESS APP
========================================================= */

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true
  }
});


/* =========================================================
   SECURITY / MIDDLEWARE
========================================================= */

app.disable('x-powered-by');

app.set('trust proxy', 1);

app.use(
  helmet({
    crossOriginResourcePolicy: false
  })
);

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://10.117.4.199:3000',
  'http://10.117.4.199:3001'
];
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error(`CORS blocked: ${origin}`)
      );
    },
    credentials: true
  })
);
app.use(
  express.json({
    limit: '2mb'
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: '2mb'
  })
);

app.use(cookieParser());

app.use(
  morgan(
    process.env.NODE_ENV === 'production'
      ? 'combined'
      : 'dev'
  )
);


/* =========================================================
   STATIC UPLOADS
========================================================= */

app.use(
  '/uploads',
  express.static(
    path.join(__dirname, 'uploads'),
    {
      maxAge: '7d'
    }
  )
);


/* =========================================================
   API RATE LIMITER
========================================================= */

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api', limiter);


/* =========================================================
   HEALTH CHECK
========================================================= */

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      service: 'marketly-api',
      timestamp: new Date().toISOString()
    }
  });
});


/* =========================================================
   API ROUTES
========================================================= */

app.use(
  '/api/auth',
  require('./routes/auth')
);

app.use(
  '/api/listings',
  require('./routes/listings')
);

app.use(
  '/api/categories',
  require('./routes/categories')
);

app.use(
  '/api/favorites',
  require('./routes/favorites')
);

app.use(
  '/api/users',
  require('./routes/users')
);

app.use(
  '/api/conversations',
  require('./routes/chat')
);

app.use(
  '/api/notifications',
  require('./routes/notifications')
);

app.use(
  '/api/reports',
  require('./routes/reports')
);

app.use(
  '/api/uploads',
  require('./routes/uploads')
);

app.use(
  '/api/admin',
  require('./routes/admin')
);


/* =========================================================
   ERROR HANDLERS
========================================================= */

app.use(notFound);

app.use(errorHandler);


/* =========================================================
   SOCKET.IO AUTHENTICATION
========================================================= */

io.use(async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token;

    if (
      !token ||
      !process.env.JWT_SECRET
    ) {
      return next(
        new Error('Unauthorized')
      );
    }

    const payload =
      jwt.verify(
        token,
        process.env.JWT_SECRET
      );

    const user =
      await User.findById(
        payload.userId
      ).select(
        '_id role status name'
      );

    if (
      !user ||
      user.status === 'suspended'
    ) {
      return next(
        new Error('Unauthorized')
      );
    }

    socket.user = user;

    next();

  } catch (error) {
    console.error(
      'Socket authentication failed:',
      error
    );

    next(
      new Error('Unauthorized')
    );
  }
});


/* =========================================================
   SOCKET.IO CONNECTION
========================================================= */

io.on('connection', (socket) => {

  const userId =
    String(socket.user._id);


  console.log(
    `Socket connected: ${userId}`
  );


  /* =======================================================
     PERSONAL USER ROOM
  ======================================================= */

  socket.join(
    `user:${userId}`
  );


  /* =======================================================
     JOIN CONVERSATION
  ======================================================= */

  socket.on(
    'conversation:join',
    async (conversationId) => {

      try {

        if (!conversationId) {
          return;
        }

        const conversation =
          await Conversation.findById(
            conversationId
          ).select(
            'buyer seller'
          );

        if (!conversation) {
          console.log(
            'Conversation not found:',
            conversationId
          );

          return;
        }

        const isMember = [
          String(conversation.buyer),
          String(conversation.seller)
        ].includes(userId);

        if (!isMember) {
          console.log(
            `Unauthorized conversation join: ${userId}`
          );

          return;
        }

        socket.join(
          `conversation:${conversationId}`
        );

        console.log(
          `User ${userId} joined conversation ${conversationId}`
        );

      } catch (error) {

        console.error(
          'conversation:join error',
          error
        );

      }

    }
  );


  /* =======================================================
     SEND MESSAGE
  ======================================================= */

  socket.on(
    'message:send',
    async (payload = {}) => {

      try {

        /* ---------------------------------------------------
           READ PAYLOAD
        --------------------------------------------------- */

        const conversationId =
          String(
            payload.conversationId || ''
          ).trim();

        const text =
          String(
            payload.text || ''
          ).trim();


        /* ---------------------------------------------------
           VALIDATE MESSAGE
        --------------------------------------------------- */

        if (!conversationId) {

          socket.emit(
            'message:error',
            {
              message:
                'Conversation id is required'
            }
          );

          return;
        }

        if (!text) {

          socket.emit(
            'message:error',
            {
              message:
                'Message cannot be empty'
            }
          );

          return;
        }

        if (text.length > 2000) {

          socket.emit(
            'message:error',
            {
              message:
                'Message is too long'
            }
          );

          return;
        }


        /* ---------------------------------------------------
           VALIDATE CONVERSATION ID
        --------------------------------------------------- */

        const mongoose =
          require('mongoose');

        if (
          !mongoose.isValidObjectId(
            conversationId
          )
        ) {

          socket.emit(
            'message:error',
            {
              message:
                'Invalid conversation id'
            }
          );

          return;
        }


        /* ---------------------------------------------------
           FIND CONVERSATION
        --------------------------------------------------- */

        const conversation =
          await Conversation.findById(
            conversationId
          );

        if (!conversation) {

          socket.emit(
            'message:error',
            {
              message:
                'Conversation not found'
            }
          );

          return;
        }


        /* ---------------------------------------------------
           CHECK CONVERSATION MEMBER
        --------------------------------------------------- */

        const isMember = [
          String(conversation.buyer),
          String(conversation.seller)
        ].includes(userId);

        if (!isMember) {

          socket.emit(
            'message:error',
            {
              message:
                'Forbidden'
            }
          );

          return;
        }


        /* ---------------------------------------------------
           CREATE MESSAGE
        --------------------------------------------------- */

        const message =
          await Message.create({

            conversation:
              conversation._id,

            sender:
              socket.user._id,

            text

          });


        /* ---------------------------------------------------
           UPDATE CONVERSATION
        --------------------------------------------------- */

        conversation.lastMessage =
          text;

        await conversation.save();


        /* ---------------------------------------------------
           FIND RECEIVER
        --------------------------------------------------- */

        const receiverId =
          String(
            conversation.buyer
          ) === userId
            ? conversation.seller
            : conversation.buyer;


        /* ---------------------------------------------------
           SENDER NAME
        --------------------------------------------------- */

        const sender =
          await User.findById(
            socket.user._id
          ).select(
            'name'
          );

        const senderName =
          sender?.name ||
          socket.user.name ||
          'Someone';


        /* ---------------------------------------------------
           CREATE MESSAGE NOTIFICATION
        --------------------------------------------------- */

        try {

          console.log(
            'Creating message notification...'
          );

          console.log(
            'Sender:',
            userId
          );

          console.log(
            'Receiver:',
            String(receiverId)
          );

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


          /* -----------------------------------------------
             NOTIFICATION CREATED
          ------------------------------------------------ */

          if (notification) {

            console.log(
              'Message notification created:',
              notification._id
            );


            /* ---------------------------------------------
               SEND REAL-TIME NOTIFICATION
            --------------------------------------------- */

            io
              .to(
                `user:${String(
                  receiverId
                )}`
              )
              .emit(
                'notification:new',
                notification
              );

          } else {

            console.log(
              'Message notification was not created'
            );

          }

        } catch (
          notificationError
        ) {

          console.error(
            'Message notification error:',
            notificationError
          );

        }


        /* ---------------------------------------------------
           POPULATE MESSAGE SENDER
        --------------------------------------------------- */

        const populated =
          await message.populate(
            'sender',
            'name avatar'
          );


        /* ---------------------------------------------------
           SEND MESSAGE TO BOTH USERS
        --------------------------------------------------- */

        io
          .to(
            `conversation:${conversationId}`
          )
          .emit(
            'message:new',
            populated
          );


        /* ---------------------------------------------------
           LOG SUCCESS
        --------------------------------------------------- */

        console.log(
          `Message sent in conversation ${conversationId}`
        );

      } catch (error) {

        console.error(
          'message:send error:',
          error
        );

        socket.emit(
          'message:error',
          {
            message:
              'Could not send message'
          }
        );

      }

    }
  );


  /* =======================================================
     SOCKET DISCONNECT
  ======================================================= */

  socket.on(
    'disconnect',
    (reason) => {

      console.log(
        `Socket disconnected: ${userId}`,
        reason
      );

    }
  );

});


/* =========================================================
   SERVER CONFIGURATION
========================================================= */

const PORT =
  Number(
    process.env.PORT || 5000
  );

const HOST =
  process.env.HOST ||
  '0.0.0.0';


/* =========================================================
   START SERVER
========================================================= */

async function start() {

  try {

    await connectDB();

    server.listen(
      PORT,
      HOST,
      () => {

        console.log(
          `Marketly API listening on http://${HOST}:${PORT}`
        );

        console.log(
          `Socket.IO enabled`
        );

      }
    );

  } catch (error) {

    console.error(
      'Startup failed:',
      error
    );

    process.exit(1);

  }

}

start();


/* =========================================================
   GRACEFUL SHUTDOWN
========================================================= */

const shutdown =
  async (signal) => {

    console.log(
      `${signal} received. Shutting down...`
    );

    server.close(
      () => {

        console.log(
          'HTTP server closed.'
        );

        process.exit(0);

      }
    );

  };


process.on(
  'SIGINT',
  () => shutdown('SIGINT')
);

process.on(
  'SIGTERM',
  () => shutdown('SIGTERM')
);