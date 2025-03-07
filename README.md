# Chatbot API

This is a Node.js Express-based chatbot API that interacts with Google's AI models and stores user conversations in MongoDB.

## Features
- User registration with step-by-step information collection (username, email, address, phone).
- Stores and retrieves chat history in MongoDB.
- Uses Google AI (Gemini 1.5 Flash) to generate responses.
- Allows fetching user details by email.

## Installation

1. Clone the repository:
   ```sh
   git clone <repository_url>
   cd <project_directory>
npm install

MONGODB_URL=your_mongodb_connection_string
GOOGLE_API_KEY=your_google_api_key
PORT=5000

npm start



{
  "userId": "unique_user_id",
  "message": "Hello!"
}


{
  "reply": "Hello! How can I help you today?"
}


{
  "userId": "12345",
  "username": "JohnDoe",
  "email": "johndoe@example.com",
  "address": "123 Main St",
  "phone": "1234567890",
  "conversation": [
    { "question": "Hello?", "answer": "Hi! How can I help?" }
  ]
}



Let me know if you need any modifications! 🚀

