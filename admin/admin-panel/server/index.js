import express from "express";
import fs from "fs/promises";
import path from "path";
import cors from "cors";
import multer from "multer";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware phải đặt trước các route
app.use(cors());
app.use(express.json());

// Serve static files from assets
app.use("/assets", express.static(path.join(__dirname, "..", "src", "assets")));

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, "..", "src", "assets", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// Upload endpoint
app.post("/api/upload", upload.array("images", 10), (req, res) => {
  try {
    const files = req.files.map((file) => `/assets/uploads/${file.filename}`);
    res.json({ files });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

const RESTAURANT_FILE = path.join(
  process.cwd(),
  "server",
  "data",
  "restaurants.json"
);
const FOOD_FILE = path.join(process.cwd(), "server", "data", "foods.json");
const CATEGORY_FILE = path.join(
  process.cwd(),
  "server",
  "data",
  "categories.json"
);
const REVIEW_FILE = path.join(process.cwd(), "server", "data", "reviews.json");
async function readCategories() {
  try {
    const txt = await fs.readFile(CATEGORY_FILE, "utf-8");
    return JSON.parse(txt || "[]");
  } catch (err) {
    console.error("readCategories error", err);
    return [];
  }
}

async function writeCategories(data) {
  await fs.writeFile(CATEGORY_FILE, JSON.stringify(data, null, 2), "utf-8");
}
// CATEGORIES ENDPOINTS
app.get("/api/categories", async (req, res) => {
  const data = await readCategories();
  res.json(data);
});

app.post("/api/categories", async (req, res) => {
  const body = req.body;
  try {
    const data = await readCategories();
    const nextId = data.reduce((m, r) => Math.max(m, r.id || 0), 0) + 1;
    const newItem = {
      id: nextId,
      name: body.name || "Untitled",
      description: body.description || "",
      foodIds: body.foodIds || [],
      visible: true,
    };
    data.push(newItem);
    await writeCategories(data);
    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ error: "Failed to save" });
  }
});

app.put("/api/categories/:id", async (req, res) => {
  const id = Number(req.params.id);
  const body = req.body;
  const data = await readCategories();
  const idx = data.findIndex((r) => r.id === id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  data[idx] = { ...data[idx], ...body };
  await writeCategories(data);
  res.json(data[idx]);
});

app.delete("/api/categories/:id", async (req, res) => {
  const id = Number(req.params.id);
  const data = await readCategories();
  const next = data.filter((r) => r.id !== id);
  await writeCategories(next);
  res.status(204).end();
});

async function readRestaurants() {
  try {
    const txt = await fs.readFile(RESTAURANT_FILE, "utf-8");
    return JSON.parse(txt || "[]");
  } catch (err) {
    console.error("readRestaurants error", err);
    return [];
  }
}

async function writeRestaurants(data) {
  await fs.writeFile(RESTAURANT_FILE, JSON.stringify(data, null, 2), "utf-8");
}

async function readFoods() {
  try {
    const txt = await fs.readFile(FOOD_FILE, "utf-8");
    return JSON.parse(txt || "[]");
  } catch (err) {
    console.error("readFoods error", err);
    return [];
  }
}

async function writeFoods(data) {
  await fs.writeFile(FOOD_FILE, JSON.stringify(data, null, 2), "utf-8");
}

async function readReviews() {
  try {
    const txt = await fs.readFile(REVIEW_FILE, "utf-8");
    return JSON.parse(txt || "[]");
  } catch (err) {
    console.error("readReviews error", err);
    return [];
  }
}

async function writeReviews(data) {
  await fs.writeFile(REVIEW_FILE, JSON.stringify(data, null, 2), "utf-8");
}

// RESTAURANT ENDPOINTS
app.get("/api/restaurants", async (req, res) => {
  const data = await readRestaurants();
  res.json(data);
});

app.post("/api/restaurants", async (req, res) => {
  const body = req.body;
  try {
    const data = await readRestaurants();
    const nextId = data.reduce((m, r) => Math.max(m, r.id || 0), 0) + 1;

    // Xử lý categories từ form
    const categoryTags = [];
    if (body.categories) {
      if (body.categories.lau) categoryTags.push("Lẩu");
      if (body.categories.nuong) categoryTags.push("Nướng");
      if (body.categories.buffet) categoryTags.push("Buffet");
      if (body.categories.monViet) categoryTags.push("Món Việt");
      if (body.categories.monHan) categoryTags.push("Món Hàn");
      if (body.categories.monNhat) categoryTags.push("Món Nhật");
      if (body.categories.monAu) categoryTags.push("Món Âu");
    }

    // Xử lý meal types
    const mealTags = [];
    if (body.mealTypes) {
      if (body.mealTypes.sang) mealTags.push("Sáng");
      if (body.mealTypes.trua) mealTags.push("Trưa");
      if (body.mealTypes.chieu) mealTags.push("Chiều");
      if (body.mealTypes.toi) mealTags.push("Tối");
    }

    // Xử lý amenities
    const amenityTags = [];
    if (body.amenities) {
      if (body.amenities.mayLanh) amenityTags.push("Máy lạnh");
      if (body.amenities.choDoXe) amenityTags.push("Chỗ đỗ xe");
      if (body.amenities.wifi) amenityTags.push("Wifi");
    }

    const allTags = [...categoryTags, ...mealTags, ...amenityTags].join(", ");

    const newItem = {
      id: nextId,
      image: body.image || "/src/assets/logo.png",
      name: body.name || "Untitled",
      tags: allTags,
      description: body.description || "",
      address: body.address || "",
      district: body.district || "",
      lat: body.lat || "",
      lng: body.lng || "",
      opening: body.opening || "",
      rating: body.rating ?? null,
      priceRange: body.priceRange || "",
      visible: true,
      categories: body.categories || {},
      mealTypes: body.mealTypes || {},
      amenities: body.amenities || {},
    };
    data.push(newItem);
    await writeRestaurants(data);
    res.status(201).json(newItem);
  } catch (err) {
    console.error("Create restaurant error:", err);
    res.status(500).json({ error: "Failed to save" });
  }
});

app.put("/api/restaurants/:id", async (req, res) => {
  const id = Number(req.params.id);
  const body = req.body;
  try {
    const data = await readRestaurants();
    const idx = data.findIndex((r) => r.id === id);
    if (idx === -1) return res.status(404).json({ error: "Not found" });

    // Xử lý categories từ form
    const categoryTags = [];
    if (body.categories) {
      if (body.categories.lau) categoryTags.push("Lẩu");
      if (body.categories.nuong) categoryTags.push("Nướng");
      if (body.categories.buffet) categoryTags.push("Buffet");
      if (body.categories.monViet) categoryTags.push("Món Việt");
      if (body.categories.monHan) categoryTags.push("Món Hàn");
      if (body.categories.monNhat) categoryTags.push("Món Nhật");
      if (body.categories.monAu) categoryTags.push("Món Âu");
    }

    // Xử lý meal types
    const mealTags = [];
    if (body.mealTypes) {
      if (body.mealTypes.sang) mealTags.push("Sáng");
      if (body.mealTypes.trua) mealTags.push("Trưa");
      if (body.mealTypes.chieu) mealTags.push("Chiều");
      if (body.mealTypes.toi) mealTags.push("Tối");
    }

    // Xử lý amenities
    const amenityTags = [];
    if (body.amenities) {
      if (body.amenities.mayLanh) amenityTags.push("Máy lạnh");
      if (body.amenities.choDoXe) amenityTags.push("Chỗ đỗ xe");
      if (body.amenities.wifi) amenityTags.push("Wifi");
    }

    const allTags = [...categoryTags, ...mealTags, ...amenityTags].join(", ");

    data[idx] = {
      ...data[idx],
      ...body,
      tags: allTags || data[idx].tags,
    };
    await writeRestaurants(data);
    res.json(data[idx]);
  } catch (err) {
    console.error("Update restaurant error:", err);
    res.status(500).json({ error: "Failed to update" });
  }
});

app.delete("/api/restaurants/:id", async (req, res) => {
  const id = Number(req.params.id);
  const data = await readRestaurants();
  const next = data.filter((r) => r.id !== id);
  await writeRestaurants(next);
  res.status(204).end();
});

app.put("/api/restaurants/:id/hide", async (req, res) => {
  const id = Number(req.params.id);
  const data = await readRestaurants();
  const idx = data.findIndex((r) => r.id === id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  data[idx] = { ...data[idx], visible: false };
  await writeRestaurants(data);
  res.json(data[idx]);
});

// FOODS ENDPOINTS
app.get("/api/foods", async (req, res) => {
  const data = await readFoods();
  res.json(data);
});

app.post("/api/foods", async (req, res) => {
  const body = req.body;
  try {
    const data = await readFoods();
    const nextId = data.reduce((m, r) => Math.max(m, r.id || 0), 0) + 1;
    const newItem = {
      id: nextId,
      name: body.name || "Untitled",
      description: body.description || "",
      price: body.price || 0,
      image: body.image || "",
      restaurantId: body.restaurantId || null,
      category: body.category || "",
    };
    data.push(newItem);
    await writeFoods(data);
    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ error: "Failed to save" });
  }
});

app.put("/api/foods/:id", async (req, res) => {
  const id = Number(req.params.id);
  const body = req.body;
  const data = await readFoods();
  const idx = data.findIndex((r) => r.id === id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  data[idx] = { ...data[idx], ...body };
  await writeFoods(data);
  res.json(data[idx]);
});

app.delete("/api/foods/:id", async (req, res) => {
  const id = Number(req.params.id);
  const data = await readFoods();
  const next = data.filter((r) => r.id !== id);
  await writeFoods(next);
  res.status(204).end();
});

// REVIEWS ENDPOINTS
app.get("/api/reviews", async (req, res) => {
  const data = await readReviews();
  // Chỉ trả về reviews chưa bị xóa
  const activeReviews = data.filter((r) => r.deleted !== true);
  res.json(activeReviews);
});

app.get("/api/reviews/violations", async (req, res) => {
  try {
    const data = await readReviews();
    const violations = data.filter(
      (r) => r.violation === true && r.deleted !== true
    );
    res.json(violations);
  } catch (err) {
    console.error("Get violations error:", err);
    res.status(500).json({ error: "Failed to get violations" });
  }
});

app.get("/api/reviews/deleted", async (req, res) => {
  try {
    const data = await readReviews();
    const deleted = data.filter((r) => r.deleted === true);
    res.json(deleted);
  } catch (err) {
    console.error("Get deleted reviews error:", err);
    res.status(500).json({ error: "Failed to get deleted reviews" });
  }
});

app.post("/api/reviews", async (req, res) => {
  const body = req.body;
  try {
    const data = await readReviews();
    const nextId = data.reduce((m, r) => Math.max(m, r.id || 0), 0) + 1;
    const newItem = {
      id: nextId,
      title: body.title || "Untitled",
      rating: body.rating || 0,
      content: body.content || "",
      restaurantId: body.restaurantId || null,
      restaurantName: body.restaurantName || "",
      userId: body.userId || null,
      userName: body.userName || "",
      category: body.category || "",
      approved: body.approved || false,
      createdAt: new Date().toISOString(),
    };
    data.push(newItem);
    await writeReviews(data);
    res.status(201).json(newItem);
  } catch (err) {
    console.error("Create review error:", err);
    res.status(500).json({ error: "Failed to save" });
  }
});

app.put("/api/reviews/:id", async (req, res) => {
  const id = Number(req.params.id);
  const body = req.body;
  try {
    const data = await readReviews();
    const idx = data.findIndex((r) => r.id === id);
    if (idx === -1) return res.status(404).json({ error: "Not found" });
    data[idx] = { ...data[idx], ...body };
    await writeReviews(data);
    res.json(data[idx]);
  } catch (err) {
    console.error("Update review error:", err);
    res.status(500).json({ error: "Failed to update" });
  }
});

app.put("/api/reviews/:id/approve", async (req, res) => {
  const id = Number(req.params.id);
  console.log("Approve review:", id);
  try {
    const data = await readReviews();
    const idx = data.findIndex((r) => r.id === id);
    if (idx === -1) {
      console.log("Review not found:", id);
      return res.status(404).json({ error: "Not found" });
    }
    data[idx] = { ...data[idx], approved: true, violation: false };
    await writeReviews(data);
    console.log("Review approved:", data[idx]);
    res.json(data[idx]);
  } catch (err) {
    console.error("Approve review error:", err);
    res.status(500).json({ error: "Failed to approve" });
  }
});

app.put("/api/reviews/:id/reject", async (req, res) => {
  const id = Number(req.params.id);
  console.log("Reject review:", id);
  try {
    const data = await readReviews();
    const idx = data.findIndex((r) => r.id === id);
    if (idx === -1) {
      console.log("Review not found:", id);
      return res.status(404).json({ error: "Not found" });
    }
    data[idx] = { ...data[idx], approved: false, violation: true };
    await writeReviews(data);
    console.log("Review rejected:", data[idx]);
    res.json(data[idx]);
  } catch (err) {
    console.error("Reject review error:", err);
    res.status(500).json({ error: "Failed to reject" });
  }
});

app.put("/api/reviews/:id/hide", async (req, res) => {
  const id = Number(req.params.id);
  try {
    const data = await readReviews();
    const idx = data.findIndex((r) => r.id === id);
    if (idx === -1) return res.status(404).json({ error: "Not found" });
    data[idx] = {
      ...data[idx],
      approved: false,
      violation: false,
      deleted: true,
    };
    await writeReviews(data);
    res.json(data[idx]);
  } catch (err) {
    console.error("Hide review error:", err);
    res.status(500).json({ error: "Failed to hide" });
  }
});

app.put("/api/reviews/:id/restore", async (req, res) => {
  const id = Number(req.params.id);
  try {
    const data = await readReviews();
    const idx = data.findIndex((r) => r.id === id);
    if (idx === -1) return res.status(404).json({ error: "Not found" });
    data[idx] = {
      ...data[idx],
      deleted: false,
      violation: false,
      approved: false,
    };
    await writeReviews(data);
    res.json(data[idx]);
  } catch (err) {
    console.error("Restore review error:", err);
    res.status(500).json({ error: "Failed to restore" });
  }
});

app.delete("/api/reviews/:id", async (req, res) => {
  const id = Number(req.params.id);
  try {
    const data = await readReviews();
    const next = data.filter((r) => r.id !== id);
    await writeReviews(next);
    res.status(204).end();
  } catch (err) {
    console.error("Delete review error:", err);
    res.status(500).json({ error: "Failed to delete" });
  }
});

// USERS ENDPOINTS
const usersPath = path.join(__dirname, "data", "users.json");

async function readUsers() {
  const data = await fs.readFile(usersPath, "utf-8");
  return JSON.parse(data);
}

async function writeUsers(data) {
  await fs.writeFile(usersPath, JSON.stringify(data, null, 2));
}

app.get("/api/users", async (req, res) => {
  try {
    const data = await readUsers();
    res.json(data);
  } catch (err) {
    console.error("Get users error:", err);
    res.status(500).json({ error: "Failed to get users" });
  }
});

app.put("/api/users/:id/ban", async (req, res) => {
  const id = Number(req.params.id);
  try {
    const data = await readUsers();
    const idx = data.findIndex((u) => u.id === id);
    if (idx === -1) return res.status(404).json({ error: "Not found" });
    data[idx] = { ...data[idx], status: "banned" };
    await writeUsers(data);
    res.json(data[idx]);
  } catch (err) {
    console.error("Ban user error:", err);
    res.status(500).json({ error: "Failed to ban user" });
  }
});

app.put("/api/users/:id/unban", async (req, res) => {
  const id = Number(req.params.id);
  try {
    const data = await readUsers();
    const idx = data.findIndex((u) => u.id === id);
    if (idx === -1) return res.status(404).json({ error: "Not found" });
    data[idx] = { ...data[idx], status: "active" };
    await writeUsers(data);
    res.json(data[idx]);
  } catch (err) {
    console.error("Unban user error:", err);
    res.status(500).json({ error: "Failed to unban user" });
  }
});

const server = app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

server.on("error", (err) => {
  if (err && err.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use. Please free the port or set a different PORT environment variable.`
    );
    process.exit(1);
  }
  console.error("Server error", err);
  process.exit(1);
});
