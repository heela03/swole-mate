export const FACTS = [
  { category: "Protein", text: "Protein helps your body repair and maintain muscle. Your dinner has a side hustle.", source: "Harvard Nutrition Source", url: "https://nutritionsource.hsph.harvard.edu/what-should-you-eat/protein/" },
  { category: "Fitness", text: "Adults benefit from muscle-strengthening activity at least twice a week. Your sofa is not a spotter.", source: "WHO", url: "https://www.who.int/news-room/fact-sheets/detail/physical-activity" },
  { category: "Cooking", text: "Refrigerate leftovers within two hours. The counter is not a holiday home for your lunch.", source: "USDA", url: "https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/leftovers-and-food-safety" },
  { category: "Protein", text: "Beans, lentils, soy and nuts all contain protein. Muscles do not demand a chicken subscription.", source: "Harvard Nutrition Source", url: "https://nutritionsource.hsph.harvard.edu/what-should-you-eat/protein/" },
  { category: "Fitness", text: "Any amount of physical activity is better than none. A short walk still gets a standing ovation.", source: "WHO", url: "https://www.who.int/news-room/fact-sheets/detail/physical-activity" },
  { category: "Cooking", text: "Most cooked leftovers keep for three to four days in the fridge. Label the date; mystery meals are not a sport.", source: "USDA", url: "https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/leftovers-and-food-safety" },
  { category: "Protein", text: "Your body uses protein to make enzymes and hormones, not just muscle. Tiny ingredient, big job description.", source: "Harvard Nutrition Source", url: "https://nutritionsource.hsph.harvard.edu/what-should-you-eat/protein/" },
  { category: "Fitness", text: "Walking, cycling and dancing all count as physical activity. Yes, your kitchen concert can count too.", source: "WHO", url: "https://www.who.int/news-room/fact-sheets/detail/physical-activity" },
  { category: "Cooking", text: "Shallow containers help hot leftovers cool faster. Your meal prep likes a quick cooldown too.", source: "USDA", url: "https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/leftovers-and-food-safety" },
];

export function nextFactIndex(previous: number, random = Math.random()) {
  const hasPrevious = Number.isInteger(previous) && previous >= 0 && previous < FACTS.length;
  const offset = Math.min(1 - Number.EPSILON, Math.max(0, random));
  const pick = Math.floor(offset * (FACTS.length - (hasPrevious ? 1 : 0)));
  return hasPrevious && pick >= previous ? pick + 1 : pick;
}