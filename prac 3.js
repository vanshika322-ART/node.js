const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const LOCK_TTL_MS = 60_000;

const seats = new Map();

function createSeats(rows = 4, cols = 6) {
  let id = 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      seats.set(String(id), {
        id: String(id),
        status: "available",
        lockOwner: null,
        lockExpiresAt: null,
        timerId: null,
      });
      id++;
    }
  }
}

function expireLock(seat) {
  if (seat.status !== "locked") return;
  seat.status = "available";
  seat.lockOwner = null;
  seat.lockExpiresAt = null;
  if (seat.timerId) {
    clearTimeout(seat.timerId);
    seat.timerId = null;
  }
}

createSeats(4, 6);

app.get("/seats", (req, res) => {
  const list = Array.from(seats.values()).map(s => ({
    id: s.id,
    status: s.status,
    lockOwner: s.lockOwner,
    lockExpiresAt: s.lockExpiresAt,
  }));
  res.json(list);
});

app.get("/seats/:id", (req, res) => {
  const seat = seats.get(req.params.id);
  if (!seat) return res.status(404).json({ error: "Seat not found" });
  res.json({
    id: seat.id,
    status: seat.status,
    lockOwner: seat.lockOwner,
    lockExpiresAt: seat.lockExpiresAt,
  });
});

app.post("/lock", (req, res) => {
  const { seatId, userId } = req.body;
  if (!seatId || !userId) {
    return res.status(400).json({ error: "seatId and userId required" });
  }
  const seat = seats.get(String(seatId));
  if (!seat) return res.status(404).json({ error: "Seat not found" });

  if (seat.status === "booked") {
    return res.status(409).json({ error: "Seat already booked" });
  }

  if (seat.status === "locked") {
    return res.status(409).json({
      error: "Seat is locked",
      lockOwner: seat.lockOwner,
      lockExpiresAt: seat.lockExpiresAt,
    });
  }

  seat.status = "locked";
  seat.lockOwner = String(userId);
  seat.lockExpiresAt = Date.now() + LOCK_TTL_MS;
  if (seat.timerId) clearTimeout(seat.timerId);
  seat.timerId = setTimeout(() => {
    expireLock(seat);
  }, LOCK_TTL_MS);

  res.json({
    message: "Seat locked",
    seatId: seat.id,
    lockOwner: seat.lockOwner,
    lockExpiresAt: seat.lockExpiresAt,
  });
});

app.post("/confirm", (req, res) => {
  const { seatId, userId } = req.body;
  if (!seatId || !userId) {
    return res.status(400).json({ error: "seatId and userId required" });
  }
  const seat = seats.get(String(seatId));
  if (!seat) return res.status(404).json({ error: "Seat not found" });

  if (seat.status === "booked") {
    return res.status(409).json({ error: "Seat already booked" });
  }

  if (seat.status !== "locked") {
    return res.status(409).json({ error: "Seat is not locked" });
  }

  if (seat.lockOwner !== String(userId)) {
    return res.status(403).json({ error: "You do not own the lock" });
  }

  seat.status = "booked";
  seat.lockOwner = null;
  seat.lockExpiresAt = null;
  if (seat.timerId) {
    clearTimeout(seat.timerId);
    seat.timerId = null;
  }

  res.json({ message: "Seat booked successfully", seatId: seat.id });
});

app.post("/release", (req, res) => {
  const { seatId, userId } = req.body;
  if (!seatId || !userId) {
    return res.status(400).json({ error: "seatId and userId required" });
  }
  const seat = seats.get(String(seatId));
  if (!seat) return res.status(404).json({ error: "Seat not found" });

  if (seat.status !== "locked") {
    return res.status(409).json({ error: "Seat is not locked" });
  }

  if (seat.lockOwner !== String(userId)) {
    return res.status(403).json({ error: "You do not own the lock" });
  }

  expireLock(seat);
  res.json({ message: "Lock released", seatId: seat.id });
});

app.listen(PORT, () => {
  console.log(`🚀 Booking server running on http://localhost:${PORT}`);
});
