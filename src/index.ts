// import "dotenv/config";
// import cors from "cors";
// import express from "express";
// import { connectToDatabase } from "./db";
// import eventsRouter from "./routes/events";
// import joinsRouter from "./routes/joins";

// const app = express();
// const port = process.env.PORT || 5000;

// app.use(
//   cors({
//     origin: process.env.CLIENT_URL || "http://localhost:3000",
//     credentials: true,
//   })
// );
// app.use(express.json());

// app.get("/", (_req, res) => {
//   res.json({ message: "Shebabondhu API is running" });
// });

// app.use("/api/events", eventsRouter);
// app.use("/api/joins", joinsRouter);

// async function start() {
//   try {
//     await connectToDatabase();
//     app.listen(port, () => {
//       console.log(`Server is running on port ${port}`);
//     });
//   } catch (error) {
//     console.error("Failed to start the server:", error);
//     process.exit(1);
//   }
// }

// start();



import "dotenv/config";
import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import { connectToDatabase } from "./db";
import eventsRouter from "./routes/events";
import joinsRouter from "./routes/joins";

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
app.use("/api/joins", joinsRouter);

// Unknown routes
app.use((_req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Unexpected errors
const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: "Something went wrong on the server" });
};
app.use(errorHandler);

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