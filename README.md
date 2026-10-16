# Massachusetts Mortgage Calculator page

A buyer payment calculator page for The Mikel DeFrancesco Team (William Raveis Real Estate), styled to match the
[Massachusetts Home Sale Proceeds Calculator](https://mikeldefrancesco.com/massachusetts-home-sale-proceeds-calculator/).

`index.html` is the complete page, including the calculator. It is a single file with no build step and no dependencies.

## Preview locally

```sh
python3 -m http.server 8642
```

Then open http://localhost:8642/.

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
