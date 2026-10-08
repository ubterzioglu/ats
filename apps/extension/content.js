(() => {
  "use strict";

  const ATS_PATTERNS = [
    { pattern: /myworkdayjobs\.com|workday\.com\/.*\/job|workday\b/i, name: "Workday" },
    { pattern: /boards\.greenhouse\.io|job-boards\.greenhouse\.io|greenhouse\.io|\bgreenhouse\b/i, name: "Greenhouse" },
    { pattern: /jobs\.lever\.co|lever\.co|\blever\b/i, name: "Lever" },
    { pattern: /jobs\.ashby\.io|ashbyhq\.com|\bashby\b/i, name: "Ashby" },
    { pattern: /taleo\.net|oracle.*taleo|\btaleo\b/i, name: "Oracle Taleo" },
    { pattern: /icims\.com|\bicims\b/i, name: "iCIMS" },
    { pattern: /smartrecruiters\.com|\bsmartrecruiters\b/i, name: "SmartRecruiters" },
    { pattern: /breezy\.hr|\bbreezy\b/i, name: "Breezy HR" },
    { pattern: /successfactors\.com|sap.*careers|\bsuccessfactors\b/i, name: "SAP SuccessFactors" },
    { pattern: /recruitee\.com|\brecruitee\b/i, name: "Recruitee" }
  ];

  function detectAts(textOrUrl) {
    if (!textOrUrl) return null;
    for (const entry of ATS_PATTERNS) {
      if (entry.pattern.test(textOrUrl)) {
        return entry.name;
      }
    }
    return null;
  }

  function clean(str) {
    if (!str) return "";
    return str
      .replace(/\r\n/g, "\n")
      .replace(/[ \t]+/g, " ")
      .replace(/\n\s*\n\s*\n+/g, "\n\n")
      .trim();
  }

  function first(selectors) {
    for (const sel of selectors) {
      try {
        const el = document.querySelector(sel);
        if (el && el.textContent && el.textContent.trim().length > 0) {
          return clean(el.textContent);
        }
      } catch {
        // Ignore syntax error in unsupported selector
      }
    }
    return "";
  }

  function detectPlatform(url) {
    const lower = url.toLowerCase();
    if (lower.includes("linkedin.com")) return "linkedin";
    if (lower.includes("indeed.com")) return "indeed";
    if (lower.includes("kariyer.net")) return "kariyer";
    if (lower.includes("stepstone.de") || lower.includes("stepstone.com")) return "stepstone";
    return "generic";
  }

  function extractJob() {
    const url = window.location.href;
    const platform = detectPlatform(url);
    let title = "";
    let company = "";
    let text = "";

    if (platform === "linkedin") {
      title = first([
        "h1.job-details-jobs-unified-top-card__job-title",
        ".jobs-unified-top-card__job-title",
        ".top-card-layout__title",
        "h1.topcard__title",
        "h1"
      ]);
      company = first([
        "a.job-details-jobs-unified-top-card__company-name",
        ".jobs-unified-top-card__company-name",
        ".topcard__flavor--black-link",
        ".top-card-layout__first-subline a"
      ]);
      text = first([
        "#job-details",
        ".jobs-description__content",
        ".jobs-box__html-content",
        ".show-more-less-html__markup",
        ".description__text"
      ]);
    } else if (platform === "indeed") {
      title = first([
        "h1[data-testid='jobsearch-JobInfoHeader-title']",
        ".jobsearch-JobInfoHeader-title",
        "h1.jobTitle",
        "h1"
      ]);
      company = first([
        "[data-testid='inlineHeader-companyName']",
        ".jobsearch-CompanyInfoContainer",
        "[data-testid='jobsearch-CompanyInfoContainer']"
      ]);
      text = first([
        "#jobDescriptionText",
        ".jobsearch-JobComponent-description",
        "#jobDescription"
      ]);
    } else if (platform === "kariyer") {
      title = first([
        "h1.job-detail-title",
        ".job-title",
        "h1[data-test='job-title']",
        "h1"
      ]);
      company = first([
        ".company-name",
        "a[data-test='company-title']",
        ".company-title"
      ]);
      text = first([
        "#job-description",
        ".job-detail-content",
        ".job-detail"
      ]);
    } else if (platform === "stepstone") {
      title = first([
        "[data-at='header-job-title']",
        "h1[data-genesis-element='HEADER_TITLE']",
        "h1.listing-title",
        "h1"
      ]);
      company = first([
        "[data-at='header-company-name']",
        "[data-genesis-element='HEADER_COMPANY']",
        ".listing-header-company"
      ]);
      text = first([
        "[data-genesis-element='JOB_DESCRIPTION']",
        ".listing-content",
        "[data-at='job-description']"
      ]);
    } else {
      title = first(["h1", "h2", "header h1"]);
      text = first(["article", "main", "[role='main']", ".job-description", "body"]);
    }

    if (!title && document.title) {
      title = clean(document.title.split(/[-|–]/)[0] || document.title);
    }
    if (!text) {
      text = first(["article", "main", "[role='main']", "body"]);
    }

    const detectedAts = detectAts(url) || detectAts(text);
    const words = text.split(/\s+/).filter(Boolean).length;

    return {
      title: title || "Job Posting",
      company: company || "Company",
      text,
      platform,
      url,
      targetAts: detectedAts,
      wordCount: words
    };
  }

  // Listen for extraction requests from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "extract_job") {
      const data = extractJob();
      sendResponse({ success: true, data });
    }
    return true;
  });
})();
