import "dotenv/config";
import cors from "cors";
import express from "express";
import { connectToDatabase } from "./db";
import eventsRouter from "./routes/events";

const app = express();
const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ message: "Shebabondhu API is running" });
});

app.use("/api/events", eventsRouter);

async function start() {
  try {
    await connectToDatabase();
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start the server:", error);
    process.exit(1);
  }
}

start();