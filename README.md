# Social Media Application

## Overview
A full-fledged social media application with core features like secure user authentication, tweet posting, liking, commenting, and following. Designed to enhance user engagement and deliver a seamless user experience.

## Features
- **Secure Authentication:** User sign-up and login with password encryption.
- **Tweet Posting:** Users can post tweets with text and media support.
- **Like & Comment:** Users can like and comment on posts.
- **Follow System:** Follow and unfollow users to personalize feeds.
- **Optimized Performance:** Efficient database queries and caching for fast responses.

## Tech Stack
- **Frontend:** React.js, Tailwind CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB
- **Authentication:** JWT (JSON Web Token)

## Installation
### Prerequisites
Ensure you have the following installed on your system:
- Node.js (>=16.0)
- MongoDB
- Git

### Steps to Run Locally
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/social-media-app.git
   cd social-media-app
   ```
2. Install dependencies for both frontend and backend:
   ```bash
   cd backend
   npm install
   cd ../frontend
   npm install
   ```
3. Set up environment variables:
   - Create a `.env` file in the backend directory and add:
     ```env
     MONGO_URI=your_mongodb_connection_string
     JWT_SECRET=your_secret_key
     ```
4. Start the backend server:
   ```bash
   cd backend
   npm start
   ```
5. Start the frontend application:
   ```bash
   cd frontend
   npm start
   ```

## API Endpoints
### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Posts
- `POST /api/posts` - Create a new post
- `GET /api/posts` - Fetch all posts
- `DELETE /api/posts/:id` - Delete a post

### Likes & Comments
- `POST /api/posts/:id/like` - Like a post
- `POST /api/posts/:id/comment` - Comment on a post

### Follow System
- `POST /api/users/:id/follow` - Follow a user
- `POST /api/users/:id/unfollow` - Unfollow a user

## Contributing
Feel free to contribute to this project by following these steps:
1. Fork the repository.
2. Create a new branch.
3. Make your changes and commit.
4. Submit a pull request.

## License
This project is licensed under the MIT License.

## Contact
For any queries, reach out at [rishabhrawat444@gmail.com](mailto:rishabhrawat444@gmail.com)

