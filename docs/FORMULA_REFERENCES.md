# Formula references for v1.0.0

This file records external technical references used to cross-check the engineering formulas and narrow helper datasets for the initial v1.0.0 release. The application does not fetch these resources at runtime.

- **Spur gears:** KHK Gears, “Calculation of Gear Dimensions” — standard reference diameter `d = zm`, base diameter, addendum, tooth depth and related geometry.
- **Compression springs:** eFunda compression-spring design equations — spring-rate and round-wire compression-spring relationships.
- **Rolling bearings:** SKF bearing documentation — basic rating life `L10 = (C/P)^p`, with `p = 3` for ball bearings and `p = 10/3` for roller bearings.
- **Pipe pressure loss:** U.S. EPA EPANET 2.2 manual — Darcy–Weisbach pressure loss, laminar `f = 64/Re`, and Swamee–Jain use for fully turbulent flow.
- **Heat conduction:** NASA heat-transfer training material — Fourier conduction `Qdot = k A DeltaT / L`.

The implemented calculators remain simplified engineering checks. Manufacturer data, applicable standards, service conditions, and certified design review take precedence.

## Initial-release helper data

- **ISO 286 H7/g6 helper:** ISO 286-1 / ISO 286-2 limits-and-fits system, cross-checked against published H7/g6 tables. The embedded helper covers nominal sizes 1–500 mm only. H holes use zero lower deviation and IT7 upper tolerance; g6 shafts use the corresponding negative fundamental deviation and IT6 width. The app labels the helper as ISO 286 and assumes the standard 20 °C reference temperature. It is not a complete ISO/JIS fit database and does not select a fit for the user.
  - Cross-check: https://cw-mfg.com/resources/fits-and-tolerances-calculator
  - H7 band cross-check: https://mavlon.co/tools/iso-h7-tolerance-chart
  - ISO 286-2 reference listing: https://standards.iteh.ai/catalog/standards/iso/ea02e880-259a-40c5-9a58-022dc3cb4694/iso-286-2-2010
- **Metric-coarse bolt helper:** M3–M24 nominal diameters and common coarse pitches. When a calculator uses tensile stress area, the helper computes `As = π/4 × (d − 0.9382 p)^2` from nominal diameter `d` and pitch `p`. This is an input convenience and is not a joint-strength or thread-tolerance standard checker.
  - Formula / coarse-pitch cross-check: https://roymech.org/Useful_Tables/Screws/Thread_Calcs.html

