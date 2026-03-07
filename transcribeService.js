import {
  StartStreamTranscriptionCommand,
} from "@aws-sdk/client-transcribe-streaming";
import { transcribeClient } from "./awsClients.js";

export async function transcribeAudioStream(audioChunks) {
  return new Promise(async (resolve, reject) => {
    try {
      // Convert webm chunks to a single buffer
      const audioBuffer = Buffer.concat(
        audioChunks.map(chunk => 
          Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
        )
      );

      async function* audioGenerator() {
        // Send in small chunks of 8KB
        const chunkSize = 8192;
        for (let i = 0; i < audioBuffer.length; i += chunkSize) {
          yield {
            AudioEvent: {
              AudioChunk: audioBuffer.slice(i, i + chunkSize),
            },
          };
          // Small delay between chunks
          await new Promise(r => setTimeout(r, 10));
        }
      }

      const command = new StartStreamTranscriptionCommand({
        LanguageCode: "en-US",
        MediaEncoding: "ogg-opus",
        MediaSampleRateHertz: 16000,
        AudioStream: audioGenerator(),
      });

      const response = await transcribeClient.send(command);
      let finalTranscript = "";

      for await (const event of response.TranscriptResultStream) {
        const results = event.TranscriptEvent?.Transcript?.Results;
        if (results && results.length > 0) {
          for (const result of results) {
            if (!result.IsPartial && result.Alternatives?.length > 0) {
              finalTranscript += result.Alternatives[0].Transcript + " ";
            }
          }
        }
      }

      resolve(finalTranscript.trim());
    } catch (err) {
      reject(err);
    }
  });
}