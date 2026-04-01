const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// ================== MIDDLEWARE ==================
app.use(cors());
app.use(express.json());

// ================== CONNECT MONGODB ==================
mongoose.connect("mongodb+srv://admin:Mohammed22danish@krtimberdb.l9mprx5.mongodb.net/woodapp")
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ DB Error:", err));

// ================== DATA SCHEMA (WOOD) ==================
const dataSchema = new mongoose.Schema({
  user: String,
  type: String,
  data: Object
});

const Data = mongoose.model("Data", dataSchema);

// ================== EXPENDITURE SCHEMA ==================
const expSchema = new mongoose.Schema({
  user: String,
  type: String,
  data: Object
});

const Expenditure = mongoose.model("Expenditure", expSchema);

// ================== USER SCHEMA ==================
const userSchema = new mongoose.Schema({
  user: String,
  pass: String
});

const User = mongoose.model("User", userSchema);

// =======================================================
// ================== AUTH ==================
// =======================================================

// REGISTER
app.post("/register", async (req, res) => {
  try {
    const { user, pass } = req.body;

    if (!user || !pass) {
      return res.status(400).send("Fill all fields");
    }

    const exists = await User.findOne({ user });
    if (exists) return res.send("User already exists");

    await User.create({ user, pass });

    res.send("Account created successfully");

  } catch (err) {
    console.log(err);
    res.status(500).send("Error");
  }
});

// LOGIN
app.post("/login", async (req, res) => {
  try {
    const { user, pass } = req.body;

    const found = await User.findOne({ user, pass });

    if (found) res.json({ success: true });
    else res.json({ success: false });

  } catch (err) {
    console.log(err);
    res.json({ success: false });
  }
});

// =======================================================
// ================== DATA ==================
// =======================================================

// SAVE DATA
app.post("/save", async (req, res) => {
  try {
    const { user, type, data } = req.body;

    if (!user || !type) {
      return res.status(400).send("Missing fields");
    }

    // ✅ SELECT COLLECTION BASED ON TYPE
    const Model =
      type === "woodapp_expenditure_v1" ? Expenditure : Data;

    await Model.findOneAndUpdate(
      { user, type },
      { data },
      { upsert: true, new: true }
    );

    res.send("Saved");

  } catch (err) {
    console.log(err);
    res.status(500).send("Error saving");
  }
});

// GET DATA (POST)
app.post("/get", async (req, res) => {
  try {
    const { user, type } = req.body;

    // ✅ SELECT COLLECTION
    const Model =
      type === "woodapp_expenditure_v1" ? Expenditure : Data;

    const record = await Model.findOne({ user, type });

    if (record) res.json(record.data);
    else res.json(null);

  } catch (err) {
    console.log(err);
    res.json(null);
  }
});

// FIX for browser GET
app.get("/get", async (req, res) => {
  res.json(null);
});

// =======================================================
// ================== SERVER ==================
// =======================================================

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://127.0.0.1:${PORT}`);
});