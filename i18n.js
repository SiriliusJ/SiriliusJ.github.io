(function () {
  const dict = {
    zh: {
      "Home":"<b>主页</b>",
      "Experience":"<b>经历</b>",
      "Coursework":"<b>课程</b>",
      "Misc":"<b>其他</b>",

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

      "AffilLine":"圣路易斯华盛顿大学 工程数据分析与统计 硕士 · Chen 实验室",
      "Hello":"我是圣路易斯华盛顿大学工程数据分析与统计（DAS）硕士生。当前从事组合优化与 graphon 哈密顿性质相关工作，兴趣在统计学习理论；更早也做过生成模型。2019 年入学时为物理专业，2020 年 11 月转至数学。",

      "Research":"研究方向（正在做/做过）",
      "Education":"教育经历",
      "SeeAllCoursework":"查看全部课程 →",

      "SelectedCoursework":"已修课程（精选）",
      "GradCompletedAt":"在（研究生阶段）已修课程",
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
      "Home":"<b>Home</b>",
      "Experience":"<b>Experience</b>",
      "Coursework":"<b>Coursework</b>",
      "Misc":"<b>Misc</b>",

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

      "AffilLine":"M.S. in Engineering Data Analytics & Statistics, Washington University in St. Louis · Chen Lab",
      "Hello":"I am an M.S. student in Engineering Data Analytics & Statistics at Washington University in St. Louis. My current work touches combinatorial optimization and Hamiltonicity on graphons; I’m broadly interested in statistical learning theory across ML/RL/DL, and earlier I explored generative models. I entered university in 2019 as a physics major and transferred to mathematics in Nov 2020.",

      "Research":"Research Topics (current & past)",
      "Education":"Education",
      "SeeAllCoursework":"See full coursework →",

      "SelectedCoursework":"Selected Coursework",
      "GradCompletedAt":"Selected graduate-level coursework completed at YOUR UNIVERSITY",
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
      "Home":"<b>ホーム</b>",
      "Experience":"<b>経験</b>",
      "Coursework":"<b>履修科目</b>",
      "Misc":"<b>その他</b>",

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

      "AffilLine":"ワシントン大学（セントルイス）DAS 修士 · Chen 研究室",
      "Hello":"私はワシントン大学セントルイス校の DＡS 修士課程の学生です。現在は組合せ最適化や graphon のハミルトン性に関連する研究に携わり、ML/RL/DL を横断する統計的学習理論に関心があります。以前は生成モデルにも取り組みました。2019 年に物理学専攻として入学し、2020 年 11 月に数学専攻へ変更しました。",

      "Research":"研究分野（現在/過去）",
      "Education":"学歴",
      "SeeAllCoursework":"履修一覧を見る →",

      "SelectedCoursework":"履修科目（抜粋）",
      "GradCompletedAt":"（大学院）履修科目（修了）",
      "UndergradCompletedAt":"（学部）履修科目（修了）",

      "PCBuilds":"自作PC",
      "BuildEarliest":"最初の自作PC",
      "BuildMostExpensive":"最も高価な自作PC",
      "BuildSchool":"キャンパスの組立PC",
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
