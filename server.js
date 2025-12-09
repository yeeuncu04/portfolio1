// server.js (MongoDB 전용 버전)

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 3000;

// ===== 미들웨어 =====
app.use(cors());
app.use(bodyParser.json());

// ===== MongoDB 연결 =====
const mongoUrl = process.env.MONGO_URL;

if (!mongoUrl) {
  console.error("❌ MONGO_URL 환경변수가 설정되어 있지 않습니다.");
  process.exit(1);
}

mongoose
  .connect(mongoUrl)
  .then(() => {
    console.log("✅ MongoDB connected by MONGO_URL");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
  });

// ===== 스키마 & 모델 =====

// 1) 군산 관광지 즐겨찾기
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

// 2) Contact 폼 메시지 (포트폴리오 문의)
const messageSchema = new mongoose.Schema({
  name: { type: String, required: true },   // 보낸 사람 이름
  email: { type: String, required: true },  // 이메일
  message: { type: String, required: true },// 내용
  createdAt: { type: Date, default: Date.now },
});

const Message = mongoose.model("Message", messageSchema);

// ===== 간단한 헬스 체크 =====
app.get("/", (req, res) => {
  res.send("🌐 Yeeun portfolio API is running (MongoDB only)");
});

// ============================
// 📌 Contact 메시지 관련 API (MongoDB)
// ============================

// 메시지 저장
app.post("/api/message", async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res
        .status(400)
        .json({ msg: "이름, 이메일, 메시지를 모두 입력해주세요." });
    }

    const doc = await Message.create({ name, email, message });
    res.json({ msg: "메시지가 저장되었습니다!", data: doc });
  } catch (err) {
    console.error("POST /api/message error:", err);
    res.status(500).json({ msg: "서버 오류(메시지 저장 실패)" });
  }
});

// 메시지 목록 조회 (관리자용)
app.get("/api/messages", async (req, res) => {
  try {
    const rows = await Message.find().sort({ createdAt: -1 }).lean();
    res.json(rows);
  } catch (err) {
    console.error("GET /api/messages error:", err);
    res.status(500).json({ msg: "서버 오류(메시지 불러오기 실패)" });
  }
});

// 메시지 삭제 (관리자용)
app.delete("/api/messages/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await Message.findByIdAndDelete(id);
    if (!deleted) {
      return res
        .status(404)
        .json({ msg: "해당 메시지가 존재하지 않습니다." });
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
  console.log(`🚀 Server running → PORT: ${PORT}`);
});
