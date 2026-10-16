# Massachusetts Mortgage Calculator page

A buyer payment calculator page for The Mikel DeFrancesco Team (William Raveis Real Estate), built to match the existing
[Massachusetts Home Sale Proceeds Calculator](https://mikeldefrancesco.com/massachusetts-home-sale-proceeds-calculator/).

## What's here

| Path | What it is |
| --- | --- |
| `index.html` | Full standalone preview of the page (header, hero, calculator, content, FAQ, contact, footer). For review only. |
| `wp-plugin/ma-mortgage-calculator/` | WordPress plugin source. |
| `dist/ma-mortgage-calculator.zip` | Ready-to-upload plugin zip. |
| `elementor-page-content.html` | Build sheet with copy buttons for every Elementor widget, SEO fields and schema. |

## Preview locally

```sh
python3 -m http.server 8642
```

Then open http://localhost:8642/ (page preview) and http://localhost:8642/elementor-page-content.html (build sheet).

## Install on WordPress

1. **Plugins → Add New → Upload Plugin**, choose `dist/ma-mortgage-calculator.zip`, then **Activate**.
2. **Settings → Mortgage Calculator**: set the default interest rate, insurance estimate, Schedule a Call link and town tax rates.
3. Create the page (slug `massachusetts-mortgage-calculator`) in Elementor following `elementor-page-content.html`.
4. Place `[ma_mortgage_calculator]` in a Shortcode widget directly under the hero, and `[ma_mortgage_tax_table]` in the tax section.

### Shortcodes

- `[ma_mortgage_calculator]`: the calculator, results, amortization schedule, call buttons and disclaimer.
- `[ma_mortgage_tax_table]`: town tax table. Options: `price="600000"` and `towns="Canton, Quincy, Braintree"`. Clicking a town loads it into the calculator.

## Before launch

- [ ] Verify every town tax rate against the MA DOR tax rate report (most defaults are estimates, marked `0` in settings).
- [ ] Set the default interest rate to the current 30-year average (update monthly).
- [ ] Set the homeowners insurance default.
- [ ] Set the Schedule a Call link to the booking page.
- [ ] Brokerage compliance approves the page name and disclaimers.
- [ ] Give the contact section the CSS ID `contact`.
- [ ] Track call clicks and form submissions as GA4 conversions.
- [ ] Test on mobile, then clear the site cache.

## Calculation notes

- Conventional PMI: estimated by LTV (0.30% to 0.90% per year), only under 20% down.
- FHA: 1.75% upfront MIP financed into the loan, plus annual MIP per the HUD schedule.
- VA: no monthly mortgage insurance; first-use funding fee (2.15% / 1.5% / 1.25%) financed.
- Property tax: price × town rate per $1,000 (assessed value may differ from sale price).
