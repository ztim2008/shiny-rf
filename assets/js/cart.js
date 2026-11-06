(function () {
  var products = window.SHINY_PRODUCTS || [];
  var labels = window.SHINY_LABELS;

  function formatPrice(value) {
    return new Intl.NumberFormat("ru-RU").format(value) + " ₽";
  }

  function byId(id) {
    for (var i = 0; i < products.length; i += 1) {
      if (products[i].id === id) return products[i];
    }
    return null;
  }

  function lines() {
    var cart = window.ShinyCart.read();
    return Object.keys(cart).map(function (id) {
      var product = byId(id);
      if (!product) return null;
      return { product: product, qty: cart[id] };
    }).filter(Boolean);
  }

  function picture(product) {
    return (
      '<picture>' +
      '<source srcset="' + product.image + '.webp" type="image/webp">' +
      '<img src="' + product.image + '.jpg" alt="' + String(product.alt).replace(/"/g, "&quot;") + '" width="' + product.width + '" height="' + product.height + '">' +
      "</picture>"
    );
  }

  function render() {
    var list = document.querySelector("[data-cart-list]");
    var empty = document.querySelector("[data-cart-empty]");
    var summary = document.querySelector("[data-cart-summary]");
    var total = document.querySelector("[data-cart-total]");
    var count = document.querySelector("[data-cart-units]");
    if (!list) return;
    var items = lines();
    if (!items.length) {
      list.innerHTML = "";
      if (empty) empty.hidden = false;
      if (summary) summary.hidden = true;
      return;
    }
    if (empty) empty.hidden = true;
    if (summary) summary.hidden = false;
    var sum = 0;
    var units = 0;
    list.innerHTML = items.map(function (line) {
      var lineSum = line.product.price * line.qty;
      sum += lineSum;
      units += line.qty;
      return (
        '<article class="line">' +
        '<div class="line-photo">' + picture(line.product) + "</div>" +
        '<div class="line-copy">' +
        '<h2>' + line.product.name + "</h2>" +
        '<p class="specs">' + labels.equipment[line.product.equipment] + " · " + labels.season[line.product.season] + "</p>" +
        '<p class="specs">' + line.product.specs + "</p>" +
        '<div class="line-actions">' +
        '<div class="qty" role="group" aria-label="Количество">' +
        '<button type="button" data-dec="' + line.product.id + '" aria-label="Уменьшить количество, ' + line.product.name + '">−</button>' +
        '<span aria-live="polite">' + line.qty + "</span>" +
        '<button type="button" data-inc="' + line.product.id + '" aria-label="Увеличить количество, ' + line.product.name + '">+</button>' +
        "</div>" +
        '<button type="button" class="text-button" data-remove="' + line.product.id + '">Удалить</button>' +
        "</div></div>" +
        '<p class="line-price"><span>' + formatPrice(lineSum) + '</span><span class="price-note">' + formatPrice(line.product.price) + " / шт.</span></p>" +
        "</article>"
      );
    }).join("");
    if (total) total.textContent = formatPrice(sum);
    if (count) count.textContent = String(units);
    list.querySelectorAll("[data-dec]").forEach(function (button) {
      button.addEventListener("click", function () {
        var id = button.getAttribute("data-dec");
        var qty = window.ShinyCart.read()[id] || 1;
        if (qty <= 1) return;
        window.ShinyCart.setQty(id, qty - 1);
      });
    });
    list.querySelectorAll("[data-inc]").forEach(function (button) {
      button.addEventListener("click", function () {
        window.ShinyCart.add(button.getAttribute("data-inc"));
      });
    });
    list.querySelectorAll("[data-remove]").forEach(function (button) {
      button.addEventListener("click", function () {
        window.ShinyCart.remove(button.getAttribute("data-remove"));
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    render();
    document.addEventListener("shiny-cart", render);
    var order = document.querySelector("[data-demo-order]");
    var note = document.querySelector("[data-demo-note]");
    if (order && note) {
      order.addEventListener("click", function () {
        note.textContent = "Заказ не создан. Кнопка ничего не отправляет и не оформляет покупку.";
      });
    }
  });
})();
