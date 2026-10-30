# Beyond the Road Toll

Who ends up in hospital after Australian road crashes, 2011–2021.

COS30045 Data Visualisation Project, Semester 2 2026, Swinburne University of Technology.

- **Team:** [Team name] (Group [no.])
- **Members:** Michelle Mei Xuan Tan ([Student ID]), [Member 2 name] ([Student ID]), [Member 3 name] ([Student ID])
- **Live site:** [Vercel URL]

## About

An interactive data story, built with D3.js, about people hospitalised after road crashes in Australia. It uses the BITRE Hospitalised Injury data (2011–2021): national, state and territory, and First Nations Peoples workbooks.

Source: Bureau of Infrastructure and Transport Research Economics, Hospitalised Injury,
https://www.bitre.gov.au/publications/ongoing/hospitalised-injury

## Folder structure

| Folder | Contents |
|---|---|
| `index.html` | Main page |
| `css/` | Stylesheets |
| `js/` | D3 chart code (one file per chart) |
| `data/raw/` | Original BITRE workbooks and Data Dictionary (unchanged) |
| `data/processed/` | CSV files exported from KNIME for D3 |
| `knime/` | KNIME workflow (.knwf) |
| `docs/` | Wireframes, storyboard and screenshots |

## Run locally

D3 loads CSV files with `fetch`, so open the site through a local server, not by double-clicking `index.html`:

- VS Code: install the **Live Server** extension, then right-click `index.html` and choose **Open with Live Server**, or
- Terminal: `python -m http.server 8000`, then open http://localhost:8000

## How we work

- Create one branch per task, for example `t18-trend-chart`.
- Open a pull request; the other member reviews it before merging to `main`.
- Vercel redeploys automatically when `main` changes.
- Tasks are tracked on the GitHub Project board (IDs T01–T42).

## Generative AI use

[Each member records their AI use here or in the Design Book appendix.]
