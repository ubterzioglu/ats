#!/usr/bin/env node

/**
 * One-off script to obtain a Google Drive refresh token.
 * Run this locally with: node scripts/google-drive-auth.mjs
 *
 * Prerequisites:
 * - Create a Google Cloud project
 * - Enable the Google Drive API
 * - Create an OAuth 2.0 client ID (type: Desktop application)
 * - Set the consent screen to "In production" (not "Testing")
 * - Copy the client ID and secret below
 */

import { createServer } from "node:http";
import { open } from "open";

const CLIENT_ID = "YOUR_CLIENT_ID_HERE";
const CLIENT_SECRET = "YOUR_CLIENT_SECRET_HERE";
const REDIRECT_URI = "http://localhost:3000/oauth2callback";
const SCOPE = "https://www.googleapis.com/auth/drive.file";

const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
authUrl.searchParams.set("client_id", CLIENT_ID);
authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
authUrl.searchParams.set("response_type", "code");
authUrl.searchParams.set("scope", SCOPE);
authUrl.searchParams.set("access_type", "offline");
authUrl.searchParams.set("prompt", "consent");

const server = createServer(async (req, res) => {
  if (!req.url?.startsWith("/oauth2callback")) {
    res.writeHead(404);
    res.end();
    return;
  }

  const url = new URL(req.url, "http://localhost:3000");
  const code = url.searchParams.get("code");

  if (!code) {
    res.writeHead(400);
    res.end("Missing code");
    return;
  }

  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: REDIRECT_URI
      })
    });

    const data = await response.json();

    if (data.refresh_token) {
      console.log("\n✅ Success! Your refresh token:\n");
      console.log(data.refresh_token);
      console.log("\nStore this as GOOGLE_REFRESH_TOKEN in your environment.\n");
    } else {
      console.error("\n❌ Failed to obtain refresh token:", data);
    }

    res.writeHead(200, { "Content-Type": "text/html" });
    res.end("<html><body><h1>Success! You can close this window.</h1></body></html>");
    server.close();
  } catch (error) {
    console.error("Error exchanging code:", error);
    res.writeHead(500);
    res.end("Error");
    server.close();
  }
});

server.listen(3000, () => {
  console.log("\n🔐 Opening browser for Google authentication...\n");
  console.log("If the browser doesn't open, visit:\n");
  console.log(authUrl.toString());
  console.log();
  open(authUrl.toString());
});
