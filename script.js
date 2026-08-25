const API_URL = "https://fchavonet.github.io/full_stack-db_visual_adventure_cards_api/api/v1/cards.json";

const partSelect = document.getElementById("partSelect");
const cardSelect = document.getElementById("cardSelect");

let prismCards = [];

async function fetchPrismCards() {
  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const cards = await response.json();

    prismCards = cards.filter(function (card) {
      return card.rarity === "prism";
    });

    populatePartSelect();
  } catch (error) {
    console.error("Unable to load cards:", error);
  }
}

function populatePartSelect() {
  const parts = [];

  prismCards.forEach(function (card) {
    if (!parts.includes(card.part)) {
      parts.push(card.part);
    }
  });

  parts.sort(function (a, b) {
    return Number(a) - Number(b);
  });

  partSelect.innerHTML = "";

  parts.forEach(function (part) {
    const option = document.createElement("option");

    option.value = part;
    option.textContent = `Part ${part}`;

    partSelect.appendChild(option);
  });

  partSelect.disabled = false;

  populateCardSelect(partSelect.value);
}

function populateCardSelect(part) {
  const cardsForPart = prismCards.filter(function (card) {
    return String(card.part) === String(part);
  });

  cardSelect.innerHTML = "";

  cardsForPart.forEach(function (card) {
    const option = document.createElement("option");

    option.value = card.id;
    option.textContent = `#${card.number} — ${card.title_jp}`;

    cardSelect.appendChild(option);
  });

  cardSelect.disabled = false;
}

partSelect.addEventListener("change", function () {
  populateCardSelect(partSelect.value);
});

fetchPrismCards();
