function add(a, b) {
  return a + b;
}

function applyDiscount(total, member) {
  return member ? total * 0.9 : total;
}

module.exports = { add, applyDiscount };
