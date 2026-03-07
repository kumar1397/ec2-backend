import express from "express";
import { WebSocketServer } from "ws";
import { createServer } from "http";
import dotenv from "dotenv";
import { getProjectQuestions, saveInterview } from "./dynamoService.js";
import { synthesizeSpeech } from "./pollyService.js";
import { transcribeAudioStream } from "./transcribeService.js";

dotenv.config();

const app = express();
app.use(express.json());

const server = createServer(app);
const wss = new WebSocketServer({ server });

// Health check endpoint
app.get("/health", (req, res) => res.json({ status: "ok" }));

wss.on("connection", (ws) => {
  console.log("Client connected");

  // State for this interview session
  let questions = [];
  let currentIndex = 0;
  let personDetails = {};
  let projectId = "";
  let conversation = [];
  let audioChunks = [];
  let isRecording = false;

  // Helper: send a typed message to the frontend
  function send(type, payload = {}) {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type, ...payload }));
    }
  }

  // Send a question: generate Polly audio + send to frontend
  async function sendQuestion(index) {
    if (index >= questions.length) {
      await finishInterview();
      return;
    }

    const question = questions[index];
    console.log(`Sending question ${index + 1}: ${question}`);

    try {
      const audioBuffer = await synthesizeSpeech(question);
      const audioBase64 = audioBuffer.toString("base64");

      send("question", {
        questionIndex: index,
        totalQuestions: questions.length,
        question,
        audio: audioBase64, // MP3 audio as base64
      });
    } catch (err) {
      console.error("Polly error:", err);
      send("error", { message: "Failed to generate audio for question." });
    }
  }

  // Finalize transcript and save to DynamoDB
  async function finishInterview() {
    try {
      const interviewId = await saveInterview(
        projectId,
        personDetails,
        conversation
      );
      send("interview_complete", {
        interviewId,
        message: "Interview completed successfully!",
      });
      console.log(`Interview saved: ${interviewId}`);
    } catch (err) {
      console.error("Save error:", err);
      send("error", { message: "Failed to save interview." });
    }
  }

  // Process buffered audio through Transcribe
  async function processAudioAnswer() {
    if (audioChunks.length === 0) {
      send("error", { message: "No audio received." });
      return;
    }

    send("transcribing", { message: "Processing your answer..." });

    try {
      const chunks = [...audioChunks];
      audioChunks = [];

      // ✅ Pass raw chunks directly, transcribeService handles conversion
      const transcript = await transcribeAudioStream(chunks);
      const question = questions[currentIndex];

      console.log(`Q: ${question}`);
      console.log(`A: ${transcript}`);

      conversation.push({ question, answer: transcript });
      currentIndex++;

      send("answer_recorded", {
        questionIndex: currentIndex - 1,
        answer: transcript,
      });

      await sendQuestion(currentIndex);
    } catch (err) {
      console.error("Transcribe error:", err);
      send("error", { message: "Failed to transcribe audio." });
    }
  }

  // Handle incoming messages from frontend
  ws.on("message", async (data, isBinary) => {
    // Binary data = audio chunks from microphone
    if (isBinary) {
      if (isRecording) {
        audioChunks.push(data);
      }
      return;
    }

    // Text data = JSON control messages
    try {
      const message = JSON.parse(data.toString());

      switch (message.type) {

        // Frontend sends this to start the interview
        case "start_interview": {
          projectId = message.projectId;
          console.log(`Received start_interview for project: ${projectId}`);
          personDetails = message.personDetails || {};
          currentIndex = 0;
          conversation = [];
          audioChunks = [];

          console.log(`Starting interview for project: ${projectId}`);

          try {
            questions = await getProjectQuestions(projectId);
            send("interview_started", {
              totalQuestions: questions.length,
              message: "Interview started!",
            });
            await sendQuestion(0);
          } catch (err) {
            console.error(err);
            send("error", { message: err.message });
          }
          break;
        }

        // Frontend signals user started speaking
        case "start_recording": {
          isRecording = true;
          audioChunks = [];
          console.log("Recording started");
          break;
        }

        // Frontend signals user stopped speaking
        case "stop_recording": {
          isRecording = false;
          console.log("Recording stopped, processing...");
          await processAudioAnswer();
          break;
        }

        default:
          console.warn("Unknown message type:", message.type);
      }
    } catch (err) {
      console.error("Message parse error:", err);
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });

  ws.on("error", (err) => {
    console.error("WebSocket error:", err);
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});