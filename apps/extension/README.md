# ATS Readability — Chrome Extension (Manifest V3)

A lightweight browser extension that extracts job descriptions from LinkedIn, Indeed, Kariyer.net, StepStone and custom career sites in 1-click and transfers them directly to the ATS Readability analyzer.

## Features

- **Supported Job Boards**:
  - LinkedIn (`linkedin.com/jobs/*`)
  - Indeed (`indeed.com`)
  - Kariyer.net (`kariyer.net`)
  - StepStone (`stepstone.de`, `stepstone.com`)
  - Generic company job boards (intelligent semantic fallback)
- **Target ATS Detection**:
  - Automatically identifies whether the company uses Workday, Greenhouse, Lever, Ashby, Taleo, iCIMS, SmartRecruiters, Breezy HR, SAP SuccessFactors, or Recruitee.
- **1-Click Integration**:
  - Opens `https://atsfreeforall.com/en/analyze` (or `http://localhost:3000` for development) with the job vacancy text already prefilled.
- **Clipboard Utility**:
  - Clean vacancy text copy button stripped of website clutter and banners.

## How to Install (Developer Mode)

1. Open Google Chrome and navigate to `chrome://extensions`.
2. Enable **Developer mode** using the toggle switch in the top-right corner.
3. Click the **Load unpacked** button.
4. Select the directory `c:\temp_private\ats\apps\extension`.
5. Pin the **ATS Readability** extension icon to your toolbar.

## Usage

1. Open any job vacancy page on LinkedIn, Indeed, Kariyer.net, or StepStone.
2. Click the ATS Readability extension icon.
3. Review the extracted title, company, word count, and detected ATS vendor.
4. Click **Analyze with my CV** to jump straight into the full ATS match report.
