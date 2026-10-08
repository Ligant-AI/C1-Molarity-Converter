# Constants register: audit trail

The constants register (`CONSTANTS_REGISTER` in `src/lib/flags.ts`) carries, for each row, only its value, its basis and a short status. The review history, attributions and requirement cross-references that used to sit in each row's status are kept here instead, so they stay in the repository without shipping in the page bundle.

Each entry below is the row's status text as it stood in `src/lib/flags.ts` at v0.1.1, verbatim, keyed by row `id`. Corrections made since are listed after the text they apply to.

## `round-trip-tolerance`

- Label: Round-trip tolerance
- Value: 1 ULP, compared with ≤
- Basis: derived

Status at v0.1.1:

> Derived, and a REQUIREMENT ON HOW THE CONVERSION IS STRUCTURED rather than an observation about it. The bound holds only because the unit factors are folded into a single divisor, so a round trip is two operations and not six, and folding is required for two independent reasons. Rounding: the stepwise path reaches 3.0 ULP and exceeds the bound in 0.54% of cases, against 1.0 ULP and zero exceedances folded. Range: the stepwise intermediate underflows where the folded divisor does not, so 1e-320 mg/mL at 1000 kDa returns 0 stepwise and 1e-320 in µM folded. A tool inheriting this row as an observation would fail the bound and lose range. APPLIES TO RESULTS THE CHOSEN UNITS CAN REPRESENT: once a result underflows, the ULP distance is unbounded and is not a rounding difference. Measured: 500,000 random pairs, MW 10³ to 10⁶ g/mol, 11 decades, both directions; worst observed error exactly 1.0 ULP, zero cases exceeding.

## `mw-lower`

- Label: Lower MW plausibility bound
- Value: 1 kDa
- Basis: inspection

Status at v0.1.1:

> Uncharacterised: open item 2

## `mw-upper`

- Label: Upper MW plausibility bound
- Value: 1000 kDa
- Basis: inspection

Status at v0.1.1:

> Uncharacterised: open item 2. APPLIES WHEN THE MASS BASIS IS NOT A CONJUGATE; a conjugate is measured against its own row below. It misfired on IgM–PE at 1210 kDa until 10 September 2026, because adding the conjugate declaration at v0.4 made masses above this bound ordinary and the bound was not revisited. Resolved by conditioning it on the declaration rather than by raising it, so the coupling is in the code rather than in someone's memory.

## `mw-upper-conjugate`

- Label: Upper MW plausibility bound, conjugate mass basis
- Value: 2000 kDa
- Basis: inspection

Status at v0.1.1:

> Uncharacterised: open item 2. The conditional form and this figure are both NADIRA's; what remains uncharacterised is the number itself. Basis: the largest routine label is not R-phycoerythrin at 240 kDa but the Brilliant Violet polymers. Streptavidin–BV421 averages 340 kDa against 52 kDa for streptavidin alone, so the polymer contributes about 290 kDa, and IgM with BV421 reaches roughly 1260 kDa. 2000 kDa clears that with room for about three labels, while a 1000-fold unit error on any plausible weight lands two orders above, so detection is preserved in both directions. NOT CHECKED: BUV polymers, and heavily labelled conjugates. That residual is stated because the mechanism which produced the original defect was assuming the top end, and the next person should read what was not verified rather than rediscover it the way IgM was rediscovered.

## `mass-upper`

- Label: Upper mass concentration bound
- Value: 250 mg/mL
- Basis: inspection

Status at v0.1.1:

> Uncharacterised: open item 3. Round 7: near this figure the solute's own volume is no longer negligible, so a concentration per volume of solution and one per volume of solvent start to diverge; C1-FL-02 names the ambiguity where it fires.

## `molar-lower`

- Label: Lower molar concentration bound
- Value: 1 pM
- Basis: inspection

Status at v0.1.1:

> Uncharacterised: open item 3

## `viewport-supported`

- Label: Viewport at which C1-NF-03 is met
- Value: 879px of viewport height for a clean result; NOT MET for a flagged result at any viewport measured
- Basis: inspection

Status at v0.1.1:

> ACCEPTED DEVIATION, declared rather than met. C1-NF-03 and acceptance 20 require the inputs and the result to fit one screen without scrolling. Measured 11 September 2026 at 1440 wide: a clean result reaches 868px and fits only from about 879px of viewport, which is a 14-inch class display; the worst case, five flags, reaches 1012px and fits nowhere measured. On a 1440x900 laptop (797px of viewport) a CLEAN result loses the foot of the input column, and a FLAGGED result loses the scope statement, the copy buttons and the tail of the flag list, so the user sees the number without the warnings attached to it. That inverts the guarantee the tool is built around and it is the reason this row exists rather than staying an unwritten shortfall. The supported viewport is undecided, open item 15, and the layout is deliberately not compacted in the meantime.

## `representability`

- Label: Representable range of a computed quantity
- Value: 4.94e-324 in the reported unit (the smallest positive double)
- Basis: derived

Status at v0.1.1:

> Derived from IEEE 754 double precision, not chosen. A computed quantity below this is reported as 0 and marked `underflowed` in the structured object; a bare 0 there is not a rounded value but a different number. It is the CHOICE OF UNIT that decides representability rather than the value alone: 1e-320 mg/mL at 1000 kDa underflows reported in M and is exact reported in pM. Listed under C1-CN-01 because it is a threshold at which the output changes, even though it is not a §8 flag condition. How an underflowed result is PRESENTED is open item 16 and is not settled by this row.

Correction (v0.1.2): "is exact reported in pM" is wrong. 1e-320 mg/mL at 1000 kDa is about 1e-314 pM, which is a subnormal double and has lost precision; the reference set (C1-FX-14) records it as 9.99988867e-315. The value is representable in pM, not exact. The entered 1e-320 is itself subnormal and displays as 9.99989e-321.

## `displayed-precision`

- Label: Displayed precision
- Value: 6 significant figures
- Basis: inspection

Status at v0.1.1:

> Proposed: open item 7 remains OPEN. Measured as evaluable at build with seven orders of headroom before C1-IV-03 fails (docs/open-item-07-displayed-precision.md). The measurement is with the developer; the decision is NADIRA's and has not been made.

## `reimplementation-tolerance`

- Label: Independent reimplementation agreement
- Value: ≤ 1 ULP, compared with ≤
- Basis: derived

Status at v0.1.1:

> Requirement, not an observation. Bit-identical is what was measured, but making it the requirement would generalise one measured pair into a claim about all future reimplementations: a language with wider intermediates or FMA contraction can differ in the last bit on the same two operations, and bit-identical would then fail on correct code. APPLIES TO RESULTS THE CHOSEN UNITS CAN REPRESENT, on the same terms as the round-trip row: an implementation with a wider exponent range returns a small positive number where this returns zero, and that disagreement is unbounded in ULP terms rather than being a rounding difference. C1-FX-03b and C1-FX-14 put both regimes in the reference set, so the qualifier is exercised rather than asserted. Observed: 0 ULP over the comparison set, so any drift from exact agreement is visible rather than absorbed. Consequence, stated rather than left implicit: a defect uniformly smaller than 1 ULP is invisible to acceptance tests 3 and 5 alike.

## `rounding-mode`

- Label: Rounding mode at displayed precision
- Value: half-to-even
- Basis: derived

Status at v0.1.1:

> IEEE 754 default, and the default in Python, R and Julia, so an independent reimplementation agrees without being told. Unbiased under repeated rounding, where half-up drifts upward. Not a threshold, but behaviour-determining: 1 g/L at 51.2 kDa is exactly 19.53125 µM and its displayed value is decided by this row alone.
