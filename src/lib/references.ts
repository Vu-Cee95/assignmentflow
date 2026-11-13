import type { Reference } from "@/lib/domain/types";

export type Ref = Pick<
  Reference,
  | "authors"
  | "year"
  | "title"
  | "source"
  | "pages"
  | "doi"
  | "kind"
  | "url"
  | "publisher"
  | "city"
  | "edition"
  | "volume"
  | "issue"
  | "date"
  | "reportNumber"
  | "degree"
  | "university"
>;

export const CITATION_STYLES = [
  { id: "apa", label: "APA 7" },
  { id: "mla", label: "MLA 9" },
  { id: "chicago", label: "Chicago" },
  { id: "ama", label: "AMA" },
  { id: "ieee", label: "IEEE" },
  { id: "harvard", label: "Harvard" },
] as const;

export type CitationStyle = (typeof CITATION_STYLES)[number]["id"];

export const CITE_KINDS = [
  "Book",
  "Journal article",
  "Website",
  "Newspaper",
  "Report",
  "Thesis",
  "Conference paper",
] as const;

export type CiteKind = (typeof CITE_KINDS)[number];

export type CiteFieldKey =
  | "url"
  | "volume"
  | "issue"
  | "city"
  | "edition"
  | "date"
  | "reportNumber"
  | "degree"
  | "university"
  | "publisher";

export interface CiteField {
  key: CiteFieldKey;
  label: string;
  placeholder?: string;
  required?: boolean;
}

export interface CiteTypeSpec {
  kind: CiteKind;
  sourceLabel: string;
  sourcePlaceholder?: string;
  usesPages: boolean;
  pagesLabel?: string;
  extra: CiteField[];
}

/** Which extra details are actually needed to build a real citation for each cite type. */
export const CITE_TYPE_SPECS: Record<CiteKind, CiteTypeSpec> = {
  Book: {
    kind: "Book",
    sourceLabel: "Publisher",
    sourcePlaceholder: "e.g. MIT Press",
    usesPages: true,
    pagesLabel: "Page range you used",
    extra: [
      {
        key: "edition",
        label: "Edition (optional)",
        placeholder: "e.g. 2nd",
      },
      {
        key: "city",
        label: "City of publication (optional)",
        placeholder: "e.g. Cambridge, MA",
      },
    ],
  },
  "Journal article": {
    kind: "Journal article",
    sourceLabel: "Journal",
    sourcePlaceholder: "e.g. International Journal of Human-Computer Studies",
    usesPages: true,
    extra: [
      {
        key: "volume",
        label: "Volume",
        required: true,
        placeholder: "e.g. 28",
      },
      {
        key: "issue",
        label: "Issue (optional)",
        placeholder: "e.g. 3",
      },
    ],
  },
  Website: {
    kind: "Website",
    sourceLabel: "Site name",
    sourcePlaceholder: "e.g. Nielsen Norman Group",
    usesPages: false,
    extra: [
      {
        key: "url",
        label: "Website link",
        required: true,
        placeholder: "Paste the URL you used — e.g. https://www.nngroup.com/articles/ten-usability-heuristics/",
      },
      {
        key: "date",
        label: "Accessed date (optional)",
        placeholder: "e.g. 2026, September 14",
      },
    ],
  },
  Newspaper: {
    kind: "Newspaper",
    sourceLabel: "Newspaper",
    sourcePlaceholder: "e.g. Mail & Guardian",
    usesPages: true,
    extra: [
      {
        key: "date",
        label: "Publication date (optional)",
        placeholder: "e.g. 2026, September 10",
      },
      {
        key: "url",
        label: "Article link (optional)",
        placeholder: "Paste the URL if you read it online",
      },
    ],
  },
  Report: {
    kind: "Report",
    sourceLabel: "Institution / organisation",
    sourcePlaceholder: "e.g. World Health Organization",
    usesPages: true,
    extra: [
      {
        key: "reportNumber",
        label: "Report number (optional)",
        placeholder: "e.g. WHO-2026-004",
      },
      {
        key: "url",
        label: "Report link (optional)",
        placeholder: "Paste the URL if you read it online",
      },
    ],
  },
  Thesis: {
    kind: "Thesis",
    sourceLabel: "Repository (optional)",
    sourcePlaceholder: "e.g. UCT scholarly repository",
    usesPages: false,
    extra: [
      {
        key: "degree",
        label: "Degree / type",
        required: true,
        placeholder: "e.g. Master's thesis",
      },
      {
        key: "university",
        label: "University",
        required: true,
        placeholder: "e.g. University of Cape Town",
      },
    ],
  },
  "Conference paper": {
    kind: "Conference paper",
    sourceLabel: "Proceedings / conference",
    sourcePlaceholder: "e.g. Proceedings of the 2024 CHI Conference on Human Factors in Computing Systems",
    usesPages: true,
    extra: [
      {
        key: "publisher",
        label: "Publisher (optional)",
        placeholder: "e.g. ACM",
      },
    ],
  },
};

