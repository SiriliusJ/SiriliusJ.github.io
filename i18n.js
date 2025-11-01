(function () {
  const dict = {
    zh: {
      "Biography":"<b>简介</b>",
      "Milestone":"<b>里程碑</b>",
      "Honors":"<b>主要荣誉</b>",
      "Selected Honors":"主要荣誉",
      "Publications":"<b>论文</b>",
      "Teaching":"<b>教学与学术服务</b>",
      "Misc":"<b>其他</b>",
      "Coursework":"<b>课程</b>",

      "College":"TODO：你的学校/学院/实验室/导师",
      "Hello":"TODO：中文简介，1–3 句话，可强调你的数学课程背景。",

      "Research":"研究方向",
      "Machine":"TODO：方向A",
      "Time":"TODO：方向B",
      "Multimodal":"TODO：方向C",
      "Recommendation":"TODO：方向D",

      "Education":"教育经历",
      "Zhejiang":"TODO：学校A",
      "Academic":"TODO：学位/时间",
      "Xi":"TODO：学校B",
      "Bachelor":"TODO：学位/时间",

      "direction2":"TODO：研究方向标题",
      "timeline8":"<div class='timeline-date'> 2025-06 </div> <div class='timeline-title'> TODO </div> <div class='timeline-desc'> TODO </div>",
      "timeline7":"<div class='timeline-date'> 2025-03 </div> <div class='timeline-title'> TODO </div> <div class='timeline-desc'> TODO </div>",

      "honor11":"TODO：荣誉/奖项 #1",
      "honor10":"TODO：荣誉/奖项 #2",
      "honor9":"TODO：荣誉/奖项 #3",

      "SeeAllCoursework":"查看全部课程 →",
      "SelectedCoursework":"已修课程（精选）",
      "GradCompletedAt":"在（研究生阶段）已修课程",
      "GradAuditedAt":"在（研究生阶段）旁听课程",
      "UndergradCompletedAt":"在（本科阶段）已修课程",

      "PCBuilds":"装机",
      "BuildEarliest":"最早的一台装机",
      "BuildMostExpensive":"最贵的一台装机",
      "BuildSchool":"在学校装的一台装机",
      "BuildUSScavenged":"在美国预算/“捡垃圾”的一台装机",
      "BuildLab":"给实验室装的一台装机",
      "PhotoWall":"照片墙",
      "PhotoWallIntro":"一些有意思的照片记录。"
    },
    en: {
      "Biography":"<b>Biography</b>",
      "Milestone":"<b>Milestone</b>",
      "Honors":"<b>Honors & Awards</b>",
      "Selected Honors":"Selected Honors",
      "Publications":"<b>Publications</b>",
      "Teaching":"<b>Teaching & Academic Service</b>",
      "Misc":"<b>Misc</b>",
      "Coursework":"<b>Coursework</b>",

      "College":"TODO: Your affiliation / lab / advisor",
      "Hello":"TODO: English bio paragraph (1–3 sentences).",

      "Research":"Research Topics",
      "Machine":"TODO: Topic A",
      "Time":"TODO: Topic B",
      "Multimodal":"TODO: Topic C",
      "Recommendation":"TODO: Topic D",

      "Education":"Education",
      "Zhejiang":"TODO: School A",
      "Academic":"TODO: Degree / Year",
      "Xi":"TODO: School B",
      "Bachelor":"TODO: Degree / Year",

      "direction2":"TODO: Direction Title",
      "timeline8":"<div class='timeline-date'> 2025-06 </div> <div class='timeline-title'> TODO </div> <div class='timeline-desc'> TODO </div>",
      "timeline7":"<div class='timeline-date'> 2025-03 </div> <div class='timeline-title'> TODO </div> <div class='timeline-desc'> TODO </div>",

      "honor11":"TODO: Honor / Award #1",
      "honor10":"TODO: Honor / Award #2",
      "honor9":"TODO: Honor / Award #3",

      "SeeAllCoursework":"See full coursework →",
      "SelectedCoursework":"Selected Coursework",
      "GradCompletedAt":"Selected graduate-level coursework completed at YOUR UNIVERSITY",
      "GradAuditedAt":"Selected graduate-level coursework audited at YOUR UNIVERSITY",
      "UndergradCompletedAt":"Selected coursework completed at YOUR UNDERGRAD UNIVERSITY",

      "PCBuilds":"PC Builds",
      "BuildEarliest":"Earliest PC Build",
      "BuildMostExpensive":"Most Expensive Build",
      "BuildSchool":"Campus Build",
      "BuildUSScavenged":"US Budget/Scavenged Build",
      "BuildLab":"Lab Workstation Build",
      "PhotoWall":"Photo Wall",
      "PhotoWallIntro":"A casual wall of memorable moments."
    },
    ja: {
      "Biography":"<b>略歴</b>",
      "Milestone":"<b>マイルストーン</b>",
      "Honors":"<b>受賞</b>",
      "Selected Honors":"受賞（抜粋）",
      "Publications":"<b>業績</b>",
      "Teaching":"<b>教育・学術サービス</b>",
      "Misc":"<b>その他</b>",
      "Coursework":"<b>履修科目</b>",

      "College":"TODO：所属／研究室／指導教員",
      "Hello":"TODO：日本語の自己紹介（1〜3文）。",

      "Research":"研究分野",
      "Machine":"TODO：分野A",
      "Time":"TODO：分野B",
      "Multimodal":"TODO：分野C",
      "Recommendation":"TODO：分野D",

      "Education":"学歴",
      "Zhejiang":"TODO：学校A",
      "Academic":"TODO：学位・年度",
      "Xi":"TODO：学校B",
      "Bachelor":"TODO：学位・年度",

      "direction2":"TODO：研究トピック",
      "SeeAllCoursework":"履修一覧を見る →",
      "SelectedCoursework":"履修科目（抜粋）",
      "GradCompletedAt":"（大学院）履修科目（修了）",
      "GradAuditedAt":"（大学院）履修科目（聴講）",
      "UndergradCompletedAt":"（学部）履修科目（修了）",

      "PCBuilds":"自作PC",
      "BuildEarliest":"最初の自作PC",
      "BuildMostExpensive":"最も高価な自作PC",
      "BuildSchool":"キャンパスでの組立PC",
      "BuildUSScavenged":"米国・格安/拾得パーツPC",
      "BuildLab":"研究室用ワークステーション",
      "PhotoWall":"フォトウォール",
      "PhotoWallIntro":"思い出の写真をゆるく展示します。"
    }
  };

  const getLang = () => localStorage.getItem("lang") || "en";
  const setLang = (lang) => localStorage.setItem("lang", lang);

  // 缺词回退到英文
  function t(lang, key){
    const L = dict[lang] || dict.en;
    return (L && L[key]) || dict.en[key] || "";
  }

  function applyI18n(lang) {
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      const attr = el.getAttribute("data-i18n-attr");
      const val = t(lang, key);
      if (!val) return;
      if (attr) el.setAttribute(attr, val);
      else el.innerHTML = val;
    });
    document.documentElement.setAttribute("data-lang", lang);
    document.querySelectorAll(".lang-btn").forEach(btn=>{
      btn.classList.toggle("active", btn.getAttribute("data-lang")===lang);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    const current = getLang();
    applyI18n(current);
    document.querySelectorAll(".lang-btn").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const to = btn.getAttribute("data-lang") || "en";
        setLang(to); applyI18n(to);
      });
    });
  });
})();

