const API_URL = "https://fchavonet.github.io/full_stack-db_visual_adventure_cards_api/api/v1/cards.json";

const partSelect = document.getElementById("partSelect");

async function fetchPrismCards() {
  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const cards = await response.json();

    const prismCards = cards.filter(function (card) {
      return card.rarity === "prism";
    });

    populatePartSelect(prismCards);
  } catch (error) {
    console.error("Unable to load cards:", error);
  }
}

function populatePartSelect(prismCards) {
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
}

fetchPrismCards();
