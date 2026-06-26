/* Sifututor design-review widget.
   Drop-in: <script src="review-widget.js"></script> before </body> on any design page.
   Renders a comment box (OK / Needs-work + note) for EVERY screen in that page's
   category, so all 44 screens are reviewable, not only the ones drawn as mockups.
   The mockups above stay as visual reference. A floating Copy-all / Email bar gathers
   feedback from every page (shared localStorage). */
(function () {
  var KEY = "sifu-screen-review-v1";
  var EMAIL = "stsyamilyusoff@gmail.com";

  // Every screen in the app, grouped by the design page it belongs to.
  // [name, status]  status: ok = in brief · pass = needs its own pass · shared = designed elsewhere
  var PAGE_SCREENS = {
    "onboarding": [["Splash","pass"],["OnBoarding","ok"],["GetStarted","ok"],["Register","pass"],["VerifyCode","ok"],["UpdateProfile","ok"]],
    "home": [["Home","ok"]],
    "request-flow": [["Requests (list)","ok"],["RequestNow","ok"],["TutorRequest (entry)","pass"],["SchedulePreferencesForm","ok"],["GetTutorRequestPrice","pass"],["TutorRequestAppliedStatus","pass"],["RequestDetails","pass"],["RequestCompletedDetails","pass"]],
    "curated-choice": [["Curated choice","shared"]],
    "schedule-attendance": [["ClassSchedule","ok"],["TutorClassAttendance","ok"]],
    "billing": [["Invoice (list)","ok"],["PayAllSummary","ok"],["CommitmentFeePending","ok"],["InvoiceDetailPending","pass"],["InvoiceDetailPaid","pass"],["CommitmentFeeDetail","pass"],["RefundInvoiceDetail","pass"],["PaymentGateway","pass"],["PaymentCongratulations","pass"],["SharedInvoiceDetail","shared"]],
    "reports-view": [["StudentReport","ok"],["EvaluationReport","ok"],["ProgressReport","ok"]],
    "profile-hub": [["ProfileMenu","ok"],["ParentProfile","ok"],["StudentList","ok"],["AddNewStudent","ok"],["CameraScreen","pass"]],
    "content-notifications": [["News (feed)","ok"],["NewsDetails","ok"],["LatestBlog","ok"],["RouteToBlogsDetails","ok"],["Notifications","ok"]],
    "referral-static": [["ReferFriend","ok"],["MyReferralEarnings","ok"],["FAQs","ok"],["TermAndConditions","ok"],["PrivacyPolicy","ok"]]
  };

  function esc(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
  function load(){ try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch(e){ return {}; } }
  function save(){ localStorage.setItem(KEY, JSON.stringify(state)); }
  var state = load();
  var slug = (location.pathname.split("/").pop() || "index").replace(/\.html$/,"") || "index";
  var screens = PAGE_SCREENS[slug] || [];

  var css = ""
   + ".rvw-panel{max-width:640px;margin:34px auto 8px;background:#fff;border:1px solid #d6deff;border-radius:16px;padding:18px;font-family:-apple-system,system-ui,sans-serif}"
   + ".rvw-ph{font-size:13px;font-weight:800;color:#243cb3;text-transform:uppercase;letter-spacing:.5px;text-align:center;margin-bottom:4px}"
   + ".rvw-psub{font-size:11.5px;color:#71717a;text-align:center;margin-bottom:15px;line-height:1.5}"
   + ".rvw{background:#f3f6ff;border:1px solid #d6deff;border-left:3px solid #243cb3;border-radius:11px;padding:12px 14px;margin-bottom:10px}"
   + ".rvw.touched{background:#eef1fb;border-left-color:#1a5c38}"
   + ".rvw-h{font-size:13.5px;font-weight:800;color:#18181b;margin-bottom:8px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}"
   + ".rvw-bdg{font-size:8.5px;font-weight:800;text-transform:uppercase;letter-spacing:.3px;border-radius:99px;padding:2px 7px}"
   + ".rvw-bdg.ok{background:#e9f5ee;color:#1a5c38}.rvw-bdg.pass{background:#fbf1e2;color:#8a5a00}.rvw-bdg.shared{background:#eef0f3;color:#6b7280}"
   + ".rvw-pills{display:flex;gap:8px;margin-bottom:8px}"
   + ".rvw-pill{font-size:12.5px;font-weight:700;border-radius:99px;padding:6px 15px;border:1.4px solid #d4d4d8;background:#fff;color:#52525b;cursor:pointer}"
   + ".rvw-pill.ok.on{background:#e9f5ee;border-color:#1a5c38;color:#1a5c38}"
   + ".rvw-pill.ch.on{background:#fdecec;border-color:#b42318;color:#b42318}"
   + ".rvw-t{width:100%;border:1px solid #d6deff;border-radius:9px;padding:9px 11px;font-size:13px;font-family:inherit;color:#18181b;resize:vertical;min-height:38px;background:#fff}"
   + ".rvw-t:focus{outline:none;border-color:#243cb3}"
   + ".rvw-bar{position:fixed;left:0;right:0;bottom:0;z-index:9999;background:#fff;border-top:1px solid #e6e6ea;box-shadow:0 -2px 14px rgba(0,0,0,.07);padding:11px 16px;display:flex;gap:9px;align-items:center}"
   + ".rvw-prog{font-size:12px;color:#52525b;font-weight:600;flex:1;line-height:1.3}.rvw-prog b{color:#243cb3}"
   + ".rvw-btn{font-size:13px;font-weight:700;border-radius:10px;padding:10px 15px;border:none;cursor:pointer;white-space:nowrap}"
   + ".rvw-btn.primary{background:#243cb3;color:#fff}.rvw-btn.ghost{background:#eef1fb;color:#243cb3}"
   + ".rvw-toast{position:fixed;left:50%;bottom:80px;transform:translateX(-50%) translateY(20px);z-index:10000;background:#18181b;color:#fff;font-size:13px;font-weight:600;padding:11px 18px;border-radius:99px;opacity:0;pointer-events:none;transition:.25s}"
   + ".rvw-toast.show{opacity:1;transform:translateX(-50%) translateY(0)}";
  var styleEl = document.createElement("style"); styleEl.textContent = css; document.head.appendChild(styleEl);

  if (screens.length) {
    var panel = document.createElement("div"); panel.className = "rvw-panel";
    var html = '<div class="rvw-ph">Comment on each screen</div>'
      + '<div class="rvw-psub">' + screens.length + ' screen' + (screens.length === 1 ? "" : "s") + ' in this section. The designs above are your reference. Mark each OK or Needs work and add a note.</div>';
    screens.forEach(function (sc) {
      var name = sc[0], st = sc[1], key = slug + "::" + name, cur = state[key] || {};
      html += '<div class="rvw' + ((cur.d || (cur.c && cur.c.trim())) ? " touched" : "") + '" data-key="' + esc(key) + '">'
        + '<div class="rvw-h">' + esc(name) + ' <span class="rvw-bdg ' + st + '">' + (st === "pass" ? "needs pass" : st === "shared" ? "shared" : "in brief") + '</span></div>'
        + '<div class="rvw-pills">'
        + '<button type="button" class="rvw-pill ok' + (cur.d === "ok" ? " on" : "") + '" data-d="ok">OK</button>'
        + '<button type="button" class="rvw-pill ch' + (cur.d === "ch" ? " on" : "") + '" data-d="ch">Needs work</button>'
        + '</div>'
        + '<textarea class="rvw-t" placeholder="Comment for the team (optional)">' + esc(cur.c || "") + '</textarea>'
        + '</div>';
    });
    panel.innerHTML = html;
    var doc = document.querySelector(".doc") || document.body;
    var foot = doc.querySelector(".foot");
    if (foot && foot.parentNode === doc) doc.insertBefore(panel, foot); else doc.appendChild(panel);

    Array.prototype.forEach.call(panel.querySelectorAll(".rvw"), function (w) {
      var key = w.getAttribute("data-key");
      var label = key.split("::")[1] || key;
      function persist(patch) {
        var c = state[key] || {}; for (var k in patch) c[k] = patch[k];
        c.page = slug; c.label = label; state[key] = c; save();
        w.classList.toggle("touched", !!(c.d || (c.c && c.c.trim()))); updateBar();
      }
      var pills = w.querySelectorAll(".rvw-pill");
      Array.prototype.forEach.call(pills, function (p) {
        p.addEventListener("click", function () {
          var d = p.getAttribute("data-d");
          var nd = (state[key] && state[key].d === d) ? "" : d;
          persist({ d: nd });
          Array.prototype.forEach.call(pills, function (x) { x.classList.remove("on"); });
          if (nd) w.querySelector(".rvw-pill." + nd).classList.add("on");
        });
      });
      w.querySelector(".rvw-t").addEventListener("input", function () { persist({ c: this.value }); });
    });
  }

  var bar = document.createElement("div"); bar.className = "rvw-bar";
  bar.innerHTML = '<div class="rvw-prog" id="rvwProg"></div>'
    + '<button type="button" class="rvw-btn ghost" id="rvwEmail">Email</button>'
    + '<button type="button" class="rvw-btn primary" id="rvwCopy">Copy all feedback</button>';
  document.body.appendChild(bar);
  document.body.style.paddingBottom = "92px";
  var toastEl = document.createElement("div"); toastEl.className = "rvw-toast"; toastEl.id = "rvwToast";
  document.body.appendChild(toastEl);

  function count(){ var n = 0; for (var k in state){ var c = state[k]; if (c.d || (c.c && c.c.trim())) n++; } return n; }
  function updateBar(){ var n = count(); document.getElementById("rvwProg").innerHTML = "<b>" + n + "</b> screen" + (n === 1 ? "" : "s") + " commented (all pages)"; }
  function toast(m){ toastEl.textContent = m; toastEl.classList.add("show"); setTimeout(function(){ toastEl.classList.remove("show"); }, 2200); }

  function collect(){
    var byPage = {}, order = [], n = 0;
    for (var k in state){
      var c = state[k]; if (!(c.d || (c.c && c.c.trim()))) continue; n++;
      var pg = c.page || k.split("::")[0]; var lb = c.label || (k.split("::")[1] || k);
      if (!byPage[pg]) { byPage[pg] = []; order.push(pg); }
      var dec = c.d === "ok" ? "OK" : c.d === "ch" ? "NEEDS WORK" : "comment";
      byPage[pg].push("  • " + lb + ": " + dec + (c.c && c.c.trim() ? ' - "' + c.c.trim() + '"' : ""));
    }
    var out = "Sifututor customer app: screen review (Hafiz)\n" + n + " screens flagged\n";
    order.forEach(function (pg){ out += "\n[" + pg + "]\n" + byPage[pg].join("\n") + "\n"; });
    return { text: out, n: n };
  }
  function fallbackCopy(text){
    var ta = document.createElement("textarea"); ta.value = text; ta.style.position = "fixed"; ta.style.top = "-1000px";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); toast("Copied, paste it to Syami"); } catch(e){ prompt("Copy this feedback:", text); }
    document.body.removeChild(ta);
  }
  document.getElementById("rvwCopy").addEventListener("click", function(){
    var r = collect(); if (!r.n){ toast("Comment on a screen first"); return; }
    if (navigator.clipboard && navigator.clipboard.writeText)
      navigator.clipboard.writeText(r.text).then(function(){ toast("Copied, paste it to Syami"); }).catch(function(){ fallbackCopy(r.text); });
    else fallbackCopy(r.text);
  });
  document.getElementById("rvwEmail").addEventListener("click", function(){
    var r = collect(); if (!r.n){ toast("Comment on a screen first"); return; }
    window.location.href = "mailto:" + EMAIL + "?subject=" + encodeURIComponent("Sifututor screen review (Hafiz)") + "&body=" + encodeURIComponent(r.text);
  });
  updateBar();
})();
