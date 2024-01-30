// YOUR_BASE_DIRECTORY/netlify/functions/api.ts

import express, { Router } from "express";
import serverless from "serverless-http";
import fs from "fs/promises";
import path from "path";

const api = express();

const router = Router();

router.get("/hello", (req, res) => res.send("Hello World!"));

router.get("/get-available-time-slots", async (req, res) => {
  try {
    // Read the JSON file
    const availableTimeSlotsFile = path.join(__dirname, "..", "..", "availableTimeSlots.json");
    const data = await fs.readFile(availableTimeSlotsFile, "utf8");

    // Parse the JSON data
    const availableTimeSlots = JSON.parse(data);

    // Send the data to the client
    res.json(availableTimeSlots);
  } catch (error) {
    console.error('Error reading availableTimeSlots.json:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

api.use("/api/", router);

export const handler = serverless(api);
