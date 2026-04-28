import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Proxy-like endpoint for Scraping/Enrichment (Mocking for now as per constraints)
  app.post("/api/prospects/enrich", async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });
    
    // In a real app, we'd trigger a scraper or use an API
    // The user requested a "Cloud Function" style trigger 'onProspectCreate'
    // Here we'll simulate the backend logic that follows
    res.json({ message: "Enrichment started", url });
  });

  // Mock Resend Email Sending API
  app.post("/api/email/send", async (req, res) => {
    const { to, subject, body, html } = req.body;
    console.log(`[MOCK EMAIL] To: ${to}, Subject: ${subject}`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    res.json({ success: true, messageId: "msg_" + Math.random().toString(36).substr(2, 9) });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
