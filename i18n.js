(function () {
  const dict = {
    zh: {
      "Home":"<b>主页</b>",
      "Experience":"<b>经历</b>",
      "Coursework":"<b>课程</b>",
      "Misc":"<b>其他</b>",

      "Biography":"<b>简介</b>",
      "Education":"<b>教育经历</b>",
      "Publications":"<b>论文</b>",
      "HonorsAwards":"<b>荣誉与奖项</b>",
      "Milestone":"<b>里程碑</b>",
      "Teaching":"<b>教学与指导</b>",
      "Presentations":"<b>报告与展示</b>",
      "Projects":"<b>项目</b>",
      "Services":"<b>学术服务</b>",
      "Skills":"<b>技能</b>",
      "Languages":"<b>语言</b>",

      "SelectedCoursework":"已修课程（精选）",
      "MastersSection":"硕士阶段（WUSTL）",
      "GapPeriod":"间隔阶段（备考）",
      "UndergraduateSection":"本科阶段（UCAS）",
      "Completed":"已修",
      "CompletedByDiscipline":"已修（按学科）",
      "Audited":"旁听",
      "Seminar":"讨论班",
      "Mathematics":"数学",
      "Physics":"物理",
      "ComputerScience":"计算机",

      "PCBuilds":"装机",
      "PhotoWall":"照片墙"
      /* 正文键留空：AffilLine/Hello/SeeAllCoursework 等 */
    },

    ja: {
      "Home":"<b>ホーム</b>",
      "Experience":"<b>経験</b>",
      "Coursework":"<b>履修科目</b>",
      "Misc":"<b>その他</b>",

      "Biography":"<b>略歴</b>",
      "Education":"<b>学歴</b>",
      "Publications":"<b>業績</b>",
      "HonorsAwards":"<b>受賞</b>",
      "Milestone":"<b>マイルストーン</b>",
      "Teaching":"<b>教育・指導</b>",
      "Presentations":"<b>発表</b>",
      "Projects":"<b>プロジェクト</b>",
      "Services":"<b>学術サービス</b>",
      "Skills":"<b>スキル</b>",
      "Languages":"<b>言語</b>",

      "SelectedCoursework":"履修科目（抜粋）",
      "MastersSection":"大学院（WUSTL）",
      "GapPeriod":"ギャップ期間（受験準備）",
      "UndergraduateSection":"学部（UCAS）",
      "Completed":"修了",
      "CompletedByDiscipline":"修了（分野別）",
      "Audited":"聴講",
      "Seminar":"ゼミ・講読会",
      "Mathematics":"数学",
      "Physics":"物理",
      "ComputerScience":"情報・計算機",

      "PCBuilds":"自作PC",
      "PhotoWall":"フォトウォール"
    },

    en: {
      "Home":"<b>Home</b>",
      "Experience":"<b>Experience</b>",
      "Coursework":"<b>Coursework</b>",
      "Misc":"<b>Misc</b>",

      "Biography":"<b>Biography</b>",
      "Education":"<b>Education</b>",
      "Publications":"<b>Publications</b>",
      "HonorsAwards":"<b>Honors & Awards</b>",
      "Milestone":"<b>Milestone</b>",
      "Teaching":"<b>Teaching & Mentoring</b>",
      "Presentations":"<b>Presentations</b>",
      "Projects":"<b>Projects</b>",
      "Services":"<b>Services</b>",
      "Skills":"<b>Skills</b>",
      "Languages":"<b>Languages</b>",

      /* Home 正文（仍保持英文；中文/日语留空） */
      "AffilLine":"Department of Electrical & Systems Engineering (ESE), Washington University in St. Louis",
      "Hello":"I’m an M.S. student at Washington University in St. Louis (ESE), supervised by <a class='ext-link' href='https://sites.wustl.edu/chen/' target='_blank' rel='noreferrer'>Prof. Xudong Chen</a>. My interests center on <b>learning theory</b> and its connections with optimization. Recently I worked on combinatorial optimization and Hamiltonicity on graphons, and earlier explored <b>generative models</b>. I’m generally curious about applying mathematics across domains, especially in engineering. I am applying for Ph.D. programs for Fall 2026 entry.",

      "SeeAllCoursework":"See full coursework →",

      /* Coursework 子标题 */
      "SelectedCoursework":"Selected Coursework",
      "MastersSection":"Master’s coursework (WUSTL)",
      "GapPeriod":"Gap period (pre-exam preparation)",
      "UndergraduateSection":"Undergraduate coursework (UCAS)",
      "Completed":"Completed",
      "CompletedByDiscipline":"Completed (by discipline)",
      "Audited":"Audited",
      "Seminar":"Seminar",
      "Mathematics":"Mathematics",
      "Physics":"Physics",
      "ComputerScience":"Computer Science",

      /* Misc 标题保留 */
      "PCBuilds":"PC Builds",
      "PhotoWall":"Photo Wall",
      "PhotoWallIntro":"A few photos I find particularly memorable or just amusing.",

      "BuildEarliest":"Earliest PC Build",
      "BuildMostExpensive":"Most Expensive Build",
      "BuildUSScavenged":"Scavenged Build",
      "BuildLab":"Confidentiality Checking..."

  };

  const getLang = () => localStorage.getItem("lang") || "en";
  const setLang = (lang) => localStorage.setItem("lang", lang);

  // ZH/JA 未设置键显示空；EN 正常
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
