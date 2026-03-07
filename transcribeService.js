import { createClient } from "@deepgram/sdk";
import dotenv from "dotenv";
dotenv.config();

const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

export async function transcribeAudioStream(audioChunks) {
  try {
    // Combine all audio chunks into one buffer
    const audioBuffer = Buffer.concat(
      audioChunks.map((chunk) =>
        Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
      )
    );

    console.log(`Audio buffer size: ${audioBuffer.length} bytes`);

    if (audioBuffer.length < 1000) {
      console.log("Audio too short, returning empty transcript");
      return "";
    }

    // Send to Deepgram for transcription
    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
      audioBuffer,
      {
        model: "nova-2",        // Best accuracy model
        language: "en-US",
        smart_format: true,     // Adds punctuation automatically
        mimetype: "audio/webm", // ✅ Deepgram handles webm natively
      }
    );

    if (error) {
      throw new Error(`Deepgram error: ${error.message}`);
    }

    const transcript =
      result?.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";

    console.log(`Transcript: "${transcript}"`);
    return transcript;

  } catch (err) {
    console.error("Transcription error:", err.message);
    throw err;
  }
}