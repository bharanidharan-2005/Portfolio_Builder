import { useState } from "react";
import { FileText, CheckCircle, AlertCircle } from "lucide-react";

function ResumeReviewDialogContent({ onClose, resumeData, onApply, isLight }) {
  const [draftSections, setDraftSections] = useState(() =>
    (resumeData?.sections || []).map((s, idx) => ({
      ...s,
      _key: `${s.section_type || "sec"}-${idx}`,
      content_data: JSON.parse(JSON.stringify(s.content_data || {})),
    }))
  );
  const [saving, setSaving] = useState(false);

  const updateHeroField = (secIdx, field, val) => {
    setDraftSections((prev) =>
      prev.map((sec, idx) =>
        idx === secIdx
          ? { ...sec, content_data: { ...sec.content_data, [field]: val } }
          : sec
      )
    );
  };

  const toggleIncludeSection = (secIdx) => {
    setDraftSections((prev) =>
      prev.map((sec, idx) =>
        idx === secIdx ? { ...sec, _excluded: !sec._excluded } : sec
      )
    );
  };

  const activeDrafts = draftSections.filter((s) => !s._excluded);

  const handleConfirm = async (mode) => {
    setSaving(true);
    try {
      const cleanSections = activeDrafts.map((item) => {
        const clone = { ...item };
        delete clone._key;
        delete clone._excluded;
        return clone;
      });
      await onApply(mode, cleanSections);
    } finally {
      setSaving(false);
    }
  };

  const heroSecIdx = draftSections.findIndex((s) => s.section_type === "hero");
  const aboutSecIdx = draftSections.findIndex((s) => s.section_type === "about");
  const contactSecIdx = draftSections.findIndex((s) => s.section_type === "contact");
  const skillsSec = draftSections.find((s) => s.section_type === "skills");
  const expSec = draftSections.find((s) => s.section_type === "experience");
  const projSec = draftSections.find((s) => s.section_type === "projects_grid");
  const eduSec = draftSections.find((s) => s.section_type === "education");
  const certSec = draftSections.find((s) => s.section_type === "certifications");
  const achSec = draftSections.find((s) => s.section_type === "achievements");

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div
        className={`w-full max-w-3xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${isLight
          ? "bg-white border-slate-200 text-slate-900"
          : "bg-[#0F131E] border-slate-800 text-slate-100"
          }`}
      >
        <div
          className={`px-6 py-4 border-b flex items-center justify-between gap-3 ${isLight
            ? "border-slate-200 bg-slate-50"
            : "border-slate-800 bg-[#141927]"
            }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">
                Review Extracted Resume Data
              </h2>
              <p className="text-xs text-slate-400">
                Verify, edit, or uncheck sections before saving to your portfolio.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
            {activeDrafts.length} sections selected
          </span>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar space-y-5">
          {draftSections.length === 0 ? (
            <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              No structured sections were returned from this document.
            </div>
          ) : (
            <>
              <div className="p-3.5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>
                  Preview mode active — your portfolio canvas has not been overwritten yet.
                </span>
              </div>

              {(heroSecIdx >= 0 || aboutSecIdx >= 0) && (
                <div
                  className={`p-4 rounded-xl border space-y-3 ${isLight
                    ? "bg-slate-50 border-slate-200"
                    : "bg-slate-900/50 border-slate-800"
                    }`}
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                    Identity & Summary
                  </p>
                  {heroSecIdx >= 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold mb-1">
                          Name / Heading
                        </label>
                        <input
                          type="text"
                          value={draftSections[heroSecIdx].content_data.heading || ""}
                          onChange={(e) =>
                            updateHeroField(heroSecIdx, "heading", e.target.value)
                          }
                          className={`w-full h-9 px-3 rounded-lg border text-xs ${isLight
                            ? "bg-white border-slate-300 text-slate-900"
                            : "bg-[#0B0D14] border-slate-700 text-white"
                            }`}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold mb-1">
                          Headline / Role
                        </label>
                        <input
                          type="text"
                          value={draftSections[heroSecIdx].content_data.subheading || ""}
                          onChange={(e) =>
                            updateHeroField(heroSecIdx, "subheading", e.target.value)
                          }
                          className={`w-full h-9 px-3 rounded-lg border text-xs ${isLight
                            ? "bg-white border-slate-300 text-slate-900"
                            : "bg-[#0B0D14] border-slate-700 text-white"
                            }`}
                        />
                      </div>
                    </div>
                  )}
                  {aboutSecIdx >= 0 && (
                    <div>
                      <label className="block text-[11px] font-semibold mb-1">
                        Professional Summary
                      </label>
                      <textarea
                        rows={3}
                        value={draftSections[aboutSecIdx].content_data.bio || ""}
                        onChange={(e) =>
                          updateHeroField(aboutSecIdx, "bio", e.target.value)
                        }
                        className={`w-full p-2.5 rounded-lg border text-xs leading-relaxed ${isLight
                          ? "bg-white border-slate-300 text-slate-900"
                          : "bg-[#0B0D14] border-slate-700 text-white"
                          }`}
                      />
                    </div>
                  )}
                  {contactSecIdx >= 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold mb-1">
                          Contact Email
                        </label>
                        <input
                          type="email"
                          value={draftSections[contactSecIdx].content_data.email || ""}
                          onChange={(e) =>
                            updateHeroField(contactSecIdx, "email", e.target.value)
                          }
                          className={`w-full h-9 px-3 rounded-lg border text-xs ${
                            isLight
                              ? "bg-white border-slate-300 text-slate-900"
                              : "bg-[#0B0D14] border-slate-700 text-white"
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold mb-1">
                          Phone
                        </label>
                        <input
                          type="text"
                          value={draftSections[contactSecIdx].content_data.phone || ""}
                          onChange={(e) =>
                            updateHeroField(contactSecIdx, "phone", e.target.value)
                          }
                          className={`w-full h-9 px-3 rounded-lg border text-xs ${
                            isLight
                              ? "bg-white border-slate-300 text-slate-900"
                              : "bg-[#0B0D14] border-slate-700 text-white"
                          }`}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Extracted Sections
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {draftSections.map((sec, idx) => {
                    const count =
                      sec.content_data?.items?.length ||
                      sec.content_data?.projects?.length ||
                      sec.content_data?.schools?.length ||
                      null;
                    return (
                      <label
                        key={sec._key}
                        className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors ${sec._excluded
                          ? "opacity-50 border-slate-700/40"
                          : isLight
                            ? "bg-white border-indigo-200"
                            : "bg-slate-900/60 border-indigo-500/30"
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={!sec._excluded}
                          onChange={() => toggleIncludeSection(idx)}
                          className="mt-0.5"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold capitalize">
                              {sec.section_type.replace("_", " ")}
                            </span>
                            {count !== null && (
                              <span className="text-[10px] font-mono text-indigo-400">
                                {count} items
                              </span>
                            )}
                          </div>
                          {sec.section_type === "skills" && skillsSec?.content_data?.items && (
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">
                              {skillsSec.content_data.items
                                .slice(0, 5)
                                .map((i) => i.name || i)
                                .join(", ")}
                            </p>
                          )}
                          {sec.section_type === "projects_grid" && projSec?.content_data?.projects && (
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">
                              {projSec.content_data.projects
                                .slice(0, 3)
                                .map((p) => p.title)
                                .join(", ")}
                            </p>
                          )}
                          {sec.section_type === "experience" && expSec?.content_data?.items && (
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">
                              {expSec.content_data.items
                                .slice(0, 2)
                                .map((e) => `${e.title}${e.company ? ` @ ${e.company}` : ""}`)
                                .join(", ")}
                            </p>
                          )}
                          {sec.section_type === "education" && eduSec?.content_data?.schools && (
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">
                              {eduSec.content_data.schools.map((e) => e.institution || e.school || e.degree).join(", ")}
                            </p>
                          )}
                          {sec.section_type === "certifications" && certSec?.content_data?.items && (
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">
                              {certSec.content_data.items.slice(0, 2).map((c) => c.title || c.name).join(", ")}
                            </p>
                          )}
                          {sec.section_type === "achievements" && achSec?.content_data?.items && (
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">
                              {achSec.content_data.items.slice(0, 2).map((a) => a.title || a.name).join(", ")}
                            </p>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        <div
          className={`px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-end gap-2.5 ${isLight
            ? "bg-slate-50 border-slate-200"
            : "bg-[#141927] border-slate-800"
            }`}
        >
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold border cursor-pointer ${isLight
              ? "text-slate-600 border-slate-300 hover:bg-slate-100"
              : "text-slate-300 border-slate-700 hover:bg-slate-800"
              }`}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving || activeDrafts.length === 0}
            onClick={() => handleConfirm("append")}
            className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold border cursor-pointer disabled:opacity-50 ${isLight
              ? "bg-white border-indigo-300 text-indigo-600 hover:bg-indigo-50"
              : "bg-slate-800 border-slate-700 text-indigo-300 hover:bg-slate-700"
              }`}
          >
            {saving ? "Saving..." : "Merge Into Canvas"}
          </button>
          <button
            type="button"
            disabled={saving || activeDrafts.length === 0}
            onClick={() => handleConfirm("replace")}
            className="w-full sm:w-auto px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer disabled:opacity-50"
          >
            {saving ? "Saving..." : "Replace & Save Canvas"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ResumeReviewModal({ isOpen, onClose, resumeData, onApply, isLight }) {
  if (!isOpen || !resumeData) return null;
  const reviewKey = (resumeData.sections || []).map((s) => s.section_type).join("-") || "empty";
  return (
    <ResumeReviewDialogContent
      key={reviewKey}
      onClose={onClose}
      resumeData={resumeData}
      onApply={onApply}
      isLight={isLight}
    />
  );
}
