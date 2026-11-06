(function () {
  var products = window.SHINY_PRODUCTS || [];
  var labels = window.SHINY_LABELS;
  var state = { equipment: "", season: "", query: "" };

  function norm(value) {
    return String(value || "")
      .toLocaleLowerCase("ru")
      .replace(/ё/g, "е")
      .trim();
  }

  function formatPrice(value) {
    return new Intl.NumberFormat("ru-RU").format(value) + " ₽";
  }

  function readState() {
    var params = new URLSearchParams(window.location.search);
    var equipment = params.get("equipment") || "";
    var season = params.get("season") || "";
    if (!labels.equipment[equipment]) equipment = "";
    if (!labels.season[season]) season = "";
    state.equipment = equipment;
    state.season = season;
    state.query = params.get("q") || "";
  }

  function writeState() {
    var params = new URLSearchParams();
    if (state.equipment) params.set("equipment", state.equipment);
    if (state.season) params.set("season", state.season);
    if (state.query.trim()) params.set("q", state.query.trim());
    var next = params.toString();
    var url = next ? "index.html?" + next : "index.html";
    window.history.replaceState(null, "", url);
  }

  function matches(product) {
    if (state.equipment && product.equipment !== state.equipment) return false;
    if (state.season && product.season !== state.season) return false;
    var query = norm(state.query);
    if (!query) return true;
    var haystack = norm(
      [
        product.name,
        product.specs,
        labels.equipment[product.equipment],
        labels.season[product.season]
      ].join(" ")
    );
    return haystack.indexOf(query) !== -1;
  }

  function picture(product) {
    return (
      '<picture>' +
      '<source srcset="' + product.image + '.webp" type="image/webp">' +
      '<img src="' + product.image + '.jpg" alt="' + escapeAttr(product.alt) + '" width="' + product.width + '" height="' + product.height + '">' +
      "</picture>"
    );
  }

  function escapeAttr(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;");
  }

  function card(product) {
    var qty = (window.ShinyCart.read()[product.id]) || 0;
    var buttonLabel = qty ? "В корзине: " + qty : "В корзину";
    return (
      '<article class="card">' +
      '<div class="card-media">' + picture(product) + "</div>" +
      '<div class="card-body">' +
      '<p class="tags"><span class="tag">' + labels.equipment[product.equipment] + "</span>" +
      '<span class="tag">' + labels.season[product.season] + "</span></p>" +
      "<h3>" + escapeAttr(product.name) + "</h3>" +
      '<p class="specs">' + escapeAttr(product.specs) + "</p>" +
      '<p class="price"><span class="price-value">' + formatPrice(product.price) + '</span><span class="price-note">цена образца</span></p>' +
      '<button type="button" class="btn btn-primary" data-add="' + product.id + '">' + buttonLabel + "</button>" +
      "</div></article>"
    );
  }

  function render() {
    var grid = document.querySelector("[data-grid]");
    var count = document.querySelector("[data-result-count]");
    var empty = document.querySelector("[data-empty]");
    if (!grid) return;
    var found = products.filter(matches);
    grid.innerHTML = found.map(card).join("");
    if (count) {
      count.textContent = found.length
        ? "В выборке " + found.length + " " + plural(found.length)
        : "Ничего не найдено";
    }
    if (empty) empty.hidden = found.length > 0;
    grid.querySelectorAll("[data-add]").forEach(function (button) {
      button.addEventListener("click", function () {
        var id = button.getAttribute("data-add");
        var product = products.filter(function (item) { return item.id === id; })[0];
        var qty = window.ShinyCart.add(id);
        button.textContent = "Добавлено";
        var status = document.querySelector("[data-cart-status]");
        if (status && product) {
          status.textContent = product.name + " добавлена в корзину. Сейчас " + qty + " шт.";
        }
        window.setTimeout(function () {
          var current = window.ShinyCart.read()[id] || 0;
          button.textContent = current ? "В корзине: " + current : "В корзину";
        }, 900);
      });
    });
  }

  function plural(number) {
    var mod10 = number % 10;
    var mod100 = number % 100;
    if (mod10 === 1 && mod100 !== 11) return "шина";
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "шины";
    return "шин";
  }

  function syncChips() {
    document.querySelectorAll("[data-equip]").forEach(function (button) {
      button.setAttribute("aria-pressed", String(button.getAttribute("data-equip") === state.equipment));
    });
    document.querySelectorAll("[data-season]").forEach(function (button) {
      button.setAttribute("aria-pressed", String(button.getAttribute("data-season") === state.season));
    });
    var search = document.querySelector("[data-search]");
    if (search && search.value !== state.query) search.value = state.query;
  }

  function bind() {
    document.querySelectorAll("[data-equip]").forEach(function (button) {
      button.addEventListener("click", function () {
        state.equipment = button.getAttribute("data-equip") || "";
        writeState();
        syncChips();
        render();
      });
    });
    document.querySelectorAll("[data-season]").forEach(function (button) {
      button.addEventListener("click", function () {
        state.season = button.getAttribute("data-season") || "";
        writeState();
        syncChips();
        render();
      });
    });
    var search = document.querySelector("[data-search]");
    if (search) {
      search.addEventListener("input", function () {
        state.query = search.value;
        writeState();
        render();
      });
    }
    var reset = document.querySelector("[data-reset]");
    if (reset) {
      reset.addEventListener("click", function () {
        state.equipment = "";
        state.season = "";
        state.query = "";
        writeState();
        syncChips();
        render();
        var field = document.querySelector("[data-search]");
        if (field) field.focus();
      });
    }
    document.addEventListener("shiny-cart", function () {
      document.querySelectorAll("[data-add]").forEach(function (button) {
        if (button.textContent === "Добавлено") return;
        var id = button.getAttribute("data-add");
        var qty = window.ShinyCart.read()[id] || 0;
        button.textContent = qty ? "В корзине: " + qty : "В корзину";
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    readState();
    syncChips();
    bind();
    render();
  });
})();
