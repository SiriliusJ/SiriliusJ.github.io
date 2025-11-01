// i18n.js —— 简单的 data-i18n 替换；只读写 localStorage.lang
(function () {
  const dict = {
    zh: {
      "Biography": "<b>简介</b>",
      "Milestone": "<b>里程碑</b>",
      "Honors": "<b>主要荣誉</b>",
      "Selected Honors": "主要荣誉",
      "Publications": "<b>论文</b>",
      "Teaching": "<b>教学与学术服务</b>",
      "Misc": "<b>其他</b>",

      "College": "TODO：你的学校/学院/实验室/导师",
      "Hello": "TODO：你的中文简介，1-3句话，简要研究方向与当前身份。",

      "Research": "研究方向",
      "Machine": "TODO：方向A",
      "Time": "TODO：方向B",
      "Multimodal": "TODO：方向C",
      "Recommendation": "TODO：方向D",

      "Education": "教育经历",
      "Zhejiang": "TODO：学校A",
      "Academic": "TODO：学位/时间",
      "Xi": "TODO：学校B",
      "Bachelor": "TODO：学位/时间",

      "direction2": "TODO：研究方向标题",
      "timeline8": "<div class='timeline-date'> 2025-06 </div> <div class='timeline-title'> TODO：类别 </div> <div class='timeline-desc'> TODO：里程碑事件 </div>",
      "timeline7": "<div class='timeline-date'> 2025-03 </div> <div class='timeline-title'> TODO：类别 </div> <div class='timeline-desc'> TODO：里程碑事件 </div>",

      "honor11": "TODO：荣誉/奖项 #1",
      "honor10": "TODO：荣誉/奖项 #2",
      "honor9": "TODO：荣誉/奖项 #3"
    },
    en: {
      "Biography": "<b>Biography</b>",
      "Milestone": "<b>Milestone</b>",
      "Honors": "<b>Honors & Awards</b>",
      "Selected Honors": "Selected Honors",
      "Publications": "<b>Publications</b>",
      "Teaching": "<b>Teaching & Academic Service</b>",
      "Misc": "<b>Misc</b>",

      "College": "TODO: Your affiliation / lab / advisor",
      "Hello": "TODO: Your English bio paragraph (1–3 sentences).",

      "Research": "Research Topics",
      "Machine": "TODO: Topic A",
      "Time": "TODO: Topic B",
      "Multimodal": "TODO: Topic C",
      "Recommendation": "TODO: Topic D",

      "Education": "Education",
      "Zhejiang": "TODO: School A",
      "Academic": "TODO: Degree / Year",
      "Xi": "TODO: School B",
      "Bachelor": "TODO: Degree / Year",

      "direction2": "TODO: Direction Title",
      "timeline8": "<div class='timeline-date'> 2025-06 </div> <div class='timeline-title'> TODO: Category </div> <div class='timeline-desc'> TODO: timeline item </div>",
      "timeline7": "<div class='timeline-date'> 2025-03 </div> <div class='timeline-title'> TODO: Category </div> <div class='timeline-desc'> TODO: timeline item </div>",

      "honor11": "TODO: Honor / Award #1",
      "honor10": "TODO: Honor / Award #2",
      "honor9": "TODO: Honor / Award #3"
    }
  };

  const getLang = () => localStorage.getItem("lang") || "en";
  const setLang = (lang) => localStorage.setItem("lang", lang);

  function applyI18n(lang) {
    const table = dict[lang] || {};
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      const attr = el.getAttribute("data-i18n-attr"); // 可选：替换属性
      const val = table[key];
      if (!val) return;
      if (attr) el.setAttribute(attr, val);
      else el.innerHTML = val;
    });
    document.documentElement.setAttribute("data-lang", lang);
    const btn = document.getElementById("langToggle");
    if (btn) btn.textContent = (lang === "en") ? "中文 / EN" : "中文 / EN";
  }

  document.addEventListener("DOMContentLoaded", () => {
    const current = getLang();
    applyI18n(current);

    const btn = document.getElementById("langToggle");
    if (btn) btn.addEventListener("click", () => {
      const next = getLang() === "en" ? "zh" : "en";
      setLang(next);
      applyI18n(next);
    });
  });
})();
