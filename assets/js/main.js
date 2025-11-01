// 页脚年份
const y = document.getElementById('year');
if (y) y.textContent = new Date().getFullYear();

// 语言切换（记住偏好）
const root = document.documentElement;
const saved = localStorage.getItem('lang');
if (saved === 'en' || saved === 'zh') root.setAttribute('data-lang', saved);

const zhBtn = document.getElementById('to-zh');
const enBtn = document.getElementById('to-en');

if (zhBtn) zhBtn.addEventListener('click', () => {
  root.setAttribute('data-lang','zh');
  localStorage.setItem('lang','zh');
});
if (enBtn) enBtn.addEventListener('click', () => {
  root.setAttribute('data-lang','en');
  localStorage.setItem('lang','en');
});
