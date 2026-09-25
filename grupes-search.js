/* AIstė v1.2: deterministic RA group search over grupes.json (ExoClass public catalogue).
   Same file runs in the page (window.AisteSearch) and in node tests (module.exports). */
(function (root) {
  "use strict";
  var DAYS = ["pirm", "antr", "trec", "ketv", "penk", "sest", "sekm"];
  var DAY_NAME = { pirm: "pirmadieniais", antr: "antradieniais", trec: "trečiadieniais", ketv: "ketvirtadieniais", penk: "penktadieniais", sest: "šeštadieniais", sekm: "sekmadieniais" };
  var LINK = "https://bureliai.robotikosakademija.lt/#grupe=";

  function norm(s) {
    return String(s == null ? "" : s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[„“"']/g, "").replace(/\s+/g, " ").trim();
  }
  function prefixLen(a, b) { var i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++; return i; }
  function dayKey(s) { var n = norm(s).slice(0, 4); return DAYS.indexOf(n) >= 0 ? n : null; }

  // groups: [miestas, vieta, programa, amziusLabel, ages[], [[dayKey,"14:00–15:30"],...], kaina|null, laisvu|null, pilna(0/1), tikIstaigos(0/1), prasideda|"" , kodas]
  function cityIndex(G) {
    var c = {};
    for (var i = 0; i < G.length; i++) { var k = norm(G[i][0]); (c[k] = c[k] || { name: G[i][0], n: 0 }).n++; }
    return c;
  }
  function findCity(G, q) {
    var idx = cityIndex(G), nq = norm(q).replace(/ (m|r|sav|raj|rajonas|miestas)\.?$/, "");
    if (!nq) return null;
    if (idx[nq]) return idx[nq].name;
    var best = null, bestP = 0, bestN = 0;
    for (var k in idx) {
      var p = prefixLen(k, nq);
      var need = Math.max(4, Math.min(k.length, nq.length) - 3);
      if (p >= need && (p > bestP || (p === bestP && idx[k].n > bestN))) { best = idx[k].name; bestP = p; bestN = idx[k].n; }
    }
    return best;
  }
  function wantedAges(p) {
    var k = p.klase, a = p.amzius_metai;
    if (k !== undefined && k !== null && k !== "") { k = parseInt(k, 10); if (!isNaN(k)) return k <= 0 ? [0] : [k]; }
    if (a !== undefined && a !== null && a !== "") {
      a = parseInt(a, 10);
      if (isNaN(a)) return null;
      if (a < 4) return "per_jaunas";
      if (a === 4) return [-1];
      if (a === 5) return [-1, 0];
      if (a === 6) return [0];
      return [Math.min(a - 6, 6)];
    }
    return null;
  }
  function fmt(g) {
    return {
      vieta: g[1], programa: g[2].replace(/ (\d+) min$/, ""), trukme: (g[2].match(/(\d+) min$/) || [,""])[1] + " min", amzius: g[3],
      laikas: g[5].map(function (d) { return DAY_NAME[d[0]] + " " + d[1]; }).join("; "),
      kaina: g[6] ? g[6] + " € per mėn." : "kaina matoma registracijoje",
      vietos: g[8] ? "PILNA" : (g[7] == null ? "tikslinti" : "laisvų vietų " + g[7]),
      tik_sios_istaigos_vaikams: !!g[9],
      prasideda: g[10] || undefined,
      nuoroda: LINK + g[11]
    };
  }
  function search(G, p) {
    p = p || {};
    var city = findCity(G, p.miestas);
    if (!city) return { rezultatas: "miesto_nera", ieskota: p.miestas || "", pastaba: "Kataloge šiame mieste Robotikos Akademijos grupių nėra. Nesugalvok grupių." };
    var inCity = G.filter(function (g) { return g[0] === city; });
    var ages = wantedAges(p);
    if (ages === "per_jaunas") return { rezultatas: "per_jaunas", miestas: city, pastaba: "Būreliai tik nuo ketverių metų." };
    var prog = norm(p.programa || "");
    var vr = /vr|virtual|brain/.test(prog), rob = /robot/.test(prog);
    var m = inCity.filter(function (g) {
      if (vr && !/brain/i.test(g[2])) return false;
      if (rob && /brain/i.test(g[2])) return false;
      if (ages && !ages.some(function (a) { return g[4].indexOf(a) >= 0; })) return false;
      return true;
    });
    var vq = norm(p.vieta || "");
    if (vq) { var mv = m.filter(function (g) { return norm(g[1]).indexOf(vq) >= 0; }); if (mv.length) m = mv; }
    var dk = p.diena ? dayKey(p.diena) : null;
    var md = dk ? m.filter(function (g) { return g[5].some(function (d) { return d[0] === dk; }); }) : m;
    function rank(g) { return (g[8] ? 2 : 0) + (g[9] ? 1 : 0); }
    function pick(list, n) { return list.slice().sort(function (a, b) { return rank(a) - rank(b); }).slice(0, n).map(fmt); }
    var daysAvail = {};
    m.forEach(function (g) { g[5].forEach(function (d) { daysAvail[d[0]] = 1; }); });
    var out = {
      rezultatas: m.length ? "rasta" : "nera_tinkamo_amziaus",
      miestas: city, grupiu_mieste: inCity.length, tinkamu_grupiu: m.length,
      tinkamu_su_laisvomis_vietomis: m.filter(function (g) { return !g[8]; }).length,
      dienos_su_tinkamomis_grupemis: DAYS.filter(function (d) { return daysAvail[d]; }).map(function (d) { return DAY_NAME[d]; })
    };
    if (dk) {
      out.ieskota_diena = DAY_NAME[dk];
      out.tinkamu_ta_diena = md.length;
      out.grupes_ta_diena = md.slice(0, 3).map(fmt);
      if (md.length === 0 || md.every(function (g) { return g[8]; })) out.kitos_dienos_pavyzdziai = pick(m.filter(function (g) { return md.indexOf(g) < 0; }), 3);
    } else {
      out.grupes = pick(m, 3);
    }
    var shown = (out.grupes || out.grupes_ta_diena || []).length;
    out.santrauka = "Mieste " + city + " tinkamų grupių: " + m.length + " (su laisvomis vietomis: " + out.tinkamu_su_laisvomis_vietomis + ")" +
      (dk ? ", iš jų " + DAY_NAME[dk] + ": " + md.length : "") + ". Čia parodyta: " + shown + ".";
    out.pastaba = "Pradėk nuo santraukos skaičiaus. Sakyk tik šias grupes. Laiką ir kainą sakyk skaitmenimis tiksliai kaip čia. Jei tinkamu_grupiu daugiau nei parodyta, pasakyk tikslų skaičių ir paklausk dienos ar rajono. Kodų neskaityk.";
    return out;
  }
  var api = { search: search, findCity: findCity, norm: norm };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.AisteSearch = api;
})(this);
