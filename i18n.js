(function () {
  const dict = {
    zh: {
      "Home":"<b>主页</b>",
      "Experience":"<b>经历</b>",
      "Coursework":"<b>课程</b>",
      "Misc":"<b>其他</b>",

      "Biography":"<b>简介</b>",
      "Publications":"<b>论文</b>",
      "HonorsAwards":"荣誉与奖项",
      "Milestone":"<b>里程碑</b>",
      "Teaching":"<b>教学与指导</b>",
      "Presentations":"<b>报告与展示</b>",
      "Projects":"<b>项目</b>",
      "Services":"<b>学术服务</b>",
      "Skills":"<b>技能</b>",
      "Languages":"<b>语言</b>",

      "SelectedCoursework":"已修课程（精选）",
      "GradCompletedAt":"在（研究生阶段）已修课程",
      "GradAuditedAt":"在（研究生阶段）旁听课程",
      "UndergradCompletedAt":"在（本科阶段）已修课程",
      "PCBuilds":"装机",
      "PhotoWall":"照片墙"
      /* 其它正文键（AffilLine/Hello/SeeAllCoursework 等）不写 → 中文显示为空 */
    },

    ja: {
      "Home":"<b>ホーム</b>",
      "Experience":"<b>経験</b>",
      "Coursework":"<b>履修科目</b>",
      "Misc":"<b>その他</b>",

      "Biography":"<b>略歴</b>",
      "Publications":"<b>業績</b>",
      "HonorsAwards":"受賞",
      "Milestone":"<b>マイルストーン</b>",
      "Teaching":"<b>教育・指導</b>",
      "Presentations":"<b>発表</b>",
      "Projects":"<b>プロジェクト</b>",
      "Services":"<b>学術サービス</b>",
      "Skills":"<b>スキル</b>",
      "Languages":"<b>言語</b>",

      "SelectedCoursework":"履修科目（抜粋）",
      "GradCompletedAt":"（大学院）履修科目（修了）",
      "GradAuditedAt":"（大学院）履修科目（聴講）",
      "UndergradCompletedAt":"（学部）履修科目（修了）",
      "PCBuilds":"自作PC",
      "PhotoWall":"フォトウォール"
      /* 正文键留空 */
    },

    en: {
      "Home":"<b>Home</b>",
      "Experience":"<b>Experience</b>",
      "Coursework":"<b>Coursework</b>",
      "Misc":"<b>Misc</b>",

      "Biography":"<b>Biography</b>",
      "Publications":"<b>Publications</b>",
      "HonorsAwards":"<b>Honors & Awards</b>",
      "Milestone":"<b>Milestone</b>",
      "Teaching":"<b>Teaching & Mentoring</b>",
      "Presentations":"<b>Presentations</b>",
      "Projects":"<b>Projects</b>",
      "Services":"<b>Services</b>",
      "Skills":"<b>Skills</b>",
      "Languages":"<b>Languages</b>",

      /* Home 正文（按你的要求改写） */
      "AffilLine":"Department of Electrical & Systems Engineering (ESE), Washington University in St. Louis",
      "Hello":"I’m an M.S. student at Washington University in St. Louis (ESE). My interests center on <b>learning theory</b> and its connections with discrete/continuous optimization; recently I worked on combinatorial optimization and Hamiltonicity on graphons, and earlier explored <b>generative models</b>. I’m generally curious about applying mathematics across domains—especially in engineering— and I am applying for Ph.D. programs for Fall 2026 entry.",

      "SeeAllCoursework":"See full coursework →",

      /* Coursework/Misc 标题英文保持 */
      "SelectedCoursework":"Selected Coursework",
      "GradCompletedAt":"Selected graduate-level coursework completed at YOUR UNIVERSITY",
      "GradAuditedAt":"Selected graduate-level coursework audited at YOUR UNIVERSITY",
      "UndergradCompletedAt":"Selected coursework completed at YOUR UNDERGRAD UNIVERSITY",
      "PCBuilds":"PC Builds",
      "PhotoWall":"Photo Wall",
      "PhotoWallIntro":"A casual wall of memorable moments."
    }
  };

  const getLang = () => localStorage.getItem("lang") || "en";
  const setLang = (lang) => localStorage.setItem("lang", lang);

  // ZH/JA：没有写的键显示空；EN 正常
  function t(lang, key){
    if (lang === "en") return (dict.en[key] || "");
    const L = dict[lang] || {};
    return (Object.prototype.hasOwnProperty.call(L, key) ? (L[key] || "") : "");
  }

  function applyI18n(lang) {
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      const attr = el.getAttribute("data-i18n-attr");
      const val = t(lang, key);
      if (attr) el.setAttribute(attr, val); else el.innerHTML = val;
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
