# Marketly REST API

All protected endpoints use `Authorization: Bearer <JWT>`.

## Auth
- `POST /api/auth/register` body: name, email, phone, password, confirmPassword
- `POST /api/auth/login` body: email, password
- `GET /api/auth/me`

## Listings
- `GET /api/listings?q=&category=&subcategory=&minPrice=&maxPrice=&location=&condition=&datePosted=&sort=&page=&limit=`
- `GET /api/listings/:id`
- `GET /api/listings/mine`
- `POST /api/listings` multipart/form-data with up to 8 `images`
- `PUT /api/listings/:id`
- `DELETE /api/listings/:id`
- `POST /api/listings/:id/sold`
- `POST /api/listings/:id/repost`

## Admin
- `GET /api/admin/stats`
- `GET /api/listings/admin/all`
- `POST /api/listings/:id/approve`
- `POST /api/listings/:id/reject`
- `GET /api/users`
- `POST /api/users/:id/suspend`
- `POST /api/users/:id/activate`
- `DELETE /api/users/:id`
- `GET /api/reports`
- `PUT /api/reports/:id`
