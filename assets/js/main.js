// 年份
document.getElementById('year').textContent = new Date().getFullYear();

// 语言切换（记住偏好）
const root = document.documentElement;
const saved = localStorage.getItem('lang');
if (saved === 'en' || saved === 'zh') root.setAttribute('data-lang', saved);

document.getElementById('to-zh').addEventListener('click', () => {
  root.setAttribute('data-lang','zh');
  localStorage.setItem('lang','zh');
});
document.getElementById('to-en').addEventListener('click', () => {
  root.setAttribute('data-lang','en');
  localStorage.setItem('lang','en');
});
