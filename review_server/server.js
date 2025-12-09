// server.js
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mysql = require("mysql2/promise");
const mongoose = require("mongoose"); // ✅ MongoDB용

const app = express();
// Render 같은 클라우드에서는 process.env.PORT 를 꼭 써야 함!
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// ============================
// 🔗 MongoDB 연결 (관광지 즐겨찾기 + Contact 메시지용)
// ============================
const mongoUrl =
  process.env.MONGO_URL || "mongodb://127.0.0.1:27017/portfolio_browser";

mongoose
  .connect(mongoUrl)
  .then(() => {
    console.log("✅ MongoDB connected!");
    console.log("   → URL from:", process.env.MONGO_URL ? "env(MONGO_URL)" : mongoUrl);
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
  });

// ----- 즐겨찾기 스키마 & 모델 -----
const favoriteSchema = new mongoose.Schema({
  placeId: { type: String, required: true, unique: true }, // "shinhung-house"
  placeName: { type: String, required: true },             // "신흥동 일본식 가옥"
  likes: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now },
});

favoriteSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const Favorite = mongoose.model("Favorite", favoriteSchema);

// ----- Contact 메시지 스키마 & 모델 (MongoDB 사용) -----
const contactMessageSchema = new mongoose.Schema({
  name:    { type: String, required: true },
  email:   { type: String, required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const ContactMessage = mongoose.model("ContactMessage", contactMessageSchema);

// ============================
// 🔗 MySQL 환경설정 (후기 / review 용)
// ============================
const dbConfig = {
  host: "localhost",
  user: "root",
  password: "0412",
  database: "review_board",
};

// MySQL 연결 함수 (로컬에서만 사용)
async function getConnection() {
  return await mysql.createConnection(dbConfig);
}

// ============================
// 📌 후기 관련 API (MySQL)
// ============================

app.get("/reviews", async (req, res) => {
  try {
    const conn = await getConnection();
    const [rows] = await conn.execute(
      "SELECT * FROM reviews ORDER BY id DESC"
    );
    conn.end();
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "목록 불러오기 실패" });
  }
});

app.post("/reviews", async (req, res) => {
  const { name, comment } = req.body;

  if (!name || !comment) {
    return res.status(400).json({ message: "이름/후기 입력 필수" });
  }

  try {
    const conn = await getConnection();
    const [result] = await conn.execute(
      "INSERT INTO reviews (name, comment) VALUES (?, ?)",
      [name, comment]
    );
    const insertId = result.insertId;

    const [rows] = await conn.execute(
      "SELECT * FROM reviews WHERE id = ?",
      [insertId]
    );

    conn.end();
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "저장 실패" });
  }
});

app.delete("/reviews/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const conn = await getConnection();
    const [result] = await conn.execute(
      "DELETE FROM reviews WHERE id = ?",
      [id]
    );
    conn.end();

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "존재하지 않는 후기" });
    }

    res.json({ message: "삭제 완료!" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "삭제 실패" });
  }
});

// ============================
// 📌 Contact 메시지 관련 API (MongoDB 사용)
// ============================

// 메시지 저장
app.post("/api/message", async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res
      .status(400)
      .json({ msg: "이름, 이메일, 메시지를 모두 입력해주세요." });
  }

  try {
    const doc = await ContactMessage.create({ name, email, message });
    res.json({ msg: "메시지가 저장되었습니다!", data: doc });
  } catch (err) {
    console.error("POST /api/message error:", err);
    res.status(500).json({ msg: "서버 오류(메시지 저장 실패)" });
  }
});

// 메시지 목록 조회
app.get("/api/messages", async (req, res) => {
  try {
    const rows = await ContactMessage.find().sort({ createdAt: -1 }).lean();
    res.json(rows);
  } catch (err) {
    console.error("GET /api/messages error:", err);
    res.status(500).json({ msg: "서버 오류(메시지 불러오기 실패)" });
  }
});

// 메시지 삭제
app.delete("/api/messages/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const deleted = await ContactMessage.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ msg: "해당 메시지가 존재하지 않습니다." });
    }
    res.json({ msg: "메시지 삭제 완료!" });
  } catch (err) {
    console.error("DELETE /api/messages/:id error:", err);
    res.status(500).json({ msg: "메시지 삭제 실패 (서버 오류)" });
  }
});

// ============================
// 📌 군산 관광지 즐겨찾기 API (MongoDB)
// ============================

// 즐겨찾기 목록 조회 (인기 순)
app.get("/favorites", async (req, res) => {
  try {
    const favorites = await Favorite.find()
      .sort({ likes: -1, placeName: 1 })
      .lean();
    res.json(favorites);
  } catch (err) {
    console.error("GET /favorites error:", err);
    res.status(500).json({ error: "Failed to load favorites" });
  }
});

// 특정 관광지 찜(즐겨찾기) 추가 → likes 1 증가 (upsert)
app.post("/favorites", async (req, res) => {
  try {
    const { placeId, placeName } = req.body;
    if (!placeId || !placeName) {
      return res
        .status(400)
        .json({ error: "placeId와 placeName이 필요합니다." });
    }

    await Favorite.findOneAndUpdate(
      { placeId },
      {
        $inc: { likes: 1 },
        $set: { placeName, updatedAt: new Date() },
      },
      { upsert: true }
    );

    const favorites = await Favorite.find()
      .sort({ likes: -1, placeName: 1 })
      .lean();

    res.status(201).json(favorites);
  } catch (err) {
    console.error("POST /favorites error:", err);
    res.status(500).json({ error: "Failed to update favorite" });
  }
});

// ============================
// 📌 서버 실행
// ============================
app.listen(PORT, () => {
  console.log(`Server running → http://localhost:${PORT}`);
});
