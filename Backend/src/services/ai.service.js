const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");
const puppeteer = require("puppeteer");

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY,
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function truncate(str, maxChars) {
  if (!str) return "";
  return str.length > maxChars ? str.slice(0, maxChars) : str;
}

function extractResumeEssentials(resumeText) {
  if (!resumeText) return "";
  return resumeText
    .split("\n")
    .filter((l) => l.trim())
    .slice(0, 60)
    .join("\n")
    .slice(0, 2000);
}

async function withRetry(fn, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries) throw err;
      console.log(`Attempt ${i + 1} failed: ${err.message}. Retrying...`);
    }
  }
}

function validateReport(parsed) {
  if (!parsed.technicalQuestions?.length)
    throw new Error("Missing technical questions");
  if (!parsed.behavioralQuestions?.length)
    throw new Error("Missing behavioral questions");
  if (!parsed.preparationPlan?.length)
    throw new Error("Missing preparation plan");
  if (typeof parsed.matchScore !== "number")
    throw new Error("Missing match score");
  if (!parsed.title) throw new Error("Missing title");
}

// ── Schemas ───────────────────────────────────────────────────────────────────

const interviewReportSchema = z.object({
  matchScore: z.number().describe("0-100 match score"),
  technicalQuestions: z
    .array(
      z.object({
        question: z.string().describe("Interview question"),
        intention: z.string().describe("Why this is asked"),
        answer: z.string().describe("Key points to cover in answer"),
      }),
    )
    .min(5)
    .max(8)
    .describe("5-8 technical questions"),
  behavioralQuestions: z
    .array(
      z.object({
        question: z.string().describe("Interview question"),
        intention: z.string().describe("Why this is asked"),
        answer: z.string().describe("Key points to cover in answer"),
      }),
    )
    .min(3)
    .max(5)
    .describe("3-5 behavioral questions"),
  skillGaps: z
    .array(
      z.object({
        skill: z.string().describe("Missing skill"),
        severity: z
          .enum(["low", "medium", "high"])
          .describe("Importance level"),
      }),
    )
    .max(5)
    .describe("Top 5 skill gaps"),
  preparationPlan: z
    .array(
      z.object({
        day: z.number().describe("Day number"),
        focus: z.string().describe("Main topic for the day"),
        tasks: z.array(z.string()).describe("Tasks for the day"),
      }),
    )
    .min(5)
    .max(7)
    .describe("5-7 day preparation plan"),
  title: z.string().describe("Job title"),
});

const resumePdfSchema = z.object({
  html: z.string().describe("Complete HTML for the resume"),
});

// ── AI Calls ──────────────────────────────────────────────────────────────────

async function generateInterviewReport({
  resume,
  selfDescription,
  jobDescription,
}) {
  return await withRetry(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: `You are an expert technical interviewer and career coach. Given candidate info and a job description, generate a concise structured interview report. Be direct and practical. No filler content.`,
        responseMimeType: "application/json",
        responseSchema: zodToJsonSchema(interviewReportSchema),
        temperature: 0.5,
        maxOutputTokens: 4000,
      },
      contents: `RESUME:\n${extractResumeEssentials(resume)}\n\nSELF DESCRIPTION:\n${truncate(selfDescription, 400)}\n\nJOB DESCRIPTION:\n${truncate(jobDescription, 1500)}`,
    });

    const parsed = JSON.parse(response.text);
    validateReport(parsed);
    return parsed;
  });
}

async function generatePdfFromHtml(htmlContent) {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });

  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: "networkidle0" });

  const pdfBuffer = await page.pdf({
    format: "A4",
    margin: {
      top: "20mm",
      bottom: "20mm",
      left: "15mm",
      right: "15mm",
    },
  });

  await browser.close();
  return pdfBuffer;
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {
  return await withRetry(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: `You are a professional resume writer. Generate a clean, ATS-friendly, human-sounding resume in HTML. Simple professional design. 1-2 pages max. No AI-sounding language.`,
        responseMimeType: "application/json",
        responseSchema: zodToJsonSchema(resumePdfSchema),
        temperature: 0.8,
        maxOutputTokens: 4000,
      },
      contents: `RESUME:\n${extractResumeEssentials(resume)}\n\nSELF DESCRIPTION:\n${truncate(selfDescription, 400)}\n\nJOB DESCRIPTION:\n${truncate(jobDescription, 1500)}`,
    });

    const { html } = JSON.parse(response.text);
    if (!html) throw new Error("Missing HTML in resume response");

    const pdfBuffer = await generatePdfFromHtml(html);
    return { html, pdfBuffer };
  });
}

module.exports = {
  generateInterviewReport,
  generateResumePdf,
  generatePdfFromHtml,
};