type KindTest = (r: Ref) => boolean;

const isJournal: KindTest = (r) => /journal/i.test(r.kind ?? "");
const isBook: KindTest = (r) => /^book$/i.test(r.kind ?? "");
const isThesis: KindTest = (r) => /thesis/i.test(r.kind ?? "");
const isReport: KindTest = (r) => /report/i.test(r.kind ?? "");
const isConference: KindTest = (r) => /conference/i.test(r.kind ?? "");
const isNewspaper: KindTest = (r) => /newspaper/i.test(r.kind ?? "");
const isWeb: KindTest = (r) => /website/i.test(r.kind ?? "");
const isOnline: KindTest = (r) => /website|newspaper|report/i.test(r.kind ?? "");

/**
 * Splits an author string such as "Smith, J., Jones, K. and Brown, L."
 * into individual name tokens, stripping any leading/trailing whitespace.
 */
function splitAuthors(authors: string): string[] {
  return authors
    .split(/\s*;\s*|\s+and\s+/i)
    .map((a) => a.replace(/,\s*$/, "").trim())
    .filter(Boolean);
}

/**
 * Builds the author list for a bibliography entry:
 *   1 author  →  "Smith, J."
 *   2 authors →  "Smith, J. and Jones, K."
 *   3+ authors → "Smith, J., Jones, K. and Brown, L."
 */
function bibliographyAuthors(authors: string): string {
  const parts = splitAuthors(authors);
  if (parts.length <= 1) return authors;
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return parts.slice(0, -1).join(", ") + " and " + parts[parts.length - 1];
}

/** "Smith, J." → "J. Smith" — used by AMA and IEEE. */
function initialsFirst(authors: string): string {
  return splitAuthors(authors)
    .map((a) => {
      const [surname, initials] = a.split(",").map((s) => s.trim());
      if (!initials) return surname;
      const initialsOut = initials
        .replace(/\./g, "")
        .split(/\s+/)
        .map((i) => `${i.charAt(0)}.`)
        .join(" ");
      return initialsOut ? `${initialsOut} ${surname}` : surname;
    })
    .join(", ");
}

function inTextAuthors(authors: string): string {
  const parts = splitAuthors(authors);
  if (parts.length <= 1) return authors;
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts[0]} et al.`;
}

/** Quoted (journal/website article) vs plain (book/report) title treatment. */
function isArticle(r: Ref): boolean {
  return /journal|article|website|newspaper|conference/i.test(r.kind ?? "");
}

/* ---- kind-aware detail segments (kept close to the style guides) ---- */

/** " 28(3)" (APA/Harvard/AMA), ", vol. 28, no. 3" (MLA/IEEE/Chicago-style) for journals. */
function volumeIssue(r: Ref, style: CitationStyle): string {
  if (!isJournal(r) || !r.volume) return "";
  const base = r.issue ? `${r.volume}(${r.issue})` : r.volume;
  switch (style) {
    case "mla":
      return `, vol. ${r.volume}${r.issue ? `, no. ${r.issue}` : ""}`;
    case "ieee":
      return `, vol. ${r.volume}${r.issue ? `, no. ${r.issue}` : ""}`;
    case "chicago":
      return r.issue ? ` ${r.volume}, no. ${r.issue}` : ` ${r.volume}`;
    default:
      return ` ${base}`;
  }
}

/** Edition segment: " (2nd ed.)" or (MLA) ", 2nd ed." */
function edition(r: Ref, style: CitationStyle): string {
  if (!r.edition || style === "chicago" || style === "ama" || style === "ieee") return "";
  return style === "mla" ? `, ${r.edition} ed.` : ` (${r.edition} ed.)`;
}

/** "City: Publisher" used by Harvard/Chicago/AMA for books. */
function placePublish(r: Ref, style: CitationStyle): string {
  const pub = isConference(r) ? r.publisher || r.source : r.source;
  if (!pub && !r.city) return "";
  const core = r.city ? `${r.city}: ${pub}` : pub;
  if (style === "ama" && r.city === undefined) return ` ${pub}`;
  return core;
}

/** "[Master's thesis, University of Cape Town]" as required by APA/Harvard/Thesis styles. */
function thesisQualifier(r: Ref): string {
  if (!isThesis(r)) return "";
  const degree = r.degree ?? "Thesis";
  const university = r.university ? `, ${r.university}` : "";
  return ` [${degree}${university}]`;
}

/** "(Report No. WHO-2026-004)" / "Report No. X" per style. */
function reportNumber(r: Ref, style: CitationStyle): string {
  if (!isReport(r) || !r.reportNumber) return "";
  return style === "mla" ? ` Report No. ${r.reportNumber},` : ` (Report No. ${r.reportNumber}).`;
}

/** URL + accessed-date segment for online sources, styled per guide. */
function link(r: Ref, style: CitationStyle): string {
  if (!isOnline(r) || !r.url) return "";
  const url = r.url;
  switch (style) {
    case "harvard":
      return ` Available at: ${url}${r.date ? ` (Accessed: ${r.date})` : ""}`;
    case "chicago":
      return ` ${url}${r.date ? ` (accessed ${r.date})` : ""}`;
    case "mla":
      return `, ${url}`;
    case "ieee":
      return ` [Online]. Available: ${url}`;
    case "ama":
      return ` ${url}`;
    default:
      return ` ${url}`;
  }
}

function doiPart(r: Ref, style: CitationStyle): string {
  if (!r.doi) return "";
  switch (style) {
    case "mla":
      return `, doi:${r.doi}`;
    case "ieee":
      return ` doi: ${r.doi}.`;
    case "ama":
      return ` doi:${r.doi}`;
    default:
      return ` https://doi.org/${r.doi}`;
  }
}

