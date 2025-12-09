// 맨 위
const API_BASE = "https://portfolio1-2-whb2.onrender.com";

// 즐겨찾기 목록 불러오기
fetch(`${API_BASE}/favorites`)
  .then(res => res.json())
  .then(data => {
    // 기존에 쓰던 코드
  });

// 찜 추가
fetch(`${API_BASE}/favorites`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ placeId, placeName })
})
  .then(res => res.json())
  .then(data => {
    // 기존 코드
  });



const carousel = document.getElementById('carousel');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

prevBtn.addEventListener('click', () => {
  carousel.scrollBy({ left: -300, behavior: 'smooth' });
});

nextBtn.addEventListener('click', () => {
  carousel.scrollBy({ left: 300, behavior: 'smooth' });
});
