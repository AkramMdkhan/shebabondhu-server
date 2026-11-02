import { Router } from "express";
import { ObjectId } from "mongodb";
import { getDb } from "../db";
import { verifyJwt } from "../middleware/auth";

const router = Router();

function startOfToday() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return today;
}

// POST /api/joins  { eventId }
// Protected: the logged-in user joins an event
router.post("/", verifyJwt, async (req, res) => {
  const eventId = typeof req.body?.eventId === "string" ? req.body.eventId : "";

  if (!ObjectId.isValid(eventId)) {
    res.status(400).json({ message: "Invalid event id" });
    return;
  }

  const db = getDb();
  const event = await db
    .collection("events")
    .findOne({ _id: new ObjectId(eventId) });

  if (!event) {
    res.status(404).json({ message: "Event not found" });
    return;
  }

  if (event.eventDate < startOfToday()) {
    res.status(400).json({ message: "This event has already passed" });
    return;
  }

  const user = req.user!;

  const alreadyJoined = await db
    .collection("joins")
    .findOne({ eventId: event._id, userEmail: user.email });

  if (alreadyJoined) {
    res.status(409).json({ message: "You have already joined this event" });
    return;
  }

  // Store the join together with the event and user data
  await db.collection("joins").insertOne({
    eventId: event._id,
    eventTitle: event.title,
    eventDate: event.eventDate,
    userId: user.id,
    userEmail: user.email,
    joinedAt: new Date(),
  });

  res.status(201).json({ message: "You joined this event" });
});

// GET /api/joins/status/:eventId
// Protected: has the logged-in user already joined this event?
router.get("/status/:eventId", verifyJwt, async (req, res) => {
  const eventId = String(req.params.eventId);

  if (!ObjectId.isValid(eventId)) {
    res.status(400).json({ message: "Invalid event id" });
    return;
  }

  const join = await getDb()
    .collection("joins")
    .findOne({ eventId: new ObjectId(eventId), userEmail: req.user!.email });

  res.json({ joined: Boolean(join) });
});

// GET /api/joins/mine
// Protected: all events the logged-in user joined, sorted by event date
router.get("/mine", verifyJwt, async (req, res) => {
  const joins = await getDb()
    .collection("joins")
    .aggregate([
      { $match: { userEmail: req.user!.email } },
      {
        $lookup: {
          from: "events",
          localField: "eventId",
          foreignField: "_id",
          as: "event",
        },
      },
      { $unwind: "$event" },
      { $sort: { "event.eventDate": 1 } },
      { $project: { _id: 1, joinedAt: 1, event: 1 } },
    ])
    .toArray();

  res.json(joins);
});

export default router;