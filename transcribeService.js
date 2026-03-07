import pkg from "@deepgram/sdk";
const { Deepgram } = pkg;
import dotenv from "dotenv";
dotenv.config();

const deepgram = new Deepgram(process.env.DEEPGRAM_API_KEY);

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

    const response = await deepgram.transcription.preRecorded(
      { buffer: audioBuffer, mimetype: "audio/webm" },
      {
        model: "nova",
        language: "en-US",
        smart_format: true,
      }
    );

    const transcript =
      response?.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";

    console.log(`Transcript: "${transcript}"`);
    return transcript;

  } catch (err) {
    console.error("Transcription error:", err.message);
    throw err;
  }
}