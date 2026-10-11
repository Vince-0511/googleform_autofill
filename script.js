// ==UserScript==
// @name         Google Form Auto Filler (Starter)
// @namespace    https://example.local/
// @version      1.0
// @description  Fill name, email, student ID, suggestion, feedback and pick the highest score on Google Forms
// @match        https://docs.google.com/forms/*
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(function () {
  "use strict";

  // ---------- Saved settings ----------
  const DEFAULTS = {
    name: "",
    email: "",
    studentId: "",
    suggestion: "No major suggestions at the moment. More examples and interactive activities could make it even better.",
    feedback: "Thank you for the session. Everything was clear and well organized. Keep up the good work!",
    highest: true,
    lang: "BI",
  };

  function loadSettings() {
    return { ...DEFAULTS, ...(GM_getValue("settings", {})) };
  }
  function saveSettings(s) {
    GM_setValue("settings", s);
  }

  // ---------- Keywords (English / Malay / Chinese) ----------
  // Matched against the question text (lowercased). Add more words here if needed.
  const KEYS = {
    email: ["email", "e-mail", "emel", "e-mel", "邮箱", "邮件", "电邮", "電郵", "郵箱", "郵件"],
    studentId: ["student id", "student no", "matric", "id number", "id pelajar", "no. pelajar", "no pelajar",
                "matrik", "no. matriks", "nombor matrik", "学号", "學號", "学生证", "學生證", "学生编号", "学生編號"],
    name: ["name", "nama", "姓名", "名字", "全名", "名称", "名稱"],
    suggestion: ["suggest", "cadang", "saran", "syor", "建议", "建議"],
    feedback: ["feedback", "comment", "maklum balas", "komen", "ulasan", "反馈", "反饋", "意见", "意見", "评论", "評論"],
  };
  const hasAny = (label, list) => list.some((k) => label.includes(k));

  // Decide which saved text a question wants.
  // useFallback = true: unrecognised questions get the feedback text (used for long-answer boxes).
  function textFor(label, s, useFallback) {
    const wantsSuggestion = hasAny(label, KEYS.suggestion);
    const wantsFeedback = hasAny(label, KEYS.feedback);
    if (wantsSuggestion && wantsFeedback) return [s.feedback, s.suggestion].filter(Boolean).join(" ");
    if (wantsSuggestion) return s.suggestion;
    if (wantsFeedback) return s.feedback;
    return useFallback ? s.feedback : "";
  }

  // ---------- Helpers ----------
  // Set a value in a way Google Forms notices
  function setValue(el, val) {
    const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value").set.call(el, val);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  // Get the question text that belongs to an input
  function labelOf(el) {
    const item = el.closest('[role="listitem"]');
    const heading = item && item.querySelector('[role="heading"]');
    return (heading ? heading.innerText : "").toLowerCase();
  }

  function insidePanel(el) {
    return el.closest("#gf-filler-panel") !== null;
  }

  // ---------- The actual filling ----------
  function fillForm(s) {
    let count = { info: 0, scores: 0, text: 0 };

    // 1. Name and email (short-answer boxes, matched by question text)
    document.querySelectorAll('input[type="text"], input[type="email"]').forEach((input) => {
      if (insidePanel(input) || input.value) return;
      const label = labelOf(input);
      const isEmail = input.type === "email" || hasAny(label, KEYS.email);

      // Order matters: email first, then student ID, then name
      if (isEmail && s.email) {
        setValue(input, s.email);
        count.info++;
      } else if (hasAny(label, KEYS.studentId) && s.studentId) {
        setValue(input, s.studentId);
        count.info++;
      } else if (hasAny(label, KEYS.name) && s.name) {
        setValue(input, s.name);
        count.info++;
      } else {
        // Short-answer box asking for a suggestion or feedback
        const text = textFor(label, s, false);
        if (text) {
          setValue(input, text);
          count.text++;
        }
      }
    });

    // 2. Scores: click the last option in scale-like groups
    if (s.highest) {
      document.querySelectorAll('[role="radiogroup"]').forEach((group) => {
        if (insidePanel(group)) return;
        const options = group.querySelectorAll('[role="radio"]');
        if (options.length >= 3 && options.length <= 7) {
          options[options.length - 1].click();
          count.scores++;
        }
      });
    }

    // 3. Suggestion / feedback: long-answer boxes (matched by question, otherwise feedback)
    document.querySelectorAll("textarea").forEach((box) => {
      if (insidePanel(box) || box.value) return;
      const text = textFor(labelOf(box), s, true);
      if (!text) return;
      setValue(box, text);
      count.text++;
    });

    return count;
  }

  // ---------- Panel language (BC = Chinese, BI = English, BM = Malay) ----------
  const LANGS = [
    { code: "BC", tip: "Bahasa Cina (中文)" },
    { code: "BI", tip: "Bahasa Inggeris (English)" },
    { code: "BM", tip: "Bahasa Melayu" },
  ];

  const TEXT = {
    BI: {
      title: "Auto Filler", name: "Name", email: "Email", studentId: "Student ID",
      suggestion: "Suggestion", feedback: "Feedback", highest: "Select highest score", fill: "Save & Fill",
      status: (c) => `Filled: ${c.info} info, ${c.scores} scores, ${c.text} text answers. Please review before submitting.`,
    },
    BM: {
      title: "Auto Isi", name: "Nama", email: "Emel", studentId: "ID Pelajar",
      suggestion: "Cadangan", feedback: "Maklum Balas", highest: "Pilih skor tertinggi", fill: "Simpan & Isi",
      status: (c) => `Diisi: ${c.info} maklumat, ${c.scores} skor, ${c.text} jawapan teks. Sila semak sebelum menghantar.`,
    },
    BC: {
      title: "自动填写", name: "姓名", email: "邮箱", studentId: "学号",
      suggestion: "建议", feedback: "反馈", highest: "选择最高分", fill: "保存并填写",
      status: (c) => `已填写：${c.info} 项资料，${c.scores} 个评分，${c.text} 个文字回答。提交前请检查。`,
    },
  };

  // ---------- Floating panel ----------
  function buildPanel() {
    const s = loadSettings();
    let lang = TEXT[s.lang] ? s.lang : "BI";
    let lastCount = null; // so the status message can be re-translated

    const panel = document.createElement("div");
    panel.id = "gf-filler-panel";
    panel.style.cssText = `
      position: fixed; right: 16px; bottom: 16px; z-index: 99999;
      width: 280px; padding: 12px; border-radius: 10px;
      background: #fff; color: #202124; font: 13px/1.4 Arial, sans-serif;
      box-shadow: 0 2px 12px rgba(0,0,0,.3); box-sizing: border-box;
    `;

    // Build elements with DOM methods (Google Forms blocks innerHTML via Trusted Types)
    function make(tag, attrs, style, text) {
      const e = document.createElement(tag);
      if (attrs) Object.assign(e, attrs);
      if (style) e.style.cssText = style;
      if (text) e.textContent = text;
      return e;
    }
    // A span whose text is swapped when the language changes
    function tr(key) {
      const e = make("span");
      e.dataset.i18n = key;
      return e;
    }
    function field(key, control) {
      const l = make("label");
      l.append(tr(key), document.createElement("br"), control);
      return l;
    }
    const FULL = "width:100%;box-sizing:border-box;margin-bottom:6px;";

    // Header: title on the left, language switcher + collapse button on the right
    const title = make("strong");
    title.dataset.i18n = "title";

    const langBox = make("div", null, "display:flex;gap:2px;align-items:center;");
    LANGS.forEach(({ code, tip }) => {
      langBox.append(make("button", { id: "gf-lang-" + code, title: tip }, "", code));
    });
    const toggle = make("button", { id: "gf-toggle" }, "border:0;background:none;cursor:pointer;font-size:16px;margin-left:4px;", "–");
    const right = make("div", null, "display:flex;align-items:center;");
    right.append(langBox, toggle);

    const header = make("div", null, "display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;");
    header.append(title, right);

    const body = make("div", { id: "gf-body" });
    const highestLabel = make("label", null, "display:block;margin-bottom:8px;");
    highestLabel.append(make("input", { id: "gf-highest", type: "checkbox" }), " ", tr("highest"));

    const fillBtn = make("button", { id: "gf-fill" }, "width:100%;padding:8px;border:0;border-radius:6px;background:#673ab7;color:#fff;cursor:pointer;");
    fillBtn.dataset.i18n = "fill";

    body.append(
      field("name", make("input", { id: "gf-name", type: "text" }, FULL)),
      field("email", make("input", { id: "gf-email", type: "text" }, FULL)),
      field("studentId", make("input", { id: "gf-studentid", type: "text" }, FULL)),
      field("suggestion", make("textarea", { id: "gf-suggestion", rows: 3 }, FULL)),
      field("feedback", make("textarea", { id: "gf-feedback", rows: 3 }, FULL)),
      highestLabel,
      fillBtn,
      make("div", { id: "gf-status" }, "margin-top:6px;color:#5f6368;min-height:16px;")
    );

    panel.append(header, body);
    document.body.appendChild(panel);

    // Apply the current language to every label, the status line and the language buttons
    function applyLanguage() {
      panel.querySelectorAll("[data-i18n]").forEach((el) => {
        el.textContent = TEXT[lang][el.dataset.i18n];
      });
      panel.querySelector("#gf-status").textContent = lastCount ? TEXT[lang].status(lastCount) : "";
      LANGS.forEach(({ code }) => {
        const active = code === lang;
        panel.querySelector("#gf-lang-" + code).style.cssText =
          "cursor:pointer;font-size:11px;font-weight:bold;padding:2px 5px;border-radius:4px;" +
          "border:1px solid #673ab7;" +
          (active ? "background:#673ab7;color:#fff;" : "background:#fff;color:#673ab7;");
      });
    }

    // Load saved values into the panel (via .value, not innerHTML, so it's safe)
    panel.querySelector("#gf-name").value = s.name;
    panel.querySelector("#gf-email").value = s.email;
    panel.querySelector("#gf-studentid").value = s.studentId;
    panel.querySelector("#gf-suggestion").value = s.suggestion;
    panel.querySelector("#gf-feedback").value = s.feedback;
    panel.querySelector("#gf-highest").checked = s.highest;
    applyLanguage();

    // Language switcher: change the panel language and remember it
    LANGS.forEach(({ code }) => {
      panel.querySelector("#gf-lang-" + code).addEventListener("click", () => {
        lang = code;
        saveSettings({ ...loadSettings(), lang });
        applyLanguage();
      });
    });

    // Collapse / expand
    toggle.addEventListener("click", () => {
      const hidden = body.style.display === "none";
      body.style.display = hidden ? "block" : "none";
      toggle.textContent = hidden ? "–" : "+";
    });

    // Save & Fill
    fillBtn.addEventListener("click", () => {
      const settings = {
        name: panel.querySelector("#gf-name").value.trim(),
        email: panel.querySelector("#gf-email").value.trim(),
        studentId: panel.querySelector("#gf-studentid").value.trim(),
        suggestion: panel.querySelector("#gf-suggestion").value.trim(),
        feedback: panel.querySelector("#gf-feedback").value.trim(),
        highest: panel.querySelector("#gf-highest").checked,
        lang,
      };
      saveSettings(settings);
      lastCount = fillForm(settings);
      panel.querySelector("#gf-status").textContent = TEXT[lang].status(lastCount);
    });
  }

  // Wait a moment for the form to render, then show the panel
  setTimeout(buildPanel, 1000);
})();