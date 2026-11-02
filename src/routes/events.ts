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

// Checks the event fields. Used by both create and update.
function validateEvent(body: Record<string, unknown>) {
  const title = text(body.title);
  const description = text(body.description);
  const eventType = text(body.eventType);
  const thumbnail = text(body.thumbnail);
  const location = text(body.location);
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

  return {
    error,
    data: { title, description, eventType, thumbnail, location, eventDate },
  };
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

// GET /api/events/mine
// Protected: every event created by the logged-in user, soonest first.
// This must stay above "/:id" so "mine" is not read as an id.
router.get("/mine", verifyJwt, async (req, res) => {
  const events = await getDb()
    .collection("events")
    .find({ creatorEmail: req.user!.email })
    .sort({ eventDate: 1 })
    .toArray();

  res.json(events);
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
  const { error, data } = validateEvent(req.body ?? {});

  if (error) {
    res.status(400).json({ message: error });
    return;
  }

  const result = await getDb()
    .collection("events")
    .insertOne({
      ...data,
      creatorEmail: req.user!.email,
      createdAt: new Date(),
    });

  res.status(201).json({ insertedId: result.insertedId });
});

// PATCH /api/events/:id
// Protected: only the creator can update their own event
router.patch("/:id", verifyJwt, async (req, res) => {
  const id = String(req.params.id);
  if (!ObjectId.isValid(id)) {
    res.status(400).json({ message: "Invalid event id" });
    return;
  }

  const events = getDb().collection("events");
  const event = await events.findOne({ _id: new ObjectId(id) });

  if (!event) {
    res.status(404).json({ message: "Event not found" });
    return;
  }

  if (event.creatorEmail !== req.user!.email) {
    res.status(403).json({ message: "You can only update your own events" });
    return;
  }

  const { error, data } = validateEvent(req.body ?? {});
  if (error) {
    res.status(400).json({ message: error });
    return;
  }

  await events.updateOne(
    { _id: event._id },
    { $set: { ...data, updatedAt: new Date() } }
  );

  res.json({ message: "Event updated" });
});

// DELETE /api/events/:id
// Protected: only the creator can delete their own event
router.delete("/:id", verifyJwt, async (req, res) => {
  const id = String(req.params.id);
  if (!ObjectId.isValid(id)) {
    res.status(400).json({ message: "Invalid event id" });
    return;
  }

  const db = getDb();
  const event = await db.collection("events").findOne({ _id: new ObjectId(id) });

  if (!event) {
    res.status(404).json({ message: "Event not found" });
    return;
  }

  if (event.creatorEmail !== req.user!.email) {
    res.status(403).json({ message: "You can only delete your own events" });
    return;
  }

  await db.collection("events").deleteOne({ _id: event._id });
  // Remove the joins that belonged to this event
  await db.collection("joins").deleteMany({ eventId: event._id });

  res.json({ message: "Event deleted" });
});

export default router;