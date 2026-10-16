# Massachusetts Mortgage Calculator page

A buyer payment calculator page for The Mikel DeFrancesco Team (William Raveis Real Estate), styled to match the
[Massachusetts Home Sale Proceeds Calculator](https://mikeldefrancesco.com/massachusetts-home-sale-proceeds-calculator/).

`index.html` is the complete page, including the calculator. It is a single file with no build step and no dependencies.

## Preview locally

```sh
python3 -m http.server 8642
```

Then open http://localhost:8642/.

## WordPress plugin

`wordpress-plugin/massachusetts-calculator/` is the calculator from `index.html` packaged as a WordPress plugin
("Massachusetts Home Sale Calculator"). It has no build step and needs no Node.js on the server.

- Shortcode: `[massachusetts_calculator]` for the calculator alone (Elementor Shortcode widget or the WordPress Shortcode block)
- Shortcode: `[massachusetts_calculator_page]` for the full page from the brief: hero and H1, calculator, body copy,
  tax table, loan cards, Talk to Mikel band, FAQs and JSON-LD schema (RealEstateAgent, WebApplication, FAQPage).
  The copy is in `templates/page.html` and the schema in `templates/schema.json`. Extra attributes: `proceeds_url`,
  `updated` (yes/no) and `schema` (yes/no). The site's header, footer and contact section stay in Elementor.
- Elementor widget: **Massachusetts Calculator** (General category), with the starting values in the panel
- Optional shortcode attributes: `price`, `down_percent`, `rate`, `term` (30/20/15/10), `loan_type` (conv/fha/va),
  `town`, `insurance`, `hoa`, `phone`, `schedule_url`, `contact_url`, `amortization` (yes/no), `disclaimer` (yes/no)

Build the ZIP with `./build-plugin.sh` (writes `dist/massachusetts-calculator-<version>.zip`). When you change the
plugin, raise both the `Version:` header and `MACALC_VERSION` so browsers fetch the new CSS and JS.

The folder is `massachusetts-calculator`, not `massachusetts-home-sale-calculator`, so installing it never replaces
the site's existing proceeds calculator plugin.

### Tests

With the preview server running, open http://localhost:8642/tests/compare.html. It runs 27 scenarios through
`index.html` and the plugin build and compares every result, help text and amortization row.
`tests/plugin-demo.html?hostile` shows the plugin under aggressive theme styles, and `tests/page-demo.html` renders the
full-page template the way the page shortcode does.

## Before launch

- [ ] Verify every town tax rate against the MA DOR tax rate report (the `TOWNS` list in the script; entries without a final `1` are estimates).
- [ ] Set the default interest rate and insurance in `DEFAULTS` at the top of the script.
- [ ] Point the Schedule a Call buttons at the booking page (they currently jump to `#contact`).
- [ ] Brokerage compliance approves the page name and disclaimers.
- [ ] Connect the contact form, and track calls and form submissions as GA4 conversions.

## Calculation notes

- Conventional PMI: estimated by LTV (0.30% to 0.90% per year), only under 20% down.
- FHA: 1.75% upfront MIP financed into the loan, plus annual MIP per the HUD schedule.
- VA: no monthly mortgage insurance; first-use funding fee (2.15% / 1.5% / 1.25%) financed.
- Property tax: price × town rate per $1,000 (assessed value may differ from sale price).
