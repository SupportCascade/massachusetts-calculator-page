/*!
 * Massachusetts Calculator v1.1.0
 * Standalone build of the calculator from index.html. No dependencies.
 * Renders into every <div class="macalc" data-macalc="{...json config...}">, and fills the
 * tax table and icons of the full-page template ([massachusetts_calculator_page]).
 * The formulas, defaults, town rates and text are copied unchanged from index.html.
 */
(function () {
  "use strict";

  // ---------- Config (team-editable) ----------
  // [TEAM] Set the default rate to the current 30-year average and update monthly.
  // Shortcode attributes / Elementor widget settings override these per page.
  var BUILT_IN = {
    defaults: { price: 600000, downPct: 20, rate: 6.25, term: 30, type: "conv", town: "Canton", ins: 1800, hoa: 0 },
    phone: "(617) 755-8272",
    phoneHref: "+16177558272",
    scheduleUrl: "#contact",
    contactUrl: "#contact",
    amortization: true,
    disclaimer: true
  };

  // Residential tax rates per $1,000. v:true = checked against a FY2026 source; others are estimates to confirm with MA DOR.
  var TOWNS = [
    ["Abington","Plymouth",13.12],["Attleboro","Bristol",11.30],["Avon","Norfolk",15.22],["Boston","Suffolk",12.40,1],
    ["Braintree","Norfolk",10.04],["Bridgewater","Plymouth",12.30],["Brockton","Plymouth",12.65],["Brookline","Norfolk",10.24,1],
    ["Canton","Norfolk",11.53],["Chelsea","Suffolk",11.89],["Cohasset","Norfolk",11.79],["Dedham","Norfolk",11.71],
    ["Duxbury","Plymouth",10.26],["Easton","Bristol",13.31],["Fall River","Bristol",11.68],["Foxborough","Norfolk",12.36],
    ["Franklin","Norfolk",11.61],["Hanover","Plymouth",12.69],["Hingham","Plymouth",9.88],["Holbrook","Norfolk",13.88],
    ["Mansfield","Bristol",13.06],["Marshfield","Plymouth",10.95],["Medfield","Norfolk",14.61],["Milton","Norfolk",11.81,1],
    ["Needham","Norfolk",10.83,1],["New Bedford","Bristol",12.79],["Norfolk","Norfolk",13.33],["Norwood","Norfolk",10.33],
    ["Plymouth","Plymouth",11.59],["Quincy","Norfolk",11.78,1],["Randolph","Norfolk",12.46],["Revere","Suffolk",10.51],
    ["Rockland","Plymouth",13.81],["Scituate","Plymouth",10.29],["Sharon","Norfolk",16.27],["Stoughton","Norfolk",11.81,1],
    ["Taunton","Bristol",12.58],["Walpole","Norfolk",11.47],["Wellesley","Norfolk",10.17,1],["Westwood","Norfolk",12.71],
    ["Weymouth","Norfolk",10.43],["Whitman","Plymouth",12.66],["Winthrop","Suffolk",9.53],["Wrentham","Norfolk",11.86]
  ].map(function (t) { return { name: t[0], county: t[1], rate: t[2], verified: !!t[3] }; });

  var COLORS = { pi: "var(--mc-c-pi)", tax: "var(--mc-c-tax)", ins: "var(--mc-c-ins)", mi: "var(--mc-c-pmi)", hoa: "var(--mc-c-hoa)" };

  var ICONS = {
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
    cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/>',
    home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z"/><path d="M9 21v-6h6v6"/>',
    calc: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h8"/>',
    dollar: '<circle cx="12" cy="12" r="9"/><path d="M12 6v12M15 9.5c0-1-1.1-1.5-3-1.5s-3 .5-3 1.8c0 2.7 6 1.2 6 4 0 1.2-1.1 1.7-3 1.7s-3-.5-3-1.7"/>',
    pin: '<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    shield: '<path d="M12 3 20 6v5c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6Z"/><path d="m8.5 12 2.3 2.3 4.7-5"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    reset: '<path d="M20 11a8.1 8.1 0 0 0-14.8-3L3 11M3 5v6h6M4 13a8.1 8.1 0 0 0 14.8 3L21 13M21 19v-6h-6"/>',
    table: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 10v10"/>',
    chev: '<path d="m6 9 6 6 6-6"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>'
  };
  function icon(name, extra) {
    return '<svg class="mc-icon' + (extra ? " " + extra : "") + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' +
      (name === "chev" ? 2 : 1.8) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + ICONS[name] + "</svg>";
  }

  // ---------- Helpers ----------
  var fmt0 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  var fmtN = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
  function money(n) { return fmt0.format(Math.round(n || 0)); }
  function num(el) { var v = parseFloat(String(el.value).replace(/[^0-9.]/g, "")); return isFinite(v) ? v : 0; }
  function setNum(el, v, dec) { el.value = dec ? (+v).toFixed(dec).replace(/\.?0+$/, "") : fmtN.format(Math.round(v)); }
  function findTown(name) { for (var i = 0; i < TOWNS.length; i++) if (TOWNS[i].name === name) return TOWNS[i]; return null; }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function pmt(principal, annualRate, months) {
    if (principal <= 0) return 0;
    var r = annualRate / 100 / 12;
    if (r === 0) return principal / months;
    return principal * r / (1 - Math.pow(1 + r, -months));
  }

  // Conventional PMI annual factor by LTV (typical good-credit ranges).
  function convPmiRate(ltv) {
    if (ltv <= 80) return 0;
    if (ltv <= 85) return 0.0030;
    if (ltv <= 90) return 0.0050;
    if (ltv <= 95) return 0.0070;
    return 0.0090;
  }
  // FHA annual MIP (current HUD schedule, base loan <= $726,200).
  function fhaMipRate(ltv, term) {
    if (term > 15) return ltv > 95 ? 0.0055 : 0.0050;
    return ltv > 90 ? 0.0040 : 0.0015;
  }
  // VA funding fee, first use.
  function vaFeeRate(downPct) { return downPct >= 10 ? 0.0125 : downPct >= 5 ? 0.015 : 0.0215; }

  // ---------- Config ----------
  function readConfig(root) {
    var raw = {}, cfg = {}, k;
    try { raw = JSON.parse(root.getAttribute("data-macalc") || "{}") || {}; } catch (e) { raw = {}; }
    for (k in BUILT_IN) cfg[k] = BUILT_IN[k];
    for (k in raw) if (k !== "defaults" && raw[k] !== null && raw[k] !== "") cfg[k] = raw[k];
    var d = {}, rd = raw.defaults || {};
    for (k in BUILT_IN.defaults) {
      var v = rd[k];
      if (v === undefined || v === null || v === "") { d[k] = BUILT_IN.defaults[k]; continue; }
      if (typeof BUILT_IN.defaults[k] === "number") { v = parseFloat(v); d[k] = isFinite(v) && v >= 0 ? v : BUILT_IN.defaults[k]; }
      else d[k] = String(v);
    }
    if ([30, 20, 15, 10].indexOf(d.term) < 0) d.term = BUILT_IN.defaults.term;
    if (["conv", "fha", "va"].indexOf(d.type) < 0) d.type = BUILT_IN.defaults.type;
    if (d.downPct > 100) d.downPct = 100;
    if (!findTown(d.town)) d.town = BUILT_IN.defaults.town;
    cfg.defaults = d;
    if (!cfg.phoneHref) cfg.phoneHref = "+1" + String(cfg.phone).replace(/\D/g, "").slice(-10);
    return cfg;
  }

  // ---------- Markup ----------
  function template(c) {
    var tel = "tel:" + esc(c.phoneHref), sched = esc(c.scheduleUrl), contact = esc(c.contactUrl), phone = esc(c.phone);
    var opts = "";
    TOWNS.forEach(function (t) { opts += '<option value="' + esc(t.name) + '">' + esc(t.name + " (" + t.county + " County)") + "</option>"; });
    opts += '<option value="__other">Other town (enter rate)</option>';

    return '' +
'<div class="mc-section-wrap" role="region" aria-label="Mortgage calculator">' +
  '<div class="mc-calc">' +
    '<div class="mc-card">' +
      '<form data-k="calc-form" novalidate>' +
        '<div class="mc-card-header">' +
          '<div><h2>Your home details</h2><p>A few numbers. A clearer monthly payment.</p></div>' +
          '<div class="mc-toolbar"><button type="button" class="mc-tbtn mc-tbtn-ghost" data-k="reset">' + icon("reset") + 'Reset</button></div>' +
        '</div>' +
        '<div class="mc-card-content">' +

          '<div class="mc-group">' +
            '<div class="mc-group-heading"><span class="mc-group-icon">' + icon("home") + '</span><h3>Price and down payment</h3></div>' +
            '<div class="mc-grid2">' +
              '<div class="mc-field mc-full">' +
                '<label class="mc-label" for="{id}-price">Home price</label>' +
                '<div class="mc-input-wrap"><span class="mc-adorn mc-l">$</span><input class="mc-input" id="{id}-price" data-k="price" inputmode="decimal" autocomplete="off"></div>' +
                '<input type="range" class="mc-range" data-k="range" min="100000" max="2500000" step="5000" aria-label="Home price slider">' +
              '</div>' +
              '<div class="mc-field mc-full">' +
                '<div class="mc-label">' +
                  '<label for="{id}-down">Down payment</label>' +
                  '<div class="mc-seg" role="group" aria-label="Down payment unit">' +
                    '<button type="button" data-unit="pct" aria-pressed="true">%</button>' +
                    '<button type="button" data-unit="usd" aria-pressed="false">$</button>' +
                  '</div>' +
                '</div>' +
                '<div class="mc-input-wrap"><span class="mc-adorn mc-l" data-k="down-l">$</span><input class="mc-input" id="{id}-down" data-k="down" inputmode="decimal" autocomplete="off"><span class="mc-adorn mc-r" data-k="down-r">%</span></div>' +
                '<div class="mc-chips" role="group" aria-label="Quick down payment">' +
                  '<button type="button" class="mc-chip" data-dp="3">3%</button>' +
                  '<button type="button" class="mc-chip" data-dp="3.5">3.5%</button>' +
                  '<button type="button" class="mc-chip" data-dp="5">5%</button>' +
                  '<button type="button" class="mc-chip" data-dp="10">10%</button>' +
                  '<button type="button" class="mc-chip" data-dp="20">20%</button>' +
                '</div>' +
                '<p class="mc-help" data-k="down-help"></p>' +
              '</div>' +
            '</div>' +
          '</div>' +

          '<div class="mc-group">' +
            '<div class="mc-group-heading"><span class="mc-group-icon">' + icon("dollar") + '</span><h3>Loan</h3></div>' +
            '<div class="mc-grid2">' +
              '<div class="mc-field">' +
                '<label class="mc-label" for="{id}-rate">Interest rate</label>' +
                '<div class="mc-input-wrap"><input class="mc-input mc-pct" id="{id}-rate" data-k="rate" inputmode="decimal" autocomplete="off"><span class="mc-adorn mc-r">%</span></div>' +
                '<p class="mc-help">Use a current quote if you have one.</p>' +
              '</div>' +
              '<div class="mc-field">' +
                '<label class="mc-label" for="{id}-term">Loan term</label>' +
                '<select class="mc-select" id="{id}-term" data-k="term">' +
                  '<option value="30">30 years</option><option value="20">20 years</option><option value="15">15 years</option><option value="10">10 years</option>' +
                '</select>' +
              '</div>' +
              '<div class="mc-field mc-full">' +
                '<label class="mc-label" for="{id}-type">Loan type</label>' +
                '<select class="mc-select" id="{id}-type" data-k="type">' +
                  '<option value="conv">Conventional</option><option value="fha">FHA</option><option value="va">VA</option>' +
                '</select>' +
                '<p class="mc-help" data-k="type-help"></p>' +
              '</div>' +
            '</div>' +
          '</div>' +

          '<div class="mc-group">' +
            '<div class="mc-group-heading"><span class="mc-group-icon">' + icon("pin") + '</span><h3>Town and property tax</h3></div>' +
            '<div class="mc-grid2">' +
              '<div class="mc-field">' +
                '<label class="mc-label" for="{id}-town">Town</label>' +
                '<select class="mc-select" id="{id}-town" data-k="town">' + opts + '</select>' +
              '</div>' +
              '<div class="mc-field">' +
                '<label class="mc-label" for="{id}-taxrate">Tax rate (per $1,000)</label>' +
                '<div class="mc-input-wrap"><span class="mc-adorn mc-l">$</span><input class="mc-input" id="{id}-taxrate" data-k="taxrate" inputmode="decimal" autocomplete="off"></div>' +
              '</div>' +
            '</div>' +
            '<div class="mc-meta" data-k="tax-meta"></div>' +
          '</div>' +

          '<div class="mc-group">' +
            '<div class="mc-group-heading"><span class="mc-group-icon">' + icon("shield") + '</span><h3>Insurance and fees</h3></div>' +
            '<div class="mc-grid2">' +
              '<div class="mc-field">' +
                '<label class="mc-label" for="{id}-ins">Homeowners insurance <span class="mc-small">/ year</span></label>' +
                '<div class="mc-input-wrap"><span class="mc-adorn mc-l">$</span><input class="mc-input" id="{id}-ins" data-k="ins" inputmode="decimal" autocomplete="off"></div>' +
              '</div>' +
              '<div class="mc-field">' +
                '<label class="mc-label" for="{id}-hoa">HOA / condo fee <span class="mc-small">/ month</span></label>' +
                '<div class="mc-input-wrap"><span class="mc-adorn mc-l">$</span><input class="mc-input" id="{id}-hoa" data-k="hoa" inputmode="decimal" autocomplete="off"></div>' +
              '</div>' +
              '<div class="mc-field mc-full">' +
                '<div class="mc-label">' +
                  '<label for="{id}-mi">PMI / mortgage insurance <span class="mc-small">/ month</span></label>' +
                  '<span><span class="mc-auto-badge" data-k="mi-badge">Auto</span> <button type="button" class="mc-linkbtn" data-k="mi-auto" hidden>Use auto</button></span>' +
                '</div>' +
                '<div class="mc-input-wrap"><span class="mc-adorn mc-l">$</span><input class="mc-input" id="{id}-mi" data-k="mi" inputmode="decimal" autocomplete="off"></div>' +
                '<p class="mc-help" data-k="mi-help"></p>' +
              '</div>' +
            '</div>' +
            '<p class="mc-note">' + icon("info") + 'Every field is editable. Results update as you type.</p>' +
          '</div>' +

        '</div>' +
      '</form>' +
    '</div>' +

    '<div class="mc-results" data-k="results" aria-live="polite">' +
      '<div class="mc-card">' +
        '<div class="mc-result-hero">' +
          '<div class="mc-result-header"><h2>' + icon("calc") + 'Your estimate</h2><span class="mc-pill" data-k="r-town"></span></div>' +
          '<div class="mc-result-summary">' +
            '<h3>Estimated total monthly payment</h3>' +
            '<div class="mc-result-value" data-k="r-total">$0<small>/mo</small></div>' +
            '<div class="mc-stack" data-k="r-stack" aria-hidden="true"></div>' +
          '</div>' +
          '<div class="mc-metrics">' +
            '<div class="mc-metric">Loan amount<strong data-k="r-loan">$0</strong></div>' +
            '<div class="mc-metric">Total interest<strong data-k="r-interest">$0</strong></div>' +
          '</div>' +
        '</div>' +
        '<div class="mc-details">' +
          '<div class="mc-details-heading"><h3>Monthly breakdown</h3><span data-k="r-payoff"></span></div>' +
          '<div data-k="r-rows"></div>' +
          '<div class="mc-total-row"><span>Total monthly payment</span><span data-k="r-total2">$0</span></div>' +
        '</div>' +
        '<div class="mc-extra" data-k="r-extra"></div>' +
        '<div class="mc-result-cta">' +
          '<a class="mc-btn mc-btn-primary" href="' + tel + '">' + icon("phone") + 'Call Now ' + phone + '</a>' +
          '<a class="mc-btn mc-btn-outline" href="' + sched + '">' + icon("cal") + 'Schedule a Call</a>' +
        '</div>' +
      '</div>' +
    '</div>' +
  '</div>' +

  (c.amortization ?
  '<details class="mc-card mc-amort" data-k="amort">' +
    '<summary><span class="mc-group-icon">' + icon("table") + '</span>Amortization schedule' + icon("chev", "mc-chev") + '</summary>' +
    '<div class="mc-amort-body">' +
      '<div class="mc-amort-controls">' +
        '<div class="mc-seg" role="group" aria-label="Schedule view">' +
          '<button type="button" data-view="year" aria-pressed="true">Yearly</button>' +
          '<button type="button" data-view="month" aria-pressed="false">Monthly</button>' +
        '</div>' +
      '</div>' +
      '<table><thead><tr><th data-k="a-period">Year</th><th>Principal</th><th>Interest</th><th>Total P&amp;I</th><th>Remaining balance</th></tr></thead>' +
      '<tbody data-k="a-body"></tbody></table>' +
    '</div>' +
  '</details>' : '') +

  '<div class="mc-under">' +
    '<p>Want to talk through your numbers? Call Mikel at <a href="' + tel + '">' + phone + '</a> or schedule a quick call.</p>' +
    '<div class="mc-btn-row">' +
      '<a class="mc-btn mc-btn-primary mc-btn-sm" href="' + tel + '">' + icon("phone") + 'Call Now</a>' +
      '<a class="mc-btn mc-btn-outline mc-btn-sm" href="' + contact + '">' + icon("mail") + 'Contact Us</a>' +
    '</div>' +
  '</div>' +
  (c.disclaimer ? '<p class="mc-disclaimer">This Massachusetts mortgage calculator provides estimates only and is not a loan offer or commitment to lend. Actual rates, taxes, insurance and payments will vary. Equal Housing Opportunity.</p>' : '') +
'</div>';
  }

  // ---------- Instances ----------
  var count = 0, instances = [];

  function cleanup() {
    instances = instances.filter(function (inst) {
      if (inst.root.isConnected) return true;
      if (inst.bar && inst.bar.parentNode) inst.bar.parentNode.removeChild(inst.bar);
      if (inst.observers) inst.observers.forEach(function (o) { o.disconnect(); });
      return false;
    });
  }

  function init(root) {
    if (root.getAttribute("data-macalc-ready")) return;
    root.setAttribute("data-macalc-ready", "1");
    cleanup();

    var cfg = readConfig(root);
    var DEFAULTS = cfg.defaults;
    var uid = "macalc-" + (++count);
    root.innerHTML = template(cfg).replace(/\{id\}/g, uid);

    // Mobile sticky bar lives on <body> so a transformed Elementor column can't break position: fixed.
    var bar = document.createElement("div");
    bar.className = "macalc mc-mobile-bar";
    bar.innerHTML = '<div>Est. monthly payment<strong data-k="m-total">$0</strong></div>' +
      '<a class="mc-btn" href="tel:' + esc(cfg.phoneHref) + '">' + icon("phone") + "Call</a>";
    document.body.appendChild(bar);
    var inst = { root: root, bar: bar, observers: [] };
    instances.push(inst);

    function $(k) { return root.querySelector('[data-k="' + k + '"]') || bar.querySelector('[data-k="' + k + '"]'); }
    function all(sel) { return Array.prototype.slice.call(root.querySelectorAll(sel)); }

    // ---------- State ----------
    var state = { downUnit: "pct", miManual: false, view: "year" };
    var el = {
      price: $("price"), range: $("range"), down: $("down"), rate: $("rate"), term: $("term"), type: $("type"),
      town: $("town"), taxrate: $("taxrate"), ins: $("ins"), hoa: $("hoa"), mi: $("mi")
    };
    var amort = $("amort");

    root.querySelector("form").addEventListener("submit", function (e) { e.preventDefault(); });

    function applyTown() {
      var t = findTown(el.town.value);
      if (t) setNum(el.taxrate, t.rate, 2);
    }

    function downAmount(price) {
      var v = num(el.down);
      return state.downUnit === "pct" ? price * Math.min(v, 100) / 100 : Math.min(v, price);
    }

    function setDownUnit(unit) {
      var price = num(el.price), amt = downAmount(price);
      state.downUnit = unit;
      all("[data-unit]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-unit") === unit)); });
      $("down-l").style.display = unit === "usd" ? "" : "none";
      $("down-r").style.display = unit === "pct" ? "" : "none";
      el.down.className = "mc-input" + (unit === "pct" ? " mc-pct" : "");
      if (unit === "pct") setNum(el.down, price ? amt / price * 100 : 0, 2); else setNum(el.down, amt);
    }

    // ---------- Calculation ----------
    var lastSchedule = null;

    function calc() {
      var price = num(el.price);
      var dAmt = downAmount(price);
      var dPct = price ? dAmt / price * 100 : 0;
      var rate = num(el.rate), term = +el.term.value, type = el.type.value;
      var taxRate = num(el.taxrate), ins = num(el.ins), hoa = num(el.hoa);
      var months = term * 12;

      var base = Math.max(price - dAmt, 0);
      var ltv = price ? base / price * 100 : 0;
      var financedFee = 0, feeLabel = "", autoMi = 0, miLabel = "PMI", typeHelp = "", miHelp = "";

      if (type === "fha") {
        financedFee = base * 0.0175; feeLabel = "FHA upfront MIP (1.75%), financed";
        autoMi = base * fhaMipRate(ltv, term) / 12; miLabel = "FHA MIP";
        typeHelp = "FHA requires at least 3.5% down. Adds 1.75% upfront MIP plus monthly MIP.";
        miHelp = "Monthly MIP at " + (fhaMipRate(ltv, term) * 100).toFixed(2) + "% of the base loan per year.";
      } else if (type === "va") {
        financedFee = base * vaFeeRate(dPct); feeLabel = "VA funding fee (" + (vaFeeRate(dPct) * 100).toFixed(2) + "%, first use), financed";
        autoMi = 0; miLabel = "Mortgage insurance";
        typeHelp = "VA loans allow 0% down and have no monthly mortgage insurance. Funding fee may be waived for some veterans.";
        miHelp = "VA loans have no monthly mortgage insurance.";
      } else {
        autoMi = base * convPmiRate(ltv) / 12; miLabel = "PMI";
        typeHelp = "Conventional loans can start at 3% down for eligible buyers.";
        miHelp = ltv > 80 ? "Estimated at " + (convPmiRate(ltv) * 100).toFixed(2) + "% of the loan per year. Usually removable at 20% equity."
                          : "No PMI with 20% or more down.";
      }

      if (!state.miManual) setNum(el.mi, autoMi);
      var mi = state.miManual ? num(el.mi) : autoMi;
      if (type === "va" && !state.miManual) mi = 0;

      var loan = base + financedFee;
      var pi = pmt(loan, rate, months);
      var tax = price * taxRate / 1000 / 12;
      var insM = ins / 12;
      var total = pi + tax + insM + mi + hoa;

      // Amortization
      var r = rate / 100 / 12, bal = loan, totalInt = 0, monthly = [], yearly = [], y = null;
      for (var m = 1; m <= months && bal > 0.005; m++) {
        var int = bal * r, prin = Math.min(pi - int, bal);
        if (r === 0) { int = 0; prin = Math.min(pi, bal); }
        bal -= prin; totalInt += int;
        monthly.push([m, prin, int, bal]);
        var yi = Math.ceil(m / 12);
        if (!y || y[0] !== yi) { y = [yi, 0, 0, 0]; yearly.push(y); }
        y[1] += prin; y[2] += int; y[3] = bal;
      }
      lastSchedule = { monthly: monthly, yearly: yearly };

      // ---- Render ----
      var tn = el.town.value === "__other" ? "Custom tax rate" : el.town.value + ", MA";
      $("r-town").textContent = tn;
      $("r-total").innerHTML = money(total) + "<small>/mo</small>";
      $("r-total2").textContent = money(total);
      $("m-total").textContent = money(total) + "/mo";
      $("r-loan").textContent = money(loan);
      $("r-interest").textContent = money(totalInt);
      var payoff = new Date(); payoff.setMonth(payoff.getMonth() + months);
      $("r-payoff").textContent = "Paid off " + payoff.toLocaleDateString("en-US", { month: "short", year: "numeric" });

      var showMi = type !== "va" || mi > 0;
      var rows = [
        ["pi", "Principal & interest", rate.toFixed(2).replace(/\.?0+$/, "") + "% · " + term + "-yr", pi, true],
        ["tax", "Property tax", "$" + taxRate.toFixed(2) + " per $1,000 · " + money(tax * 12) + "/yr", tax, true],
        ["ins", "Homeowners insurance", money(ins) + "/yr", insM, true],
        ["mi", miLabel, mi > 0 ? (state.miManual ? "Custom amount" : "Auto-estimated") : (type === "va" ? "None on VA loans" : "Not required at 20%+ down"), mi, showMi],
        ["hoa", "HOA / condo fee", hoa > 0 ? "Monthly" : "None entered", hoa, true]
      ];
      var rh = "", sh = "";
      rows.forEach(function (row) {
        if (!row[4]) return;
        rh += "<div class='mc-brow" + (row[3] > 0 ? "" : " mc-off") + "'><span class='mc-dot' style='background:" + COLORS[row[0]] + "'></span>" +
              "<span class='mc-name'>" + esc(row[1]) + "<small>" + esc(row[2]) + "</small></span><span class='mc-amt'>" + money(row[3]) + "</span></div>";
        if (row[3] > 0 && total > 0) sh += "<span style='width:" + (row[3] / total * 100) + "%;background:" + COLORS[row[0]] + "' title='" + esc(row[1]) + "'></span>";
      });
      $("r-rows").innerHTML = rh;
      $("r-stack").innerHTML = sh;

      var extra = "<strong>Cash to close (before closing costs):</strong> " + money(dAmt) + " down payment";
      if (financedFee > 0) extra += "<br>" + feeLabel + ": <strong>" + money(financedFee) + "</strong>";
      $("r-extra").innerHTML = extra;

      $("type-help").textContent = typeHelp;
      $("mi-help").textContent = state.miManual ? "Custom amount. Click \"Use auto\" to restore the estimate." : miHelp;
      $("mi-badge").hidden = state.miManual;
      $("mi-auto").hidden = !state.miManual;

      var dh = state.downUnit === "pct" ? money(dAmt) + " down" : dPct.toFixed(1).replace(/\.0$/, "") + "% down";
      if (type === "fha" && dPct < 3.5) dh += " · FHA minimum is 3.5%";
      if (type === "conv" && dPct < 3) dh += " · Conventional minimum is usually 3%";
      $("down-help").textContent = dh;
      all("[data-dp]").forEach(function (b) {
        b.setAttribute("aria-pressed", String(Math.abs(+b.getAttribute("data-dp") - dPct) < 0.01));
      });

      var t = findTown(el.town.value);
      $("tax-meta").innerHTML = el.town.value === "__other"
        ? "Enter your town's residential rate from the town assessor or MA DOR."
        : "Annual tax estimate <strong>" + money(tax * 12) + "</strong><span class='mc-tag'>" +
          (t && num(el.taxrate) !== t.rate ? "Edited rate" : t && t.verified ? "FY2026 residential rate" : "Estimated rate, confirm with DOR") + "</span>";

      el.range.value = Math.min(Math.max(price, +el.range.min), +el.range.max);
      renderAmort();
    }

    function renderAmort() {
      if (!amort || !amort.open || !lastSchedule) return;
      var data = state.view === "year" ? lastSchedule.yearly : lastSchedule.monthly;
      $("a-period").textContent = state.view === "year" ? "Year" : "Month";
      var html = "";
      for (var i = 0; i < data.length; i++) {
        var d = data[i];
        html += "<tr><td>" + d[0] + "</td><td>" + money(d[1]) + "</td><td>" + money(d[2]) + "</td><td>" + money(d[1] + d[2]) + "</td><td>" + money(d[3]) + "</td></tr>";
      }
      $("a-body").innerHTML = html;
    }

    // ---------- Events ----------
    function onNumInput(e) { if (e.target === el.mi) state.miManual = true; calc(); }
    ["price","down","rate","taxrate","ins","hoa","mi"].forEach(function (k) {
      el[k].addEventListener("input", onNumInput);
      el[k].addEventListener("blur", function () {
        var dec = (k === "rate" || k === "taxrate" || (k === "down" && state.downUnit === "pct")) ? 3 : 0;
        setNum(el[k], num(el[k]), dec);
      });
    });
    el.range.addEventListener("input", function () { setNum(el.price, +el.range.value); calc(); });
    el.term.addEventListener("change", calc);
    el.type.addEventListener("change", function () {
      var price = num(el.price), dPct = price ? downAmount(price) / price * 100 : 0;
      if (el.type.value === "fha" && dPct < 3.5) { setDownUnit("pct"); setNum(el.down, 3.5, 2); }
      calc();
    });
    el.town.addEventListener("change", function () { applyTown(); calc(); });
    all("[data-unit]").forEach(function (b) {
      b.addEventListener("click", function () { setDownUnit(b.getAttribute("data-unit")); calc(); });
    });
    all("[data-dp]").forEach(function (b) {
      b.addEventListener("click", function () {
        var pct = +b.getAttribute("data-dp"), price = num(el.price);
        if (state.downUnit === "pct") setNum(el.down, pct, 2); else setNum(el.down, price * pct / 100);
        calc();
      });
    });
    $("mi-auto").addEventListener("click", function () { state.miManual = false; calc(); });
    if (amort) {
      amort.addEventListener("toggle", renderAmort);
      all("[data-view]").forEach(function (b) {
        b.addEventListener("click", function () {
          state.view = b.getAttribute("data-view");
          all("[data-view]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
          renderAmort();
        });
      });
    }
    $("reset").addEventListener("click", reset);

    // Used by the page template's tax table ("Click a town to load it into the calculator").
    root.macalcSetTown = function (name) {
      if (!findTown(name)) return;
      el.town.value = name; applyTown(); calc();
    };

    // Mobile sticky bar: show while the calculator form is on screen but the results card isn't.
    if ("IntersectionObserver" in window) {
      var calcVisible = false, resultsVisible = false;
      var update = function () { bar.classList.toggle("mc-show", calcVisible && !resultsVisible); };
      var o1 = new IntersectionObserver(function (es) { calcVisible = es[0].isIntersecting; update(); });
      var o2 = new IntersectionObserver(function (es) { resultsVisible = es[0].isIntersecting; update(); }, { threshold: 0.25 });
      o1.observe($("calc-form")); o2.observe($("results"));
      inst.observers.push(o1, o2);
    }

    function reset() {
      state.miManual = false;
      setNum(el.price, DEFAULTS.price);
      state.downUnit = "usd"; setDownUnit("pct"); setNum(el.down, DEFAULTS.downPct, 2);
      setNum(el.rate, DEFAULTS.rate, 3);
      el.term.value = String(DEFAULTS.term);
      el.type.value = DEFAULTS.type;
      el.town.value = DEFAULTS.town; applyTown();
      setNum(el.ins, DEFAULTS.ins); setNum(el.hoa, DEFAULTS.hoa);
      calc();
    }
    reset();
  }

  // ---------- Full-page template ----------
  function initPage(s) {
    Array.prototype.forEach.call(s.querySelectorAll("[data-macalc-icon]"), function (span) {
      if (!span.firstChild && ICONS[span.getAttribute("data-macalc-icon")]) span.innerHTML = icon(span.getAttribute("data-macalc-icon"));
    });
    Array.prototype.forEach.call(s.querySelectorAll("[data-macalc-taxtable]"), function (body) {
      if (body.getAttribute("data-macalc-ready")) return;
      body.setAttribute("data-macalc-ready", "1");
      var html = "";
      body.getAttribute("data-macalc-taxtable").split(",").forEach(function (n) {
        var t = findTown(n.trim()); if (!t) return;
        html += "<tr><td><button type='button' data-town='" + esc(t.name) + "'>" + esc(t.name) + "</button></td><td>$" + t.rate.toFixed(2) +
          (t.verified ? "" : "<span class='mcp-est'>est.</span>") + "</td><td>" + money(600000 * t.rate / 1000) + "</td></tr>";
      });
      body.innerHTML = html;
      body.addEventListener("click", function (e) {
        var b = e.target.closest("button[data-town]"); if (!b) return;
        var page = body.closest(".macalc-page") || document;
        var calcRoot = page.querySelector(".macalc[data-macalc-ready]") || document.querySelector(".macalc[data-macalc-ready]");
        if (!calcRoot || !calcRoot.macalcSetTown) return;
        calcRoot.macalcSetTown(b.getAttribute("data-town"));
        calcRoot.scrollIntoView({ behavior: "smooth" });
      });
    });
  }

  function initAll(scope) {
    var s = scope && scope.querySelectorAll ? scope : document;
    var nodes = Array.prototype.slice.call(s.querySelectorAll(".macalc[data-macalc]"));
    if (s.matches && s.matches(".macalc[data-macalc]")) nodes.unshift(s);
    nodes.forEach(init);
    initPage(s);
  }

  window.MassachusettsCalculator = { init: initAll };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { initAll(document); });
  else initAll(document);

  // Elementor: re-initialise widgets rendered or re-rendered in the editor preview.
  function hookElementor() {
    var ef = window.elementorFrontend;
    if (!ef || !ef.hooks) return false;
    ef.hooks.addAction("frontend/element_ready/global", function ($scope) {
      initAll($scope && $scope[0] ? $scope[0] : document);
    });
    return true;
  }
  if (!hookElementor() && window.jQuery) window.jQuery(window).on("elementor/frontend/init", hookElementor);
})();
