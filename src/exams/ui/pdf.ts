// 將多個 794×1123 的 A4 頁面元素截圖後組成一份 PDF 直接下載（與 FIVE 相同做法）
export async function capturePages(pdfDoc: import("jspdf").jsPDF | null, elements: HTMLElement[]): Promise<import("jspdf").jsPDF> {
  const html2canvas = (await import("html2canvas")).default;
  const { jsPDF } = await import("jspdf");
  await document.fonts.ready;
  const pdf = pdfDoc ?? new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pw = pdf.internal.pageSize.getWidth();
  const ph = pdf.internal.pageSize.getHeight();
  // 新建的 jsPDF 自帶一頁空白頁，第一張圖直接放上去
  let first = pdfDoc === null;
  for (const el of elements) {
    const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: "#f2ecdd", logging: false });
    if (!first) pdf.addPage();
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, pw, ph);
    first = false;
  }
  return pdf;
}
