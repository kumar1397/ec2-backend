import PDFDocument from "pdfkit";
import { s3 } from "./awsClients.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";

export async function generateAndUploadPDF(respondentId, personDetails, projectId, conversation) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("error", reject);
    doc.on("end", async () => {
      try {
        const pdfBuffer = Buffer.concat(chunks);
        const key = `transcripts/${projectId}/${respondentId}.pdf`;

        await s3.send(new PutObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: key,
          Body: pdfBuffer,
          ContentType: "application/pdf",
        }));

        const downloadUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
        resolve(downloadUrl);
      } catch (err) {
        reject(err);
      }
    });

    // ── Header ────────────────────────────────────────────────
    doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .text("Interview Transcript", { align: "center" });

    doc.moveDown(0.5);
    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#666666")
      .text(`Project ID: ${projectId}`, { align: "center" })
      .text(`Date: ${new Date().toLocaleDateString()}`, { align: "center" });

    // ── Respondent Details ────────────────────────────────────
    doc.moveDown(1);
    doc
      .fontSize(13)
      .font("Helvetica-Bold")
      .fillColor("#000000")
      .text("Respondent Details");

    doc.moveDown(0.3);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor("#dddddd").stroke();
    doc.moveDown(0.5);

    const details = [
      ["Name", personDetails.name],
      ["Age", personDetails.age],
      ["Gender", personDetails.gender],
      ["Location", personDetails.location],
      ["Education", personDetails.education],
      ["Income", personDetails.income],
    ];

    details.forEach(([label, value]) => {
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor("#333333")
        .text(`${label}: `, { continued: true })
        .font("Helvetica")
        .fillColor("#555555")
        .text(value?.toString() || "N/A");
    });

    // ── Conversation ──────────────────────────────────────────
    doc.moveDown(1);
    doc
      .fontSize(13)
      .font("Helvetica-Bold")
      .fillColor("#000000")
      .text("Conversation");

    doc.moveDown(0.3);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor("#dddddd").stroke();
    doc.moveDown(0.5);

    conversation.forEach((turn, i) => {
      // Question
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor("#1a1a1a")
        .text(`Q${i + 1}: ${turn.question}`);

      doc.moveDown(0.3);

      // Answer
      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#444444")
        .text(`Answer: ${turn.answer || "No response"}`);

      doc.moveDown(0.8);
    });

    doc.end();
  });
}