const API_URL = "https://fchavonet.github.io/full_stack-db_visual_adventure_cards_api/api/v1/cards.json";

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

    console.log("All cards:", cards);
    console.log("Prism cards:", prismCards);
  } catch (error) {
    console.error("Unable to load cards:", error);
  }
}

fetchPrismCards();
