import { createClient } from "@deepgram/sdk/dist/esm/index.mjs";
import dotenv from "dotenv";
dotenv.config();

const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

export async function transcribeAudioStream(audioChunks) {
  try {
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

    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
      audioBuffer,
      {
        model: "nova-2",
        language: "en-US",
        smart_format: true,
        mimetype: "audio/webm",
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