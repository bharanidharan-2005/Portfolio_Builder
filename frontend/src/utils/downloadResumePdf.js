import React from "react";
import { trackClientActivity } from "./activityTracker";

export async function downloadPortfolioPdf(sections, fileName = "Portfolio_Resume.pdf") {
  const [{ pdf }, { ResumePDF }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("../components/ResumePDF"),
  ]);
  const blob = await pdf(React.createElement(ResumePDF, { sections })).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  trackClientActivity("resume_exported", { format: "pdf" });
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

