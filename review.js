// 맨 위
const API_BASE = "https://portfolio1-2-whb2.onrender.com";

// 후기 목록
fetch(`${API_BASE}/reviews`)
  .then(res => res.json())
  

// 후기 작성
fetch(`${API_BASE}/reviews`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name, comment })
});

// 후기 삭제
fetch(`${API_BASE}/reviews/${id}`, {
  method: "DELETE"
});


const reviewListEl = document.getElementById("review-list");
const form = document.getElementById("review-form");
const nameInput = document.getElementById("name");
const commentInput = document.getElementById("comment");

// 페이지 처음 로드될 때 DB에 있는 후기들 불러오기
window.addEventListener("DOMContentLoaded", loadReviews);

async function loadReviews() {
  try {
    const res = await fetch(`${API_BASE}/reviews`);
    if (!res.ok) throw new Error("서버 오류");
    const data = await res.json();
    renderReviews(data);
  } catch (err) {
    console.error(err);
    reviewListEl.innerHTML =
      `<p style="color:red;">후기 목록을 불러오는 데 실패했습니다.</p>`;
  }
}

// 후기 목록 화면에 그리기
function renderReviews(reviews) {
  if (!reviews.length) {
    reviewListEl.innerHTML = `<p>아직 등록된 후기가 없습니다.</p>`;
    return;
  }

  reviewListEl.innerHTML = reviews
    .map(
      (r) => `
      <div class="review-item" data-id="${r.id}">
        <div class="review-header">
          <strong>${r.name}</strong>
          <span class="review-date">${formatDate(r.created_at)}</span>
        </div>
        <p class="review-comment">${r.comment}</p>
        <button class="delete-btn">삭제</button>
      </div>
    `
    )
    .join("");
}

// 날짜 예쁘게 (로컬 시간 기준 YYYY-MM-DD HH:MM)
function formatDate(dt) {
  if (!dt) return "";

  const d = new Date(dt); // MySQL DATETIME → 로컬 Date 객체

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// 폼 제출 → 후기 등록
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = nameInput.value.trim();
  const comment = commentInput.value.trim();

  if (!name || !comment) {
    alert("이름과 후기를 모두 입력해주세요!");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, comment }),
    });

    if (!res.ok) throw new Error("저장 실패");

    const newReview = await res.json();

    const newHtml = `
      <div class="review-item" data-id="${newReview.id}">
        <div class="review-header">
          <strong>${newReview.name}</strong>
          <span class="review-date">${formatDate(newReview.created_at)}</span>
        </div>
        <p class="review-comment">${newReview.comment}</p>
        <button class="delete-btn">삭제</button>
      </div>
    `;

    // 새 글을 맨 위에
    reviewListEl.innerHTML = newHtml + reviewListEl.innerHTML;

    nameInput.value = "";
    commentInput.value = "";
  } catch (err) {
    console.error(err);
    alert("후기를 저장하는 데 실패했습니다.");
  }
});

// 삭제 버튼 (이벤트 위임)
reviewListEl.addEventListener("click", async (e) => {
  if (!e.target.classList.contains("delete-btn")) return;

  const itemEl = e.target.closest(".review-item");
  const id = itemEl.getAttribute("data-id");

  if (!confirm("정말 삭제할까요?")) return;

  try {
    const res = await fetch(`${API_BASE}/reviews/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) throw new Error("삭제 실패");

    itemEl.remove();

    if (!reviewListEl.children.length) {
      reviewListEl.innerHTML = `<p>아직 등록된 후기가 없습니다.</p>`;
    }
  } catch (err) {
    console.error(err);
    alert("후기를 삭제하는 데 실패했습니다.");
  }
});
