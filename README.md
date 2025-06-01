# Your2ndRide Chat Server

This is the WebSocket server for the Your2ndRide application's chat functionality.

## Local Development

1. Install dependencies:
```
npm install
```

2. Start the development server:
```
npm run dev
```

The server will run on port 5000 by default.

## Deployment

This server is configured for deployment on Render.com using the `render.yaml` file.

### Environment Variables

- `NODE_ENV`: Set to "production" for production deployment
- `PORT`: The port the server will run on (provided by Render automatically)
- `CLIENT_URL`: The URL of your frontend application (e.g., https://your2ndride.vercel.app)

## Connecting from the Frontend

In your frontend React application, set the environment variable `VITE_CHAT_SERVER_URL` to the URL of your deployed chat server.
