// import { Router } from "express";
// import { ObjectId } from "mongodb";
// import { getDb } from "../db";
// import { verifyJwt } from "../middleware/auth";

// export const eventTypes = [
//   "Cleanup",
//   "Plantation",
//   "Donation",
//   "Food Drive",
//   "Health Camp",
//   "Education",
//   "Other",
// ] as const;

// const router = Router();

// const text = (value: unknown) =>
//   typeof value === "string" ? value.trim() : "";

// const escapeRegex = (value: string) =>
//   value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// function startOfToday() {
//   const today = new Date();
//   today.setUTCHours(0, 0, 0, 0);
//   return today;
// }

// // GET /api/events?limit=6&type=Donation&search=winter
// // Public: only upcoming events, nearest date first
// router.get("/", async (req, res) => {
//   const limit = Math.min(Number(req.query.limit) || 0, 50);
//   const type = text(req.query.type);
//   const search = text(req.query.search);

//   const filter: Record<string, unknown> = {
//     eventDate: { $gte: startOfToday() },
//   };
//   if (type && type !== "all") filter.eventType = type;
//   if (search) filter.title = { $regex: escapeRegex(search), $options: "i" };

//   let cursor = getDb().collection("events").find(filter).sort({ eventDate: 1 });
//   if (limit > 0) cursor = cursor.limit(limit);

//   res.json(await cursor.toArray());
// });

// // GET /api/events/:id
// // Public: anyone can read the details of one event
// router.get("/:id", async (req, res) => {
//   const { id } = req.params;
//   if (!ObjectId.isValid(id)) {
//     res.status(400).json({ message: "Invalid event id" });
//     return;
//   }

//   const event = await getDb()
//     .collection("events")
//     .findOne({ _id: new ObjectId(id) });

//   if (!event) {
//     res.status(404).json({ message: "Event not found" });
//     return;
//   }
//   res.json(event);
// });

// // POST /api/events
// // Protected: needs a valid JWT. The creator's email comes from the token.
// router.post("/", verifyJwt, async (req, res) => {
//   const body = req.body ?? {};
//   const title = text(body.title);
//   const description = text(body.description);
//   const eventType = text(body.eventType);
//   const thumbnail = text(body.thumbnail);
//   const location = text(body.location);
//   const creatorEmail = req.user!.email;
//   const eventDate = new Date(`${text(body.eventDate)}T00:00:00.000Z`);

//   let error = "";
//   if (title.length < 5) error = "Title must be at least 5 characters";
//   else if (description.length < 20)
//     error = "Description must be at least 20 characters";
//   else if (!(eventTypes as readonly string[]).includes(eventType))
//     error = "Please choose a valid event type";
//   else if (!location) error = "Location is required";
//   else if (Number.isNaN(eventDate.getTime())) error = "Event date is invalid";
//   else if (eventDate <= startOfToday())
//     error = "Event date must be in the future";
//   else {
//     try {
//       new URL(thumbnail);
//     } catch {
//       error = "Thumbnail must be a valid image URL";
//     }
//   }

//   if (error) {
//     res.status(400).json({ message: error });
//     return;
//   }

//   const result = await getDb().collection("events").insertOne({
//     title,
//     description,
//     eventType,
//     thumbnail,
//     location,
//     eventDate,
//     creatorEmail,
//     createdAt: new Date(),
//   });

//   res.status(201).json({ insertedId: result.insertedId });
// });

// export default router;



import { Router } from "express";
import { ObjectId } from "mongodb";
import { getDb } from "../db";
import { verifyJwt } from "../middleware/auth";

export const eventTypes = [
  "Cleanup",
  "Plantation",
  "Donation",
  "Food Drive",
  "Health Camp",
  "Education",
  "Other",
] as const;

const router = Router();

const text = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function startOfToday() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return today;
}

// GET /api/events?limit=6&type=Donation&search=winter
// Public: only upcoming events, nearest date first
router.get("/", async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 0, 50);
  const type = text(req.query.type);
  const search = text(req.query.search);

  const filter: Record<string, unknown> = {
    eventDate: { $gte: startOfToday() },
  };
  if (type && type !== "all") filter.eventType = type;
  if (search) filter.title = { $regex: escapeRegex(search), $options: "i" };

  let cursor = getDb().collection("events").find(filter).sort({ eventDate: 1 });
  if (limit > 0) cursor = cursor.limit(limit);

  res.json(await cursor.toArray());
});

// GET /api/events/:id
// Public: anyone can read the details of one event
router.get("/:id", async (req, res) => {
  const id = String(req.params.id);
  if (!ObjectId.isValid(id)) {
    res.status(400).json({ message: "Invalid event id" });
    return;
  }

  const event = await getDb()
    .collection("events")
    .findOne({ _id: new ObjectId(id) });

  if (!event) {
    res.status(404).json({ message: "Event not found" });
    return;
  }
  res.json(event);
});

// POST /api/events
// Protected: needs a valid JWT. The creator's email comes from the token.
router.post("/", verifyJwt, async (req, res) => {
  const body = req.body ?? {};
  const title = text(body.title);
  const description = text(body.description);
  const eventType = text(body.eventType);
  const thumbnail = text(body.thumbnail);
  const location = text(body.location);
  const creatorEmail = req.user!.email;
  const eventDate = new Date(`${text(body.eventDate)}T00:00:00.000Z`);

  let error = "";
  if (title.length < 5) error = "Title must be at least 5 characters";
  else if (description.length < 20)
    error = "Description must be at least 20 characters";
  else if (!(eventTypes as readonly string[]).includes(eventType))
    error = "Please choose a valid event type";
  else if (!location) error = "Location is required";
  else if (Number.isNaN(eventDate.getTime())) error = "Event date is invalid";
  else if (eventDate <= startOfToday())
    error = "Event date must be in the future";
  else {
    try {
      new URL(thumbnail);
    } catch {
      error = "Thumbnail must be a valid image URL";
    }
  }

  if (error) {
    res.status(400).json({ message: error });
    return;
  }

  const result = await getDb().collection("events").insertOne({
    title,
    description,
    eventType,
    thumbnail,
    location,
    eventDate,
    creatorEmail,
    createdAt: new Date(),
  });

  res.status(201).json({ insertedId: result.insertedId });
});

export default router;