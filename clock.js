const WEEKDAY_NAMES = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

function updateClock() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const weekday = WEEKDAY_NAMES[now.getDay()];

  document.getElementById('clock-hours').textContent = hours;
  document.getElementById('clock-minutes').textContent = minutes;
  document.getElementById('clock-seconds').textContent = seconds;
  document.getElementById('clock-year').textContent = year;
  document.getElementById('clock-month').textContent = month;
  document.getElementById('clock-day').textContent = day;
  document.getElementById('clock-weekday').textContent = weekday;

  requestAnimationFrame(updateClock);
}

updateClock();