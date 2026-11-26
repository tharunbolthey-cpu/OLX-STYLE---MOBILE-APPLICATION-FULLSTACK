# Marketly — Expo + React Native + Node.js Marketplace

This version is **mobile-only**. The old Next.js `web/` application has been removed.

## Stack

- Expo SDK 57
- React 19.2.3
- React Native 0.86.3
- Expo Router
- TypeScript
- Node.js + Express 5
- MongoDB + Mongoose
- JWT authentication
- Multer image uploads
- Socket.IO real-time chat
- SecureStore for the mobile JWT

Expo SDK 57 officially targets React Native 0.86 and requires Node.js 22.13.x or newer. The project uses Expo 57.0.17 / React Native 0.86.3 because Expo documents fixes in later SDK 57 patch releases. See the official SDK 57 changelog for upgrade details.

## Project structure

```text
marketly/
├── mobile/                 # Expo React Native app — Android/iOS only
│   ├── app/                # Expo Router routes
│   ├── components/
│   ├── context/
│   ├── services/
│   ├── types/
│   └── package.json
├── server/                 # Node.js REST + Socket.IO backend
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── uploads/
│   └── package.json
└── README.md
```

## 1. Backend setup

```bash
cd server
npm install
```

Create `.env` from `.env.example` and set:

```env
PORT=5000
HOST=0.0.0.0
MONGODB_URI = mongodb://127.0.0.1:27017/marketly
JWT_SECRET = use-a-long-random-secret

ADMIN_EMAIL = admin@marketly.com
ADMIN_PASSWORD = Admin@12345
ADMIN_PHONE = 9999999999

DEMO-USERS:-
USER_EMAIL = tharunbolthey@gmail.com @ pavan@gmail.com
USER_PASSWORD = 123123 @ 123123

used for location : https://nominatim.openstreetmap.org/search

```

Seed categories and the optional admin account:

```bash
npm run seed
```

Start the API:

```bash
npm run dev
```

Health check:

```text
GET http://localhost:5000/api/health
```

## 2. Mobile setup

Use Node.js 22.13+.

```bash
cd mobile
npm install
```

Create `.env` from `.env.example`.

### Android emulator

```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:5000/api
EXPO_PUBLIC_SOCKET_URL=http://10.0.2.2:5000
```

### Physical Android/iPhone

Replace `10.0.2.2` with your computer's LAN IP, for example:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.10:5000/api
EXPO_PUBLIC_SOCKET_URL=http://192.168.1.10:5000
```

Make sure the phone and computer are on the same network and Windows Firewall allows port 5000.

Start Expo:

```bash
npm start
```

Android:

```bash
npm run android
```

## Main mobile routes

- Authentication: login, register
- Home marketplace
- Categories
- Search and sorting
- Listing details
- Create listing with up to 8 images
- Edit listing
- My listings
- Favorites
- Seller profile
- Buyer/seller chat
- Real-time Socket.IO messages
- Notifications
- Reports
- Profile/settings

## Backend API groups

- `/api/auth`
- `/api/listings`
- `/api/categories`
- `/api/favorites`
- `/api/users`
- `/api/conversations`
- `/api/notifications`
- `/api/reports`
- `/api/uploads`
- `/api/admin`
- `/api/health`
used for location : https://nominatim.openstreetmap.org/search

## Important validation

The backend validates ownership, roles, listing status, ObjectIds, prices, message length, image type/size, duplicate favorites and report status. Listing updates are also field-whitelisted so a normal user cannot modify seller, role, views or approval status.

## Verification

The packaged server JavaScript has been syntax-checked. A full `npm install` / Expo Doctor / device build still needs to be run in your own environment because this workspace cannot reliably download the complete npm dependency tree or connect to your MongoDB instance.
