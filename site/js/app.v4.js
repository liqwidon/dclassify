/* ===== Product Wiki — App v4 ===== */
(function () {
  "use strict";

  var CONFIG = null;
  var searchQuery = "";
  var searchIndex = -1;
  var searchResults = [];
  var debounceTimer = null;
  var scrollPositions = {};    // remember scroll per section

  /* ---- icons ---- */
  var ICONS = {
    home:    '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12l9-8 9 8"/><path d="M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9"/></svg>',
    history: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>',
    folder:  '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/></svg>',
    pdf:     '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>',
    video:   '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M10 9l5 3-5 3V9z"/></svg>',
    dl:      '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v10m0 0l-4-4m4 4l4-4"/><path d="M4 17v2a1 1 0 001 1h14a1 1 0 001-1v-2"/></svg>',
    back:    '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5m0 0l6 6m-6-6l6-6"/></svg>',
    sun:     '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2m0 18v2m-9-11h2m18 0h2m-3.64-6.36l-1.42 1.42M6.34 17.66l-1.42 1.42m0-13.08l1.42 1.42m11.32 11.32l1.42 1.42"/></svg>',
    moon:    '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z"/></svg>',
    chevron: '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>',
    close:   '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>',
    link:    '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 007.07 0l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.07 0l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>',
    external:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><path d="M15 3h6v6"/><path d="M10 14L21 3"/></svg>',
  };

  var $ = function (s, p) { return (p || document).querySelector(s); };
  var $$ = function (s, p) { return (p || document).querySelectorAll(s); };
  var el = function (tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html) e.innerHTML = html; return e; };

  /* =============== BOOT =============== */
  async function boot() {
    try {
      var r = await fetch("site-config.json?v=" + Date.now());
      CONFIG = await r.json();
    } catch (e) {
      document.body.innerHTML = "<p style='padding:40px;color:#d9434e'>Ошибка загрузки site-config.json</p>";
      return;
    }
    initTheme();
    buildSidebar();
    initSearch();
    initKeyboard();
    window.addEventListener("hashchange", onHash);
    onHash();
  }

  /* =============== THEME =============== */
  function initTheme() {
    var saved = localStorage.getItem("pw-theme");
    applyTheme(saved || "light");
    $(".theme-btn").addEventListener("click", function () {
      var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next);
      localStorage.setItem("pw-theme", next);
    });
  }
  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    $(".theme-btn").innerHTML = t === "dark" ? ICONS.sun : ICONS.moon;
  }

  /* =============== SIDEBAR =============== */
  function buildSidebar() {
    $(".site-title").textContent = CONFIG.site.title;
    $(".site-ver").textContent = "v" + CONFIG.site.version;

    var logoWrap = $(".logo-wrap");
    if (CONFIG.site.logo) {
      logoWrap.innerHTML = '<img class="logo-img" src="' + CONFIG.site.logo + '" alt="Logo">';
    } else {
      logoWrap.innerHTML = '<div class="logo-fallback">' + CONFIG.site.title.charAt(0) + '</div>';
    }

    var nav = $(".sidebar-nav");
    nav.innerHTML = "";
    CONFIG.sections.forEach(function (sec) {
      var item = el("div", "nav-item");
      item.dataset.id = sec.id;
      item.innerHTML = '<span class="icon">' + (ICONS[sec.icon] || ICONS.folder) +
        '</span><span class="nav-label">' + sec.title + '</span>';
      item.addEventListener("click", function () {
        clearSearch();
        location.hash = "#/" + sec.id;
      });
      nav.appendChild(item);
    });
  }

  /* =============== SEARCH =============== */
  function initSearch() {
    var input = $("#search-input");
    var clearBtn = $("#search-clear");

    input.addEventListener("input", function () {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function () {
        searchQuery = input.value.trim().toLowerCase();
        searchIndex = -1;
        updateClearBtn();
        renderSearch();
      }, 120);
    });

    input.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        clearSearch();
        input.blur();
        onHash();
        return;
      }
      if (!searchQuery) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        searchIndex = Math.min(searchIndex + 1, searchResults.length - 1);
        highlightSearchResult();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        searchIndex = Math.max(searchIndex - 1, 0);
        highlightSearchResult();
      } else if (e.key === "Enter" && searchIndex >= 0 && searchResults[searchIndex]) {
        e.preventDefault();
        var r = searchResults[searchIndex];
        clearSearch();
        location.hash = "#/" + r.sec.id + "/" + r.item.id;
      }
    });

    clearBtn.addEventListener("click", function () {
      clearSearch();
      input.focus();
      onHash();
    });
  }

  function renderSearch() {
    if (searchQuery) {
      // Always show search overlay regardless of current page
      var area = $(".content-area");
      area.innerHTML = "";
      area.scrollTop = 0;
      $(".topbar-title").textContent = "";
      $$(".nav-item").forEach(function (n) { n.classList.remove("active"); });
      renderBreadcrumb(area, [{ label: "Поиск" }]);
      renderGlobalSearch(area);
    } else {
      onHash();
    }
  }

  function highlightSearchResult() {
    $$(".search-result-row").forEach(function (row, i) {
      row.classList.toggle("search-focused", i === searchIndex);
    });
    var focused = $(".search-focused");
    if (focused) focused.scrollIntoView({ block: "nearest" });
  }

  function clearSearch() {
    searchQuery = "";
    searchIndex = -1;
    searchResults = [];
    $("#search-input").value = "";
    updateClearBtn();
  }

  function updateClearBtn() {
    var btn = $("#search-clear");
    btn.style.display = searchQuery ? "flex" : "none";
  }

  function initKeyboard() {
    document.addEventListener("keydown", function (e) {
      if ((e.ctrlKey && e.key === "k") || (e.key === "/" && e.target.tagName !== "INPUT")) {
        e.preventDefault();
        $("#search-input").focus();
      }
    });
  }

  /* =============== ROUTING =============== */
  function onHash() {
    // If search is active, don't navigate — keep search results
    if (searchQuery) {
      renderSearch();
      return;
    }

    var hash = location.hash || "";
    var parts = hash.replace(/^#\/?/, "").split("/");
    var sectionId = parts[0] || CONFIG.sections[0].id;
    var itemId = parts[1] || null;

    var sec = CONFIG.sections.find(function (s) { return s.id === sectionId; });
    if (!sec) { sec = CONFIG.sections[0]; sectionId = sec.id; }

    // highlight nav
    $$(".nav-item").forEach(function (n) {
      n.classList.toggle("active", n.dataset.id === sectionId);
    });

    var area = $(".content-area");

    // save scroll position before changing content
    var prevHash = area.dataset.hash || "";
    if (prevHash) scrollPositions[prevHash] = area.scrollTop;

    area.innerHTML = "";
    area.dataset.hash = hash;

    // Subview (PDF / video)
    if (itemId && sec.items) {
      var item = sec.items.find(function (i) { return i.id === itemId; });
      if (item) {
        $(".topbar-title").textContent = "";
        renderBreadcrumb(area, [
          { label: sec.title, hash: "#/" + sec.id },
          { label: item.title }
        ]);
        renderSubview(area, sec, item);
        return;
      }
    }

    $(".topbar-title").textContent = "";
    renderBreadcrumb(area, [{ label: sec.title }]);

    switch (sec.type) {
      case "home":       renderHome(area, sec); break;
      case "changelog":  renderChangelog(area, sec); break;
      case "media-list": renderMediaList(area, sec); break;
    }

    // restore scroll
    var saved = scrollPositions[hash];
    if (saved) setTimeout(function () { area.scrollTop = saved; }, 0);
  }

  /* =============== BREADCRUMB =============== */
  function renderBreadcrumb(area, parts) {
    var bc = el("nav", "breadcrumb");
    parts.forEach(function (p, i) {
      if (i > 0) bc.appendChild(el("span", "bc-sep", ICONS.chevron));
      var span = el("span", "bc-item" + (p.hash ? " bc-link" : " bc-current"), esc(p.label));
      if (p.hash) {
        span.addEventListener("click", function () {
          clearSearch();
          location.hash = p.hash;
        });
      }
      bc.appendChild(span);
    });
    area.appendChild(bc);
  }

  /* =============== RENDERERS =============== */
  function renderHome(area, sec) {
    var d = el("div", "home-hero");
    d.innerHTML = "<h1>" + esc(sec.content.heading) + "</h1><p>" + esc(sec.content.description) + "</p>";

    var mediaSections = CONFIG.sections.filter(function (s) { return s.type === "media-list"; });
    if (mediaSections.length) {
      var grid = el("div", "home-grid");
      mediaSections.forEach(function (ms) {
        var card = el("div", "home-card");
        card.innerHTML = '<div class="hc-icon">' + (ICONS[ms.icon] || ICONS.folder) + '</div>' +
          '<div class="hc-title">' + esc(ms.title) + '</div>';
        card.addEventListener("click", function () { location.hash = "#/" + ms.id; });
        grid.appendChild(card);
      });
      d.appendChild(grid);
    }

    area.appendChild(d);
  }

  async function renderChangelog(area, sec) {
    var wrap = el("div", "changelog-body");
    wrap.innerHTML = "<p style='color:var(--text-dim)'>Загрузка…</p>";
    area.appendChild(wrap);
    try {
      var r = await fetch(sec.content.file);
      wrap.innerHTML = await r.text();
      collapseVersions(wrap);                  // ← НОВАЯ СТРОКА
    } catch (e) {
      wrap.innerHTML = "<p style='color:var(--red)'>Не удалось загрузить changelog</p>";
    }
  }

  function collapseVersions(root) {
    var nodes = Array.prototype.slice.call(root.children);
    var groups = [];
    var current = null;

    nodes.forEach(function (n) {
      if (n.tagName === "H2") {
        current = { heading: n, body: [] };
        groups.push(current);
      } else if (current) {
        current.body.push(n);
      }
    });

    groups.forEach(function (g, idx) {
      var details = document.createElement("details");
      details.className = "cl-version";
      if (idx === 0) details.open = false;  // первая версия раскрыта

      var summary = document.createElement("summary");
      summary.innerHTML = g.heading.innerHTML;
      details.appendChild(summary);

      g.body.forEach(function (b) { details.appendChild(b); });
      g.heading.replaceWith(details);
    });
  }


  function renderMediaList(area, sec) {
    var items = sec.items || [];
    if (!items.length) {
      area.appendChild(el("div", "no-results", "Нет материалов"));
      return;
    }

    // Группируем материалы по полю item.group, сохраняя порядок появления.
    // Материалы без group собираются в одну безымянную группу и показываются первыми.
    var order = [];
    var buckets = {};
    items.forEach(function (item) {
      var key = item.group || "";
      if (!(key in buckets)) { buckets[key] = []; order.push(key); }
      buckets[key].push(item);
    });

    var hasNamedGroups = order.some(function (k) { return k !== ""; });

    // Приоритет групп: перечисленные здесь всегда идут первыми, в этом порядке,
    // независимо от порядка материалов в конфиге. Раздел может задать свой список
    // через "groupOrder" в site-config.json; по умолчанию сверху закреплены «Обновления».
    var priority = (sec.groupOrder && sec.groupOrder.length) ? sec.groupOrder : ["Обновления"];
    order.sort(function (a, b) {
      var ia = priority.indexOf(a); if (ia === -1) ia = priority.length;
      var ib = priority.indexOf(b); if (ib === -1) ib = priority.length;
      return ia - ib; // стабильная сортировка: при равенстве сохраняется исходный порядок
    });

    order.forEach(function (key) {
      if (hasNamedGroups && key) {
        area.appendChild(el("div", "media-group-head", esc(key)));
      }
      var list = el("div", "media-list");
      buckets[key].forEach(function (item) {
        list.appendChild(buildMediaRow(sec, item, false));
      });
      area.appendChild(list);
    });
  }

  /* ---- global search results ---- */
  function renderGlobalSearch(area) {
    searchResults = [];
    var totalFound = 0;
    var container = el("div", "search-results");

    CONFIG.sections.forEach(function (sec) {
      if (sec.type !== "media-list" || !sec.items) return;
      var matches = sec.items.filter(function (it) {
        if (it.title.toLowerCase().indexOf(searchQuery) !== -1) return true;
        return it.description && it.description.toLowerCase().indexOf(searchQuery) !== -1;
      });
      if (!matches.length) return;
      totalFound += matches.length;

      var heading = el("div", "search-group-head", esc(sec.title));
      container.appendChild(heading);

      var list = el("div", "media-list");
      matches.forEach(function (item) {
        searchResults.push({ sec: sec, item: item });
        var row = buildMediaRow(sec, item, true);
        row.classList.add("search-result-row");
        list.appendChild(row);
      });
      container.appendChild(list);
    });

    // banner
    var banner = el("div", "search-banner");
    banner.innerHTML = 'Найдено: ' + totalFound + ' ' + pluralize(totalFound, 'результат', 'результата', 'результатов') +
      ' по запросу «' + esc(searchQuery) + '»';
    area.appendChild(banner);

    if (totalFound === 0) {
      area.appendChild(el("div", "no-results", "Ничего не найдено. Попробуйте изменить запрос."));
    } else {
      area.appendChild(container);
    }
  }

  /* ---- media row builder ---- */
  function buildMediaRow(sec, item, isSearch) {
    var row = el("div", "media-item" + (isSearch ? " search-hit" : ""));
    var iconCls, typeLabel;
    if (item.type === "pdf") {
      iconCls = "pdf"; typeLabel = "PDF";
    } else if (item.type === "link") {
      iconCls = "link"; typeLabel = item.tag || (item.url || (item.links && item.links.length) ? "Ссылка" : "Материал");
    } else {
      iconCls = "video"; typeLabel = "Видео";
    }
    var nameHtml = isSearch ? highlightMatch(item.title, searchQuery) : esc(item.title);

    row.innerHTML =
      '<div class="media-icon ' + iconCls + '">' + (ICONS[item.type] || "") + '</div>' +
      '<div class="media-info"><div class="name">' + nameHtml + '</div>' +
      '<span class="type-tag ' + iconCls + '">' + typeLabel + '</span>' +
      (isSearch ? '<span class="search-section-hint">' + esc(sec.title) + '</span>' : '') +
      '</div>';
    row.addEventListener("click", function () {
      clearSearch();
      location.hash = "#/" + sec.id + "/" + item.id;
    });
    return row;
  }

  /* ---- subviews ---- */
  function renderSubview(area, sec, item) {
    if (item.type === "link") {
      var wrap = el("div", "link-view");

      // Текст материала. Двойной перенос строки = новый абзац, одиночный = <br>.
      if (item.description) {
        var content = el("div", "link-content");
        String(item.description).split(/\n{2,}/).forEach(function (para) {
          var p = document.createElement("p");
          p.innerHTML = esc(para).replace(/\n/g, "<br>");
          content.appendChild(p);
        });
        wrap.appendChild(content);
      }

      // Ссылки: одиночная (url + linkLabel) и/или массив links[{label,url}].
      var links = [];
      if (item.url) links.push({ label: item.linkLabel || item.url, url: item.url });
      if (item.links && item.links.length) {
        item.links.forEach(function (l) { if (l && l.url) links.push(l); });
      }
      if (links.length) {
        var actions = el("div", "link-actions");
        links.forEach(function (l) {
          var a = document.createElement("a");
          a.className = "btn-link";
          a.href = l.url;
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          a.innerHTML = ICONS.external + "<span>" + esc(l.label || l.url) + "</span>";
          actions.appendChild(a);
        });
        wrap.appendChild(actions);
      }

      if (!item.description && !links.length) {
        wrap.appendChild(el("div", "no-results", "Материал пуст"));
      }

      area.appendChild(wrap);
    } else if (item.type === "pdf") {
      // description for PDF too
      if (item.description) {
        var desc = el("div", "item-description", esc(item.description));
        area.appendChild(desc);
      }
      var iframe = el("iframe", "pdf-viewer");
      iframe.src = item.file;
      area.appendChild(iframe);
    } else if (item.type === "video") {
      // description
      if (item.description) {
        var desc = el("div", "item-description", esc(item.description));
        area.appendChild(desc);
      }

      var wrap = el("div", "video-section");
      var vid = document.createElement("video");
      vid.controls = true;
      vid.src = item.files.mid;
      wrap.appendChild(vid);

      // download buttons
      var ctrls = el("div", "video-controls");
      var labels = { low: "480p", mid: "", high: "1080p" };
      ["low", "mid", "high"].forEach(function (q) {
        if (!item.files[q]) return;
        var a = document.createElement("a");
        a.className = "btn-dl";
        a.href = item.files[q];
        a.download = "";
        a.innerHTML = ICONS.dl + " Скачать " + labels[q];
        ctrls.appendChild(a);
      });
      // ctrls appended after timecodes below

      // timecodes
      if (item.timecodes && item.timecodes.length) {
        var tcSection = el("div", "timecodes");
        var tcTitle = el("div", "tc-title", "Содержание видео");
        tcSection.appendChild(tcTitle);

        var tcList = el("div", "tc-list");
        item.timecodes.forEach(function (tc, idx) {
          var row = el("div", "tc-item");
          row.dataset.index = idx;
          row.innerHTML =
            '<span class="tc-time">' + formatTime(tc.time) + '</span>' +
            '<span class="tc-label">' + esc(tc.label) + '</span>';
          row.addEventListener("click", function () {
            vid.currentTime = tc.time;
            vid.play();
          });
          tcList.appendChild(row);
        });
        tcSection.appendChild(tcList);
        wrap.appendChild(tcSection);

        // highlight current timecode during playback
        vid.addEventListener("timeupdate", function () {
          var current = vid.currentTime;
          var activeIdx = -1;
          for (var i = item.timecodes.length - 1; i >= 0; i--) {
            if (current >= item.timecodes[i].time) { activeIdx = i; break; }
          }
          tcList.querySelectorAll(".tc-item").forEach(function (row, i) {
            row.classList.toggle("tc-active", i === activeIdx);
          });
        });
      }

      wrap.appendChild(ctrls);
      area.appendChild(wrap);
    }
  }

  /* =============== UTILS =============== */
  function esc(s) {
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function formatTime(sec) {
    var h = Math.floor(sec / 3600);
    var m = Math.floor((sec % 3600) / 60);
    var s = Math.floor(sec % 60);
    var ms = (m < 10 && h) ? "0" + m : "" + m;
    var ss = s < 10 ? "0" + s : "" + s;
    return h ? h + ":" + ms + ":" + ss : m + ":" + ss;
  }

  function highlightMatch(text, query) {
    if (!query) return esc(text);
    var lower = text.toLowerCase();
    var idx = lower.indexOf(query);
    if (idx === -1) return esc(text);
    var before = text.slice(0, idx);
    var match = text.slice(idx, idx + query.length);
    var after = text.slice(idx + query.length);
    return esc(before) + '<mark class="search-mark">' + esc(match) + '</mark>' + esc(after);
  }

  function pluralize(n, one, few, many) {
    var abs = Math.abs(n) % 100;
    var last = abs % 10;
    if (abs > 10 && abs < 20) return many;
    if (last > 1 && last < 5) return few;
    if (last === 1) return one;
    return many;
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
