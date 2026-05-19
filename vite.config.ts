import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { Resend } from 'resend';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  
  const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;
  const notificationEmail = env.NOTIFICATION_EMAIL || 'danugb22@gmail.com';

  return {
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'api-dev-server',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url === '/api/send-lead' && req.method === 'POST') {
              let body = '';
              req.on('data', chunk => { body += chunk; });
              req.on('end', async () => {
                try {
                  const payload = JSON.parse(body);
                  const { name, phone, section } = payload;
                  
                  console.log('Dev API Lead Received:', payload);

                  if (!resend) {
                    console.warn('RESEND_API_KEY missing in .env. Email not sent.');
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ success: true, message: 'Logged to console (API Key missing)' }));
                    return;
                  }

                  try {
                    await resend.emails.send({
                      from: "Leads AutoVision <onboarding@resend.dev>",
                      to: [notificationEmail],
                      subject: `[DEV] Nuevo Lead: ${name} (${section})`,
                      html: `
                        <h1>Nuevo Lead de AutoVision 360 (MODO DEV)</h1>
                        <p><strong>Nombre:</strong> ${name}</p>
                        <p><strong>WhatsApp:</strong> ${phone}</p>
                        <p><strong>Sección:</strong> ${section}</p>
                        <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
                      `,
                    });
                    
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ success: true, message: 'Email sent in Dev mode' }));
                  } catch (mailError) {
                    console.error('Error sending email in Dev:', mailError);
                    res.statusCode = 500;
                    res.end(JSON.stringify({ success: false, error: 'Email failed' }));
                  }
                } catch (e) {
                  res.statusCode = 400;
                  res.end('Invalid JSON');
                }
              });
              return;
            }
            next();
          });
        }
      }
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
