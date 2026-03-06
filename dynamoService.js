import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDB } from "./awsClients.js";
import { v4 as uuidv4 } from "uuid";

// Fetch interview questions for a given projectId
export async function getProjectQuestions(projectId) {
  const result = await dynamoDB.send(
    new GetCommand({
      TableName: "ResearchData",
      Key: { projectId },
    })
  );

  if (!result.Item) {
    throw new Error(`Project not found: ${projectId}`);
  }

  return result.Item.questions; // Array of question strings
}

// Save a completed interview to the Interviews table
export async function saveInterview(projectId, personDetails, conversation) {
  const interviewId = uuidv4();
  const timestamp = new Date().toISOString();

  await dynamoDB.send(
    new PutCommand({
      TableName: "Interviews",
      Item: {
        interviewId,
        projectId,
        personDetails,
        conversation, // Array of { question, answer }
        completedAt: timestamp,
      },
    })
  );

  return interviewId;
}