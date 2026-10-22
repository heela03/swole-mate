import { groupGrocery, type GroceryItem } from "@/lib/meal";

export async function downloadGroceryPdf(items: GroceryItem[], scope: string, meals: string[]) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF();
  let y = 22;
  const line = (text: string, size = 11) => {
    doc.setFontSize(size);
    const wrapped = doc.splitTextToSize(text, 174) as string[];
    for (const part of wrapped) {
      if (y > 274) { doc.addPage(); y = 22; }
      doc.text(part, 18, y);
      y += size * 0.5 + 3;
    }
  };
  doc.setFont("helvetica", "bold");
  line("Swole Mate", 24);
  doc.setFont("helvetica", "normal");
  line("Big on protein. Bigger on flavour.", 12);
  line("Here's your grocery list!", 13);
  line(`Grocery list - ${scope}`, 14);
  line("Only items marked as needed are included.", 10);
  y += 4;
  for (const meal of meals) line(meal, 10);
  y += 5;
  for (const group of groupGrocery(items)) {
    if (y > 252) { doc.addPage(); y = 22; }
    doc.setFont("helvetica", "bold");
    line(group.label, 14);
    doc.setFont("helvetica", "normal");
    for (const item of group.items) line(`[ ] ${item.name} - ${item.count ? `${item.count} pc, ` : ""}${item.grams} g`);
    y += 4;
  }
  doc.setFont("helvetica", "italic");
  line("Enjoy your meal!", 13);
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page);
    doc.setFontSize(9);
    doc.text(`Swole Mate | ${page} / ${pages}`, 18, 289);
  }
  doc.save("swole-mate-grocery-list.pdf");
}