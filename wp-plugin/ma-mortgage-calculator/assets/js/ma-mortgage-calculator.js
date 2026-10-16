/* Massachusetts Mortgage Calculator */
(function () {
  "use strict";

  var CONFIG = window.MMC_CONFIG || { defaults: {}, towns: [] };
  var DEFAULTS = Object.assign({ price: 600000, downPct: 20, rate: 6.25, term: 30, type: "conv", town: "Canton", ins: 1800, hoa: 0 }, CONFIG.defaults);
  var TOWNS = CONFIG.towns || [];
  var COLORS = { pi: "var(--mmc-c-pi)", tax: "var(--mmc-c-tax)", ins: "var(--mmc-c-ins)", mi: "var(--mmc-c-mi)", hoa: "var(--mmc-c-hoa)" };

  var fmt0 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  var fmtN = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
  function money(n) { return fmt0.format(Math.round(n || 0)); }
  function num(input) { var v = parseFloat(String(input.value).replace(/[^0-9.]/g, "")); return isFinite(v) ? v : 0; }
  function setNum(input, v, dec) { input.value = dec ? (+v).toFixed(dec).replace(/\.?0+$/, "") : fmtN.format(Math.round(v)); }
  function findTown(name) { for (var i = 0; i < TOWNS.length; i++) if (TOWNS[i].name === name) return TOWNS[i]; return null; }

  function pmt(principal, annualRate, months) {
    if (principal <= 0) return 0;
    var r = annualRate / 100 / 12;
    if (r === 0) return principal / months;
    return principal * r / (1 - Math.pow(1 + r, -months));
  }
  // Conventional PMI, annual factor by LTV (typical good-credit ranges).
  function convPmiRate(ltv) {
    if (ltv <= 80) return 0;
    if (ltv <= 85) return 0.003;
    if (ltv <= 90) return 0.005;
    if (ltv <= 95) return 0.007;
    return 0.009;
  }
  // FHA annual MIP (HUD schedule for base loans up to the standard limit).
  function fhaMipRate(ltv, term) {
    if (term > 15) return ltv > 95 ? 0.0055 : 0.005;
    return ltv > 90 ? 0.004 : 0.0015;
  }
  // VA funding fee, first use.
  function vaFeeRate(downPct) { return downPct >= 10 ? 0.0125 : downPct >= 5 ? 0.015 : 0.0215; }

  function init(root) {
    var q = function (sel) { return root.querySelector(sel); };
    var qa = function (sel) { return Array.prototype.slice.call(root.querySelectorAll(sel)); };
    var f = {}, o = {};
    qa("[data-f]").forEach(function (n) { f[n.getAttribute("data-f")] = n; });
    qa("[data-o]").forEach(function (n) { o[n.getAttribute("data-o")] = n; });
    var state = { downUnit: "pct", miManual: false, view: "year", schedule: null };

    TOWNS.forEach(function (t) {
      var opt = document.createElement("option");
      opt.value = t.name; opt.textContent = t.name + " (" + t.county + " County)";
      f.town.appendChild(opt);
    });
    var other = document.createElement("option");
    other.value = "__other"; other.textContent = "Other town (enter rate)";
    f.town.appendChild(other);

    function applyTown() { var t = findTown(f.town.value); if (t) setNum(f.taxrate, t.rate, 2); }

    function downAmount(price) {
      var v = num(f.down);
      return state.downUnit === "pct" ? price * Math.min(v, 100) / 100 : Math.min(v, price);
    }

    function setDownUnit(unit) {
      var price = num(f.price), amt = downAmount(price);
      state.downUnit = unit;
      qa("[data-unit]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-unit") === unit)); });
      o["down-l"].style.display = unit === "usd" ? "" : "none";
      o["down-r"].style.display = unit === "pct" ? "" : "none";
      f.down.classList.toggle("mmc-pct", unit === "pct");
      if (unit === "pct") setNum(f.down, price ? amt / price * 100 : 0, 2); else setNum(f.down, amt);
    }

    function calc() {
      var price = num(f.price);
      var dAmt = downAmount(price);
      var dPct = price ? dAmt / price * 100 : 0;
      var rate = num(f.rate), term = +f.term.value, type = f.type.value;
      var taxRate = num(f.taxrate), ins = num(f.ins), hoa = num(f.hoa);
      var months = term * 12;
      var base = Math.max(price - dAmt, 0);
      var ltv = price ? base / price * 100 : 0;
      var fee = 0, feeLabel = "", autoMi = 0, miLabel = "PMI", typeHelp, miHelp;

      if (type === "fha") {
        fee = base * 0.0175; feeLabel = "FHA upfront MIP (1.75%), financed";
        autoMi = base * fhaMipRate(ltv, term) / 12; miLabel = "FHA MIP";
        typeHelp = "FHA requires at least 3.5% down. Adds 1.75% upfront MIP plus monthly MIP.";
        miHelp = "Monthly MIP at " + (fhaMipRate(ltv, term) * 100).toFixed(2) + "% of the base loan per year.";
      } else if (type === "va") {
        fee = base * vaFeeRate(dPct); feeLabel = "VA funding fee (" + (vaFeeRate(dPct) * 100).toFixed(2) + "%, first use), financed";
        miLabel = "Mortgage insurance";
        typeHelp = "VA loans allow 0% down and have no monthly mortgage insurance. The funding fee may be waived for some veterans.";
        miHelp = "VA loans have no monthly mortgage insurance.";
      } else {
        autoMi = base * convPmiRate(ltv) / 12;
        typeHelp = "Conventional loans can start at 3% down for eligible buyers.";
        miHelp = ltv > 80 ? "Estimated at " + (convPmiRate(ltv) * 100).toFixed(2) + "% of the loan per year. Usually removable at 20% equity." : "No PMI with 20% or more down.";
      }

      if (!state.miManual) setNum(f.mi, autoMi);
      var mi = state.miManual ? num(f.mi) : autoMi;

      var loan = base + fee;
      var pi = pmt(loan, rate, months);
      var tax = price * taxRate / 1000 / 12;
      var insM = ins / 12;
      var total = pi + tax + insM + mi + hoa;

      var r = rate / 100 / 12, bal = loan, totalInt = 0, monthly = [], yearly = [], y = null;
      for (var m = 1; m <= months && bal > 0.005; m++) {
        var int = r === 0 ? 0 : bal * r;
        var prin = Math.min(pi - int, bal);
        bal -= prin; totalInt += int;
        monthly.push([m, prin, int, bal]);
        var yi = Math.ceil(m / 12);
        if (!y || y[0] !== yi) { y = [yi, 0, 0, 0]; yearly.push(y); }
        y[1] += prin; y[2] += int; y[3] = bal;
      }
      state.schedule = { month: monthly, year: yearly };

      o["town-label"].textContent = f.town.value === "__other" ? "Custom tax rate" : f.town.value + ", MA";
      o.total.innerHTML = money(total) + "<small>/mo</small>";
      o.total2.textContent = money(total);
      o["mobile-total"].textContent = money(total) + "/mo";
      o.loan.textContent = money(loan);
      o.interest.textContent = money(totalInt);
      var payoff = new Date(); payoff.setMonth(payoff.getMonth() + months);
      o.payoff.textContent = "Paid off " + payoff.toLocaleDateString("en-US", { month: "short", year: "numeric" });

      var rows = [
        ["pi", "Principal & interest", rate.toFixed(3).replace(/\.?0+$/, "") + "% · " + term + "-yr", pi, true],
        ["tax", "Property tax", "$" + taxRate.toFixed(2) + " per $1,000 · " + money(tax * 12) + "/yr", tax, true],
        ["ins", "Homeowners insurance", money(ins) + "/yr", insM, true],
        ["mi", miLabel, mi > 0 ? (state.miManual ? "Custom amount" : "Auto-estimated") : (type === "va" ? "None on VA loans" : "Not required at 20%+ down"), mi, true],
        ["hoa", "HOA / condo fee", hoa > 0 ? "Monthly" : "None entered", hoa, true]
      ];
      var rh = "", sh = "";
      rows.forEach(function (row) {
        rh += "<div class='mmc-brow" + (row[3] > 0 ? "" : " mmc-off") + "'><span class='mmc-dot' style='background:" + COLORS[row[0]] + "'></span>" +
              "<span class='mmc-name'>" + row[1] + "<small>" + row[2] + "</small></span><span class='mmc-amt'>" + money(row[3]) + "</span></div>";
        if (row[3] > 0 && total > 0) sh += "<span style='width:" + (row[3] / total * 100) + "%;background:" + COLORS[row[0]] + "'></span>";
      });
      o.rows.innerHTML = rh;
      o.stack.innerHTML = sh;

      var extra = "<strong>Cash to close (before closing costs):</strong> " + money(dAmt) + " down payment";
      if (fee > 0) extra += "<br>" + feeLabel + ": <strong>" + money(fee) + "</strong>";
      o.extra.innerHTML = extra;

      o["type-help"].textContent = typeHelp;
      o["mi-help"].textContent = state.miManual ? "Custom amount. Click \"Use auto\" to restore the estimate." : miHelp;
      o["mi-badge"].hidden = state.miManual;
      o["mi-auto"].hidden = !state.miManual;

      var dh = state.downUnit === "pct" ? money(dAmt) + " down" : dPct.toFixed(1).replace(/\.0$/, "") + "% down";
      if (type === "fha" && dPct < 3.5) dh += " · FHA minimum is 3.5%";
      if (type === "conv" && dPct < 3) dh += " · Conventional minimum is usually 3%";
      o["down-help"].textContent = dh;
      qa("[data-dp]").forEach(function (b) { b.setAttribute("aria-pressed", String(Math.abs(+b.getAttribute("data-dp") - dPct) < 0.01)); });

      var t = findTown(f.town.value);
      o["tax-meta"].innerHTML = f.town.value === "__other"
        ? "Enter your town's residential rate from the town assessor or MA DOR."
        : "Annual tax estimate <strong>" + money(tax * 12) + "</strong><span class='mmc-tag'>" + (t && num(f.taxrate) !== t.rate ? "Edited rate" : "Residential rate per $1,000") + "</span>";

      f.range.value = Math.min(Math.max(price, +f.range.min), +f.range.max);
      renderAmort();
    }

    function renderAmort() {
      if (!o.amort.open || !state.schedule) return;
      var data = state.schedule[state.view], html = "";
      o.period.textContent = state.view === "year" ? "Year" : "Month";
      for (var i = 0; i < data.length; i++) {
        var d = data[i];
        html += "<tr><td>" + d[0] + "</td><td>" + money(d[1]) + "</td><td>" + money(d[2]) + "</td><td>" + money(d[1] + d[2]) + "</td><td>" + money(d[3]) + "</td></tr>";
      }
      o["amort-body"].innerHTML = html;
    }

    function reset() {
      state.miManual = false;
      setNum(f.price, DEFAULTS.price);
      state.downUnit = "usd"; setDownUnit("pct"); setNum(f.down, DEFAULTS.downPct, 2);
      setNum(f.rate, DEFAULTS.rate, 3);
      f.term.value = String(DEFAULTS.term);
      f.type.value = DEFAULTS.type;
      f.town.value = findTown(DEFAULTS.town) ? DEFAULTS.town : (TOWNS[0] ? TOWNS[0].name : "__other");
      applyTown();
      setNum(f.ins, DEFAULTS.ins); setNum(f.hoa, DEFAULTS.hoa);
      calc();
    }

    ["price", "down", "rate", "taxrate", "ins", "hoa", "mi"].forEach(function (k) {
      f[k].addEventListener("input", function () { if (k === "mi") state.miManual = true; calc(); });
      f[k].addEventListener("blur", function () {
        var dec = (k === "rate" || k === "taxrate" || (k === "down" && state.downUnit === "pct")) ? 3 : 0;
        setNum(f[k], num(f[k]), dec);
      });
    });
    f.range.addEventListener("input", function () { setNum(f.price, +f.range.value); calc(); });
    f.term.addEventListener("change", calc);
    f.type.addEventListener("change", function () {
      var price = num(f.price), dPct = price ? downAmount(price) / price * 100 : 0;
      if (f.type.value === "fha" && dPct < 3.5) { setDownUnit("pct"); setNum(f.down, 3.5, 2); }
      calc();
    });
    f.town.addEventListener("change", function () { applyTown(); calc(); });
    qa("[data-unit]").forEach(function (b) { b.addEventListener("click", function () { setDownUnit(b.getAttribute("data-unit")); calc(); }); });
    qa("[data-dp]").forEach(function (b) {
      b.addEventListener("click", function () {
        var pct = +b.getAttribute("data-dp"), price = num(f.price);
        if (state.downUnit === "pct") setNum(f.down, pct, 2); else setNum(f.down, price * pct / 100);
        calc();
      });
    });
    o["mi-auto"].addEventListener("click", function () { state.miManual = false; calc(); });
    o.amort.addEventListener("toggle", renderAmort);
    qa("[data-view]").forEach(function (b) {
      b.addEventListener("click", function () {
        state.view = b.getAttribute("data-view");
        qa("[data-view]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
        renderAmort();
      });
    });
    q("[data-mmc-reset]").addEventListener("click", reset);

    // Tax table shortcode: clicking a town loads it into this calculator.
    document.addEventListener("click", function (e) {
      var b = e.target.closest ? e.target.closest("[data-mmc-town]") : null;
      if (!b) return;
      f.town.value = b.getAttribute("data-mmc-town"); applyTown(); calc();
      root.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    // Mobile: keep the payment visible while the form is on screen and the results card isn't.
    if ("IntersectionObserver" in window) {
      var bar = q("[data-mmc-bar]"), formVis = false, resVis = false;
      var upd = function () { bar.classList.toggle("mmc-show", formVis && !resVis); };
      new IntersectionObserver(function (es) { formVis = es[0].isIntersecting; upd(); }).observe(q("[data-mmc-form]"));
      new IntersectionObserver(function (es) { resVis = es[0].isIntersecting; upd(); }, { threshold: 0.25 }).observe(q("[data-mmc-results]"));
    }

    reset();
  }

  function boot() { Array.prototype.forEach.call(document.querySelectorAll("[data-mmc]"), init); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
