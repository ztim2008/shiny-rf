(function () {
  var KEY = "shiny-rf-cart-v1";
  var memory = {};

  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return Object.assign({}, memory);
      var data = JSON.parse(raw);
      if (!data || typeof data !== "object" || Array.isArray(data)) return {};
      var clean = {};
      Object.keys(data).forEach(function (id) {
        var qty = parseInt(data[id], 10);
        if (qty > 0 && qty < 100) clean[id] = qty;
      });
      memory = clean;
      return Object.assign({}, clean);
    } catch (error) {
      return Object.assign({}, memory);
    }
  }

  function write(cart) {
    memory = cart;
    try {
      localStorage.setItem(KEY, JSON.stringify(cart));
    } catch (error) {
      /* file origins can block storage; the in-memory cart still works on this page */
    }
    document.dispatchEvent(new CustomEvent("shiny-cart"));
  }

  function countOf(cart) {
    return Object.keys(cart).reduce(function (sum, id) {
      return sum + cart[id];
    }, 0);
  }

  window.ShinyCart = {
    read: read,
    count: function () {
      return countOf(read());
    },
    add: function (id) {
      var cart = read();
      cart[id] = Math.min(99, (cart[id] || 0) + 1);
      write(cart);
      return cart[id];
    },
    setQty: function (id, qty) {
      var cart = read();
      var next = parseInt(qty, 10);
      if (!next || next < 1) delete cart[id];
      else cart[id] = Math.min(99, next);
      write(cart);
    },
    remove: function (id) {
      var cart = read();
      delete cart[id];
      write(cart);
    }
  };

  function paint() {
    var count = String(window.ShinyCart.count());
    document.querySelectorAll("[data-cart-count]").forEach(function (node) {
      node.textContent = count;
    });
  }

  document.addEventListener("shiny-cart", paint);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", paint);
  } else {
    paint();
  }
})();
