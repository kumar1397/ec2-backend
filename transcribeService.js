import {
  StartStreamTranscriptionCommand,
} from "@aws-sdk/client-transcribe-streaming";
import { transcribeClient } from "./awsClients.js";

// Stream audio to Transcribe and collect the final transcript
export async function transcribeAudioStream(audioStream) {
  return new Promise(async (resolve, reject) => {
    try {
      const command = new StartStreamTranscriptionCommand({
        LanguageCode: "en-US",
        MediaEncoding: "pcm",
        MediaSampleRateHertz: 16000,
        AudioStream: audioStream,
      });

      const response = await transcribeClient.send(command);

      let finalTranscript = "";

      for await (const event of response.TranscriptResultStream) {
        const results = event.TranscriptEvent?.Transcript?.Results;
        if (results && results.length > 0) {
          for (const result of results) {
            // Only capture finalized (non-partial) results
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