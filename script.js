const API_URL = "https://fchavonet.github.io/full_stack-db_visual_adventure_cards_api/api/v1/cards.json";

const partSelect = document.getElementById("partSelect");
const cardSelect = document.getElementById("cardSelect");
const cardPreview = document.getElementById("cardPreview");
const previewMessage = document.getElementById("previewMessage");

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

    previewMessage.textContent = "Unable to load cards.";
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
    option.textContent = `#${card.number} — ${card.title_en}`;

    cardSelect.appendChild(option);
  });

  cardSelect.disabled = false;

  displaySelectedCard(cardSelect.value);
}

function displaySelectedCard(cardId) {
  const selectedCard = prismCards.find(function (card) {
    return card.id === cardId;
  });

  if (!selectedCard) {
    cardPreview.classList.add("hidden");

    previewMessage.classList.remove("hidden");
    previewMessage.textContent = "No card selected.";

    return;
  }

  cardPreview.src = selectedCard.front_image_url;
  cardPreview.alt = `Dragon Ball Visual Adventure #${selectedCard.number} — ${selectedCard.title_en}`;

  previewMessage.classList.add("hidden");
  cardPreview.classList.remove("hidden");
}

partSelect.addEventListener("change", function () {
  populateCardSelect(partSelect.value);
});

cardSelect.addEventListener("change", function () {
  displaySelectedCard(cardSelect.value);
});

fetchPrismCards();
