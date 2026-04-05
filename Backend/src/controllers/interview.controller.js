const pdfParse = require("pdf-parse");
const mongoose = require("mongoose");
const {
  generateInterviewReport,
  generateResumePdf,
} = require("../services/ai.service");
const interviewReportModel = require("../models/interviewReport.model");

/**
 * @description Controller to generate interview report based on user self description, resume and job description.
 */
async function generateInterViewReportController(req, res, next) {
  try {
    const { selfDescription, jobDescription } = req.body;

    if (!jobDescription || !jobDescription.trim()) {
      return res.status(400).json({ message: "Job description is required" });
    }

    let resumeText = "";
    if (req.file) {
      const parsed = await pdfParse(req.file.buffer);
      resumeText = parsed.text;
    }

    if (!resumeText && (!selfDescription || !selfDescription.trim())) {
      return res.status(400).json({
        message: "Either a resume or a self description is required",
      });
    }

    const interViewReportByAi = await generateInterviewReport({
      resume: resumeText,
      selfDescription: selfDescription || "",
      jobDescription,
    });

    const interviewReport = await interviewReportModel.create({
      user: req.user.id,
      resume: resumeText,
      selfDescription: selfDescription || "",
      jobDescription,
      ...interViewReportByAi,
    });

    res.status(201).json({
      message: "Interview report generated successfully.",
      interviewReport,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * @description Controller to get interview report by interviewId.
 */
async function getInterviewReportByIdController(req, res, next) {
  try {
    const { interviewId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(interviewId)) {
      return res.status(400).json({ message: "Invalid interview ID" });
    }

    const interviewReport = await interviewReportModel.findOne({
      _id: interviewId,
      user: req.user.id,
    });

    if (!interviewReport) {
      return res.status(404).json({ message: "Interview report not found." });
    }

    res.status(200).json({
      message: "Interview report fetched successfully.",
      interviewReport,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * @description Controller to get all interview reports of logged in user.
 */
async function getAllInterviewReportsController(req, res, next) {
  try {
    const interviewReports = await interviewReportModel
      .find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .select(
        "-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan",
      );

    res.status(200).json({
      message: "Interview reports fetched successfully.",
      interviewReports,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * @description Controller to generate resume PDF based on user self description, resume content and job description.
 */
async function generateResumePdfController(req, res, next) {
  try {
    const { interviewReportId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(interviewReportId)) {
      return res.status(400).json({ message: "Invalid interview report ID" });
    }

    const interviewReport = await interviewReportModel.findOne({
      _id: interviewReportId,
      user: req.user.id,
    });

    if (!interviewReport) {
      return res.status(404).json({ message: "Interview report not found." });
    }

    const { resume, jobDescription, selfDescription } = interviewReport;

    const pdfBuffer = await generateResumePdf({
      resume,
      jobDescription,
      selfDescription,
    });

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`,
    });

    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  generateInterViewReportController,
  getInterviewReportByIdController,
  getAllInterviewReportsController,
  generateResumePdfController,
};
