// import "dotenv/config";
// import cors from "cors";
// import { MongoClient } from 'mongodb';
// import express from "express";

// const app = express();
// const port = process.env.PORT || 5000;




// const client = new MongoClient(process.env.MONGODB_URI)

// export async function connectToMongoDB() {
//   try {
//     await client.connect();
//     console.log("You successfully connected to MongoDB!");
//     return client;
//   } catch (err) {
//     console.dir(err);
//   }
// }

// connectToMongoDB()

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

// app.listen(port, () => {
//   console.log(`Server is running on port ${port}`);
// });


import "dotenv/config";
import cors from "cors";
import express from "express";
import { connectToDatabase } from "./db";

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