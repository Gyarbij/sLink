A simple short link app. You can create your own short link using this app. It uses an in-memory data store. You can also use the API to create, update, delete, and view all short links.

## Features

- Dashboard UI
- API
- Edit/delete short links
- View all short links with click count

## API route (require API KEY)

**⚠ To use this route, create an API key from the redir app that you install...**

- Add this to your request header

  ```header
  "X-Space-App-Key": "<YOUR API KEY>"
  ```

- `POST /api/create` - Create a short link

  ```body
  id: // it will auto generate a id for the short link if you don't provide one,
  original_link: // your long link,
  ```

- `GET /api/list` - Get all short links
- `POST /api/update/:id` - Update a short link

  ```body
  id: // your id,
  original_link: // your long link,
  ```

- `DELETE /api/delete/:id` - Delete a short link