/** Harvard: Smith, J. (2023). Book Title (2nd ed.). City: Publisher, p. 12–18. */
/** Website: Smith, J. (2023). Page Title. Site Name. Available at: URL (Accessed: date). */
export function harvardCitation(r: Ref): string {
  const title = `${r.title}.`;
  const thesis = thesisQualifier(r);
  let source: string;
  if (isBook(r)) {
    source = placePublish(r, "harvard");
  } else if (isJournal(r)) {
    source = `${r.source}${volumeIssue(r, "harvard")}`;
  } else if (isReport(r)) {
    source = `${reportNumber(r, "harvard")} ${r.source}`;
  } else if (isConference(r)) {
    source = `In ${r.source}${r.publisher ? `, ${placePublish(r, "harvard")}` : ""}`;
  } else {
    source = r.source ?? "";
  }
  const pages = r.pages ? `, p. ${r.pages}` : "";
  return `${bibliographyAuthors(r.authors)} (${r.year}). ${title}${thesis} ${source}${pages}${link(r, "harvard")}${doiPart(r, "harvard")}`.replace(/\s{2,}/g, " ").trim();
}

/** APA 7: Nielsen, J. (1995). Title of page. Site Name. URL  */
export function apaCitation(r: Ref): string {
  const title = r.title;
  const titlePart = isArticle(r) ? `${title}.` : `${title}${edition(r, "apa")}.`;
  const thesis = thesisQualifier(r);
  let source: string;
  if (isBook(r)) {
    source = ` ${r.source}`;
  } else if (isJournal(r)) {
    source = ` ${r.source}${volumeIssue(r, "apa")}, ${r.pages ?? ""}`.replace(/,\s*$/, "");
  } else if (isReport(r)) {
    source = ` ${reportNumber(r, "apa")} ${r.source}`;
  } else if (isConference(r)) {
    source = ` In ${r.source}${r.pages ? ` (pp. ${r.pages})` : ""}${r.publisher ? `, ${r.publisher}` : ""}`;
  } else {
    source = ` ${r.source}`;
  }
  const pages = !isJournal(r) && r.pages ? `, ${r.pages}` : "";
  const linkPart = r.doi ? "" : ` ${r.url ?? ""}`;
  return `${bibliographyAuthors(r.authors)} (${r.year}). ${titlePart}${thesis}${source}${pages}${doiPart(r, "apa")}${linkPart}`.replace(/\s{2,}/g, " ").trim();
}

/** MLA 9: Nielsen, J. “10 Usability Heuristics.” Site Name, 1995. URL */
export function mlaCitation(r: Ref): string {
  const title = isArticle(r) ? `\u201C${r.title}.\u201D` : `${r.title}${edition(r, "mla")}.`;
  const thesis = thesisQualifier(r);
  let source: string;
  let pages = "";
  if (isJournal(r)) {
    source = ` ${r.source}${volumeIssue(r, "mla")}`;
    pages = r.pages ? `, pp. ${r.pages}` : "";
  } else if (isReport(r)) {
    source = `${reportNumber(r, "mla")} ${r.source}`;
    pages = r.pages ? `, pp. ${r.pages}` : "";
  } else if (isConference(r)) {
    source = ` ${r.source}${r.publisher ? `, ${r.publisher}` : ""}`;
    pages = r.pages ? `, pp. ${r.pages}` : "";
  } else if (isWeb(r)) {
    source = ` ${r.source}`;
  } else if (isNewspaper(r)) {
    source = ` ${r.source}, ${r.date ?? r.year}`;
  } else {
    source = ` ${r.source}`;
  }
  const yearPart = isNewspaper(r) && r.date ? "" : `, ${r.year}`;
  return `${bibliographyAuthors(r.authors)} ${title}${thesis}${source}${pages}${yearPart}${link(r, "mla")}${doiPart(r, "mla")}.`.replace(/\s{2,}/g, " ").trim();
}

