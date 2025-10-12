# Firebase Studio

This is a Next.js starter project built in Firebase Studio. To get started, take a look at `src/app/page.tsx`.

## Deployment

This application is configured and optimized for deployment on **Firebase App Hosting**.

### Why Not Vercel or Other Serverless Platforms?

This app uses the local file system as its database (reading and writing to JSON files in the `src/data` directory). Serverless platforms like Vercel have a **read-only file system** in their production environment, which means any attempt by the application to write or update data will fail.

Firebase App Hosting provides a persistent file system that allows this application to function as designed. To deploy, please use the Firebase CLI or connect your repository to Firebase App Hosting.
