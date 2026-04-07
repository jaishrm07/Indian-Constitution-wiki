# UN WPP 2024 Population Reference

captured_on: 2026-04-06
source_tier: primary

## Upstream URLs

- downloads page: https://population.un.org/wpp/downloads?folder=Standard%20Projections&group=CSV%20format
- summary pdf: https://population.un.org/wpp/assets/Files/WPP2024_Summary-of-Results.pdf
- indicator notes csv: https://population.un.org/wpp/assets/Excel%20Files/1_Indicator%20(Standard)/CSV_FILES/WPP2024_Demographic_Indicators_notes.csv
- demographic indicators csv.gz: https://population.un.org/wpp/assets/Excel%20Files/1_Indicator%20(Standard)/CSV_FILES/WPP2024_Demographic_Indicators_Medium.csv.gz

## Use in this repo

Used for a comparative population note on China, India, and the United States.

Key fields pulled from the demographic indicators file:

- `TPopulation1July`
- `PopGrowthRate`
- `TFR`
- `MedianAgePop`
- `NatChange`
- `NetMigrations`

## Reference convention

- WPP annual population values are mid-year values as of `1 July`.
- For a comparison prepared on 2026-04-06, the nearest common official annual point is `1 July 2026`.
- The 25-year horizon used in the draft note is `1 July 2051`.