/** Chicago (author-date): Nielsen, J. 1995. “Title.” Site Name. URL (accessed date). */
export function chicagoCitation(r: Ref): string {
  const authorPart = `${bibliographyAuthors(r.authors)} ${r.year}.`;
  const title = isArticle(r) ? `\u201C${r.title}.\u201D` : `${r.title}.`;
  const thesis = thesisQualifier(r);
  let source: string;
  let pages = "";
  if (isBook(r)) {
    source = placePublish(r, "chicago");
  } else if (isJournal(r)) {
    source = ` ${r.source}${volumeIssue(r, "chicago")}`;
    pages = r.pages ? `: ${r.pages}` : "";
  } else if (isConference(r)) {
    source = ` In ${r.source}${r.publisher ? ` (${placePublish(r, "chicago")})` : ""}`;
    pages = r.pages ? `, ${r.pages}` : "";
  } else {
    source = ` ${r.source}`;
  }
  const linkPart = link(r, "chicago");
  return `${authorPart} ${title}${thesis}${source}${pages}${linkPart}${doiPart(r, "chicago")}.`.replace(/\s{2,}/g, " ").trim();
}

/** AMA (numbered): 1. J. Nielsen. Title. Source. 1995;28(3):12–18. */
export function amaCitation(r: Ref): string {
  const authors = initialsFirst(r.authors);
  const title = isArticle(r) ? `\u201C${r.title}.\u201D` : `${r.title}.`;
  let source = "";
  if (isJournal(r)) {
    source = ` ${r.source}. ${r.year}${volumeIssue(r, "ama").trim()}`;
  } else if (isBook(r)) {
    source = ` ${placePublish(r, "ama")}. ${r.year}`;
  } else {
    source = ` ${r.source}. ${r.year}`;
  }
  const pages = r.pages ? `:${r.pages.replace(/-/g, "\u2013")}` : "";
  return `1. ${authors}. ${title}${source}${pages}${link(r, "ama")}${doiPart(r, "ama")}.`.replace(/\s{2,}/g, " ").trim();
}

/** IEEE: [1] J. Nielsen, "Title," Journal, vol. 28, no. 3, pp. 12–18, 1995. */
export function ieeeCitation(r: Ref): string {
  const authors = initialsFirst(r.authors);
  const title = `${r.title},`;
  let source = "";
  if (isJournal(r)) {
    source = ` ${r.source}${volumeIssue(r, "ieee")}, pp. ${r.pages}`;
  } else if (isBook(r)) {
    source = ` ${r.source}`;
  } else {
    source = ` ${r.source}`;
  }
  const pages = !isJournal(r) && r.pages ? `, pp. ${r.pages}` : "";
  const linkPart = link(r, "ieee");
  return `[1] ${authors}, \u201C${title}\u201D${source}${pages}, ${r.year}${linkPart}${doiPart(r, "ieee")}`.replace(/\s{2,}/g, " ").trim();
}

const BIBLIOGRAPHY: Record<CitationStyle, (r: Ref) => string> = {
  apa: apaCitation,
  mla: mlaCitation,
  chicago: chicagoCitation,
  ama: amaCitation,
  ieee: ieeeCitation,
  harvard: harvardCitation,
};

const IN_TEXT: Record<CitationStyle, (r: Ref) => string> = {
  harvard: (r) => `(${inTextAuthors(r.authors)}, ${r.year})`,
  apa: (r) => `(${inTextAuthors(r.authors)}, ${r.year}${r.pages ? `, p. ${r.pages}` : ""})`,
  mla: (r) => `(${inTextAuthors(r.authors)}${r.pages ? ` ${r.pages}` : ""})`,
  chicago: (r) => `(${inTextAuthors(r.authors)} ${r.year}${r.pages ? `, ${r.pages}` : ""})`,
  ama: () => `(1)`,
  ieee: () => `[1]`,
};

export function formatCitation(style: CitationStyle, r: Ref): string {
  return BIBLIOGRAPHY[style]?.(r) ?? harvardCitation(r);
}

export function formatInText(style: CitationStyle, r: Ref): string {
  return IN_TEXT[style]?.(r) ?? inTextCitation(r);
}

/** Harvard in-text citation: (Smith, J., 2023) */
export function inTextCitation(r: Ref): string {
  return `(${inTextAuthors(r.authors)}, ${r.year})`;
}