(function () {
  // 仅 EN 保留完整文案；ZH/JA 只保留“标题/导航/分区名”，其余键不写（显示为空）
  const dict = {
    zh: {
      // 顶栏
      "Home":"<b>主页</b>",
      "Experience":"<b>经历</b>",
      "Coursework":"<b>课程</b>",
      "Misc":"<b>其他</b>",

      // 分区标题
      "Biography":"<b>简介</b>",
      "Publications":"<b>论文</b>",
      "Selected Honors":"主要荣誉",
      "Milestone":"<b>里程碑</b>",
      "Teaching":"<b>教学与指导</b>",
      "Presentations":"<b>报告与展示</b>",
      "Projects":"<b>项目</b>",
      "Services":"<b>学术服务</b>",
      "Skills":"<b>技能</b>",
      "Languages":"<b>语言</b>",

      // 独立页标题
      "SelectedCoursework":"已修课程（精选）",
      "GradCompletedAt":"在（研究生阶段）已修课程",
      "GradAuditedAt":"在（研究生阶段）旁听课程",
      "UndergradCompletedAt":"在（本科阶段）已修课程",
      "PCBuilds":"装机",
      "PhotoWall":"照片墙"
      // 其余内部内容（Hello、AffilLine、SeeAllCoursework、honor*、timeline* 等）不写 → 显示为空
    },

    ja: {
      // ナビ
      "Home":"<b>ホーム</b>",
      "Experience":"<b>経験</b>",
      "Coursework":"<b>履修科目</b>",
      "Misc":"<b>その他</b>",

      // セクション見出し
      "Biography":"<b>略歴</b>",
      "Publications":"<b>業績</b>",
      "Selected Honors":"受賞（抜粋）",
      "Milestone":"<b>マイルストーン</b>",
      "Teaching":"<b>教育・指導</b>",
      "Presentations":"<b>発表</b>",
      "Projects":"<b>プロジェクト</b>",
      "Services":"<b>学術サービス</b>",
      "Skills":"<b>スキル</b>",
      "Languages":"<b>言語</b>",

      // 独立ページ見出し
      "SelectedCoursework":"履修科目（抜粋）",
      "GradCompletedAt":"（大学院）履修科目（修了）",
      "GradAuditedAt":"（大学院）履修科目（聴講）",
      "UndergradCompletedAt":"（学部）履修科目（修了）",
      "PCBuilds":"自作PC",
      "PhotoWall":"フォトウォール"
      // そのほかの内部文は未設定（空表示）
    },

    en: {
      // Nav
      "Home":"<b>Home</b>",
      "Experience":"<b>Experience</b>",
      "Coursework":"<b>Coursework</b>",
      "Misc":"<b>Misc</b>",

      // Section titles
      "Biography":"<b>Biography</b>",
      "Publications":"<b>Publications</b>",
      "Selected Honors":"Selected Honors",
      "Milestone":"<b>Milestone</b>",
      "Teaching":"<b>Teaching & Mentoring</b>",
      "Presentations":"<b>Presentations</b>",
      "Projects":"<b>Projects</b>",
      "Services":"<b>Services</b>",
      "Skills":"<b>Skills</b>",
      "Languages":"<b>Languages</b>",

      // Home — body texts（英文完整保留）
      "AffilLine":"M.S. in Engineering Data Analytics & Statistics, Washington University in St. Louis · Chen Lab",
      "Hello":"I am an M.S. student in Engineering Data Analytics & Statistics at Washington University in St. Louis. My current work touches combinatorial optimization and Hamiltonicity on graphons; I’m broadly interested in statistical learning theory across ML/RL/DL, and earlier I explored generative models. I entered university in 2019 as a physics major and transferred to mathematics in Nov 2020.",
      "Research":"Research Topics (current & past)",
      "Education":"Education",
      "SeeAllCoursework":"See full coursework →",

      // Coursework page
      "SelectedCoursework":"Selected Coursework",
      "GradCompletedAt":"Selected graduate-level coursework completed at YOUR UNIVERSITY",
      "GradAuditedAt":"Selected graduate-level coursework audited at YOUR UNIVERSITY",
      "UndergradCompletedAt":"Selected coursework completed at YOUR UNDERGRAD UNIVERSITY",

      // Misc page
      "PCBuilds":"PC Builds",
      "PhotoWall":"Photo Wall",
      "PhotoWallIntro":"A casual wall of memorable moments."
    }
  };

  const getLang = () => localStorage.getItem("lang") || "en";
  const setLang = (lang) => localStorage.setItem("lang", lang);

  // ✅ 新逻辑：ZH/JA 缺失或空值 → 显示“空字符串”；EN 正常显示英文
  function t(lang, key){
    if (lang === "en") return (dict.en[key] || "");
    const L = dict[lang] || {};
    // 如果在 ZH/JA 里显式给了值（哪怕是空字符串）就用它；否则显示空
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
