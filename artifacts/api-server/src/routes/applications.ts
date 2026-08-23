import { Router } from "express";
import { readCol, writeCol, saveUploadedFile } from "../lib/store.js";
import { broadcast } from "../lib/wsServer.js";
import { randomUUID } from "crypto";

const router = Router();

// GET /api/recruitment/openings - Public active openings
router.get("/recruitment/openings",  async (_req, res) => {
  try {
    const openings = (await readCol("recruitmentOpenings") as any[]) || [];
    const active = openings.filter((o) => o.status === "Open" || !o.status);
    res.json({ ok: true, openings: active });
  } catch (e) {
    res.status(500).json({ ok: false, error: "Failed to fetch recruitment openings" });
  }
});

// POST /api/recruitment/upload - Public file upload for resumes/photos
router.post("/recruitment/upload",  async (req, res) => {
  try {
    const { fileData, fileName, fileType } = req.body || {};

    if (!fileData || !fileName) {
      return res.status(400).json({ ok: false, error: "File data and file name are required." });
    }

    // Security check: validate MIME type
    const mime = fileType || "application/octet-stream";
    const allowed = [
      "image/jpeg", "image/png", "image/webp", "image/gif",
      "application/pdf", "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain"
    ];

    if (!allowed.includes(mime) && !fileName.match(/\.(pdf|doc|docx|png|jpg|jpeg|webp)$/i)) {
      return res.status(400).json({ ok: false, error: "Invalid file format. Allowed: PDF, DOC, DOCX, JPG, PNG, WEBP." });
    }

    // Clean base64 string
    const base64Clean = fileData.replace(/^data:[^;]+;base64,/, "");
    const buffer = Buffer.from(base64Clean, "base64");

    // Max 10MB limit
    if (buffer.length > 10 * 1024 * 1024) {
      return res.status(400).json({ ok: false, error: "File size exceeds 10MB limit." });
    }

    const ext = fileName.slice((fileName.lastIndexOf(".") - 1 >>> 0) + 2) || "bin";
    const uniqueName = `rec_${randomUUID()}.${ext}`;

    await saveUploadedFile(uniqueName, mime, buffer);
    const url = `/api/uploads/${uniqueName}`;

    res.json({ ok: true, url, fileName: uniqueName });
  } catch (err: any) {
    console.error("Recruitment file upload error:", err);
    res.status(500).json({ ok: false, error: "Failed to save uploaded file." });
  }
});

// POST /api/recruitment/apply - Public recruitment application submission
router.post("/recruitment/apply",  async (req, res) => {
  try {
    const body = req.body || {};
    const { name, email, game, role, age, whatsapp, uid, rank, openingId } = body;

    if (!name || !email || !game || !role) {
      return res.status(400).json({ ok: false, error: "Name, email, game, and role are required." });
    }

    const existingApps = (await readCol("recruitment") as any[]) || [];

    const now = Date.now();
    const appId = `app_${now}_${Math.random().toString(36).slice(2, 7)}`;

    let openingTitle = body.openingTitle || "";
    if (openingId && !openingTitle) {
      const openings = (await readCol("recruitmentOpenings") as any[]) || [];
      const matchedOp = openings.find((o) => o.id === openingId);
      if (matchedOp) openingTitle = matchedOp.title;
    }

    const newApp = {
      id: appId,
      openingId: openingId || "",
      openingTitle,
      name: String(name).trim(),
      email: String(email).trim(),
      whatsapp: whatsapp ? String(whatsapp).trim() : "",
      age: age ? String(age).trim() : "",
      country: body.country ? String(body.country).trim() : "India",
      game: String(game).trim(),
      ign: body.ign ? String(body.ign).trim() : "",
      uid: uid ? String(uid).trim() : "",
      role: String(role).trim(),
      currentOrg: body.currentOrg ? String(body.currentOrg).trim() : "",
      rank: rank ? String(rank).trim() : "",
      experience: body.experience ? String(body.experience).trim() : "",
      experienceYears: Number(body.experienceYears) || 0,
      achievements: body.achievements ? String(body.achievements).trim() : "",
      about: body.about ? String(body.about).trim() : "",
      socials: {
        youtube: body.youtube || body.socials?.youtube || "",
        instagram: body.instagram || body.socials?.instagram || "",
        twitter: body.twitter || body.socials?.twitter || "",
        discord: body.discord || body.socials?.discord || "",
        streamUrl: body.streamUrl || body.socials?.streamUrl || "",
        portfolioUrl: body.portfolioUrl || body.socials?.portfolioUrl || "",
      },
      resumeUrl: body.resumeUrl || "",
      photoUrl: body.photoUrl || "",
      customAnswers: body.customAnswers || {},
      availability: body.availability ? String(body.availability).trim() : "",
      status: "new",
      rating: 0,
      tags: [],
      adminNote: "",
      read: false,
      auditTrail: [
        {
          id: `aud_${now}_1`,
          action: "Application Submitted by applicant",
          timestamp: now,
        },
      ],
      notificationSent: { email: false, discord: false },
      createdAt: now,
      updatedAt: now,
    };

    const updatedApps = [newApp, ...existingApps];
    await writeCol("recruitment", updatedApps);

    // Broadcast WebSocket update for real-time admin sync
    broadcast({ type: "db_update", collection: "recruitment", data: updatedApps, timestamp: now });

    res.status(201).json({ ok: true, id: appId, message: "Application submitted successfully! Our team will review your application soon." });
  } catch (err: any) {
    console.error("Recruitment application submission error:", err);
    res.status(500).json({ ok: false, error: "Server error processing application. Please try again." });
  }
});

export default router;
