const express = require("express");
const cors = require("cors");
const axios = require("axios");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

let GOOGLE_API_KEY ="AIzaSyCBunP29P7VmCdVueczOaqifS3XF5j8DmM";
const GOOGLE_AI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GOOGLE_API_KEY}`;

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// Define Chat Schema
const chatSchema = new mongoose.Schema({
  userId: String,
  username: String,
  email: String,
  address: String,
  phone: String,
  conversation: [
    {
      question: String,
      answer: String,
      timestamp: { type: Date, default: Date.now },
    },
  ],
  registrationStep: { type: Number, default: 0 },
});
const Chat = mongoose.model("Chat", chatSchema);

// Load company context
const contextData = require("./company_data.json");
const companyInfo = contextData.companyInfo;

const companyContext = `
Company Name: ${companyInfo.name}
Description: ${companyInfo.description}
Location: ${companyInfo.location}
Services: ${companyInfo.services.join(", ")}
Mission: ${companyInfo.mission}
Established: ${companyInfo.established}
Founders:
${companyInfo.founders.map((f) => `${f.name} - ${f.position}`).join("\n")}
Contact: 
Email - ${companyInfo.contact.email}, 
Phone - ${companyInfo.contact.phone}
Social Media:
LinkedIn - ${companyInfo.socialMedia.linkedin}
Facebook - ${companyInfo.socialMedia.facebook}
`;

const registrationQuestions = [
  "Please provide your username:",
  "Please provide your email:",
  "Please provide your address:",
  "Please provide your phone number:",
];

// Handle Chat Requests
app.post("/chat", async (req, res) => {
  try {
    const { userId, message } = req.body;
    let userChat = await Chat.findOne({ userId });

    // If new user, start registration
    if (!userChat) {
      userChat = new Chat({ userId, registrationStep: 0, conversation: [] });
      await userChat.save();
      return res.json({ reply: registrationQuestions[0] });
    }

    // If user is still in registration
    if (userChat.registrationStep < registrationQuestions.length) {
      switch (userChat.registrationStep) {
        case 0:
          userChat.username = message;
          break;
        case 1:
          userChat.email = message;
          break;
        case 2:
          userChat.address = message;
          break;
        case 3:
          userChat.phone = message;
          break;
      }
      userChat.registrationStep++;
      await userChat.save();

      if (userChat.registrationStep < registrationQuestions.length) {
        return res.json({ reply: registrationQuestions[userChat.registrationStep] });
      }
    }

    // Generate conversation history
    const previousConversations = userChat.conversation
      .map((entry) => `User: ${entry.question}\nAI: ${entry.answer}`)
      .join("\n");

    const fullMessage = `${companyContext}\n\nPrevious Conversation:\n${previousConversations}\n\nUser: ${message}`;

    // Send request to Google AI
    const response = await axios.post(GOOGLE_AI_URL, {
      contents: [{ role: "user", parts: [{ text: fullMessage }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 200 },
    });

    const aiReply = response.data.candidates[0].content.parts[0].text;

    // Save chat history
    userChat.conversation.push({ question: message, answer: aiReply });
    await userChat.save();

    res.json({ reply: aiReply });
  } catch (error) {
    console.error("Google AI API Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Fetch user info by email
app.get("/user/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const userChat = await Chat.findOne({ email });
    
    if (!userChat) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(userChat);
  } catch (error) {
    console.error("Error fetching user info:", error.message);
    res.status(500).json({ error: "Something went wrong" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
