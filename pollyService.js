import { SynthesizeSpeechCommand } from "@aws-sdk/client-polly";
import { polly } from "./awsClients.js";

// Convert text to audio buffer using Amazon Polly
export async function synthesizeSpeech(text) {
  const command = new SynthesizeSpeechCommand({
    Text: text,
    OutputFormat: "mp3",
    VoiceId: "Joanna", 
    Engine: "neural",
  });

  const response = await polly.send(command);

  // Convert the stream to a Buffer
  const chunks = [];
  for await (const chunk of response.AudioStream) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}