import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { Resend } from "resend";
import cors from "cors";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cors());

  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

  // API routes
  app.post("/api/send-lead", async (req, res) => {
    const { name, phone, section } = req.body;

    console.log("New Lead received:", { name, phone, section });

    if (!resend) {
      console.warn("RESEND_API_KEY is not set. Lead saved to console but not emailed.");
      return res.status(200).json({ 
        success: true, 
        message: "Lead logged to console (RESEND_API_KEY missing)" 
      });
    }

    try {
      const data = await resend.emails.send({
        from: "Leads AutoVision <onboarding@resend.dev>",
        to: [process.env.NOTIFICATION_EMAIL || "danugb22@gmail.com"],
        subject: `Nuevo Lead: ${name} (${section})`,
        html: `
          <h1>Nuevo Lead de AutoVision 360</h1>
          <p><strong>Nombre:</strong> ${name}</p>
          <p><strong>WhatsApp:</strong> ${phone}</p>
          <p><strong>Sección:</strong> ${section}</p>
          <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
        `,
      });

      res.status(200).json({ success: true, data });
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ success: false, error });
    }
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
