// main.js

// 캐러셀 요소 & 버튼 가져오기
const carousel = document.getElementById("carousel");
const prevBtn  = document.getElementById("prevBtn");
const nextBtn  = document.getElementById("nextBtn");

// 요소가 실제로 있을 때만 동작하게 방어 코드
if (carousel && prevBtn && nextBtn) {
  // 한 번 클릭할 때 이동할 거리 (카드 너비 + 간격)
  const scrollAmount = 290; // 카드 260px + gap 30px 기준

  // ◀ 왼쪽 버튼
  prevBtn.addEventListener("click", () => {
    carousel.scrollBy({
      left: -scrollAmount,
      behavior: "smooth",
    });
  });

  // ▶ 오른쪽 버튼
  nextBtn.addEventListener("click", () => {
    carousel.scrollBy({
      left: scrollAmount,
      behavior: "smooth",
    });
  });

  // 🔁 자동 슬라이드 (3초마다 오른쪽으로 이동)
  setInterval(() => {
    carousel.scrollBy({
      left: scrollAmount,
      behavior: "smooth",
    });
  }, 3000);
}
