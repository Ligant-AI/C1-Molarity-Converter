export const TOOLTIPS = {
    direction: [
        'Pick the direction before you enter anything. Mass to molar takes mg/mL, µg/mL and similar and returns M, mM, µM, nM or pM. Molar to mass does the reverse. The same molecular weight is required either way.',
    ],
    concentration: [
        'The concentration you are starting from. Enter the number on its own and choose the unit beside it. A value typed with its unit in the same field, or with a comma for a decimal point, cannot be read.',
    ],
    concentrationUnit: [
        'Choose it deliberately. There is no default, because a pre-filled unit is a decision the tool would be making for you, and mistaking µg/mL for mg/mL is a thousandfold error that lands inside the plausible range and raises nothing.',
    ],
    mw: [
        'The tool never supplies, looks up or suggests this, including for common antibodies. A weight carried across from a different construct is the most common way a conversion goes wrong, and it is invisible in the answer.',
    ],
    mwUnit: [
        'Choose g/mol or kDa explicitly. The tool will not infer it from the size of the number, because a weight that is wrong by a thousandfold can still look reasonable.',
    ],
    provenance: [
        'Where the number came from: a certificate of analysis, a vendor datasheet, calculated from sequence, or mass spectrometry. "Not recorded" is a real answer and appears on the result. A sequence-derived weight excludes glycosylation where it is present.',
    ],
    massBasis: [
        'The same protein has more than one correct molecular weight depending on what is being weighed. A subunit mass quoted where the assembled mass was needed is wrong by the ratio of the two: about 2 for a half-antibody or a homodimeric Fc fusion, about 3 for an IgG heavy chain, about 6 for an IgG light chain. A conjugate mass includes the label, which for a phycoerythrin conjugate is heavier than the antibody.',
        'Pick conjugate whenever a label or payload is in the stated mass, whatever the format underneath.',
    ],
    resultUnit: [
        'Independent of the units you entered. This is the one control with a default, because the unit is printed next to the answer, so a choice you did not intend is visible in the result.',
    ],
} as const satisfies Record<string, readonly string[]>;
export interface Step {
    readonly title: string;
    readonly body: string;
}
export const HOW_TO_USE: readonly Step[] = [
    {
        title: 'Choose the direction.',
        body: 'Mass to molar, or molar to mass. Do this first, because it decides which concentration you type and which one is computed.',
    },
    {
        title: 'Enter your concentration and choose its unit.',
        body: 'The number goes in the box, the unit in the menu beside it. Neither has a default.',
    },
    {
        title: 'Enter the molecular weight and choose its unit.',
        body: 'Take it from your certificate of analysis, vendor datasheet, sequence calculation or mass spec result. Do not take it from memory or from a similar construct: a wrong weight still gives a clean, plausible number, and the tool cannot detect it for you.',
    },
    {
        title: 'Say where the weight came from, and what it is the mass of.',
        body: 'Both are required. If you do not know the source, choose "not recorded" and it will appear on the result rather than being left blank. For what the weight is the mass of, see the worked examples just below this list if you are unsure.',
    },
    {
        title: 'Read the result with its notes.',
        body: 'The number comes with the relation applied, every input echoed back, and any flags raised. A flag never blocks the result: it says in words what to check. Copy it for your notebook, or copy the structured result (JSON) if you want a machine-readable version.',
    },
];
export const WORKED_EXAMPLES_INTRO = 'The third field is the one people hesitate on. These cover the common cases.';
export const WORKED_EXAMPLES: readonly Step[] = [
    {
        title: 'A whole antibody.',
        body: 'You have an unconjugated IgG and your certificate says 150 kDa. That is the assembled molecule as it exists in solution. Choose **assembled**.',
    },
    {
        title: 'A single-chain construct.',
        body: 'You have an scFv, a VHH or a nanobody at 15 to 30 kDa. There is no larger assembly it belongs to, so it is already the whole molecule. Choose **assembled**, not subunit.',
    },
    {
        title: 'One chain of something larger.',
        body: 'Your certificate quotes 75 kDa for an IgG, which is a heavy and light chain pair rather than the whole antibody. Choose **subunit**. Using this figure as though it were the assembled mass gives a molar concentration twice that of the whole antibody.',
    },
    {
        title: 'A fluorophore conjugate.',
        body: 'You have an anti-CD19 PE at around 390 kDa. The stated mass includes the phycoerythrin, which is roughly 240 kDa on its own. Choose **conjugate**. The molarity you get counts conjugate molecules, and is right only if your mg/mL is also of the conjugate; datasheets often quote the antibody protein instead.',
    },
    {
        title: 'A conjugated single chain.',
        body: 'A VHH labelled with BV421. It is both a single chain and a conjugate. Choose **conjugate**, because that mass is what your number refers to.',
    },
    {
        title: 'You are not sure.',
        body: 'Choose **not recorded**. The result will say so, which is more useful to whoever reads your method later than a confident guess.',
    },
];
export const WHAT_IT_DOES: readonly string[] = [
    'This tool converts a mass concentration to a molar concentration, or the reverse, for a protein whose molecular weight you supply: for example, 2 mg/mL of a 150 kDa antibody is 13.3 µM.',
    'The tool asks where the molecular weight came from and what it is the mass of, and puts both in the result, so the number can still be checked later.',
];
export const HOW_IT_WORKS_INTRO: readonly string[] = [
    'A mass concentration is grams of protein per litre. Dividing by the molecular weight (grams per mole) gives moles per litre, which is the molar concentration. The reverse multiplies by the molecular weight.',
    'The unit factors (for example mg/mL to g/L, or kDa to g/mol) are combined into a single divisor that is applied once, so a conversion is one division and its reverse is one multiplication by the same number. Nothing is rounded until the result is displayed.',
];
export const HOW_IT_WORKS_FORMULAE: readonly string[] = [
    'molar concentration = mass concentration ÷ molecular weight',
    'mass concentration = molar concentration × molecular weight',
];
export interface ConstantRow {
    readonly name: string;
    readonly value: string;
    readonly why: string;
}
export const CONSTANTS_AND_ASSUMPTIONS: readonly ConstantRow[] = [
    {
        name: 'Unit factors',
        value: '1 mg/mL = 1 g/L; 1 µg/mL = 10⁻³ g/L; 1 ng/mL = 10⁻⁶ g/L; 1 mg/L = 10⁻³ g/L; 1 kDa = 1000 g/mol; mM, µM, nM and pM are 10⁻³, 10⁻⁶, 10⁻⁹ and 10⁻¹² mol/L',
        why: 'Standard SI prefixes. These are the only place a unit relationship is written down.',
    },
    {
        name: 'Molecular weight',
        value: 'The value you enter, exactly as entered',
        why: 'The tool has no table of weights and never supplies, looks up or suggests one. Its source and what it is the mass of are declarations you make.',
    },
    {
        name: 'Molecular weight check',
        value: '1 to 1000 kDa (1 to 2000 kDa if declared a conjugate)',
        why: 'Protein reagents from single-domain antibody fragments (about 13 kDa) to pentameric IgM (about 970 kDa with its J chain) fall inside this range. A weight outside it is more often a unit slip (g/mol entered as kDa, or the reverse) than a real protein, so it raises a flag; a genuine peptide or a very large complex raises it too. The wider upper limit allows for the label or payload in a conjugate.',
    },
    {
        name: 'Mass concentration check',
        value: 'Above 250 mg/mL',
        why: 'Above typical high-concentration antibody formulations, so a value here is more often a unit slip. At such concentrations the protein itself takes up a large share of the volume (about 18 % at 250 mg/mL, for 0.73 mL/g), so whether the figure is per volume of solution or per volume of solvent matters; FL-02 says so.',
    },
    {
        name: 'Molar concentration check',
        value: 'Below 1 pM',
        why: 'Below most working solutions, so a value here is often a unit slip. Some legitimate solutions go lower, such as high-sensitivity immunoassay standards (1 pg/mL of a 17 kDa protein is about 59 fM); for those the flag is expected.',
    },
    {
        name: 'Displayed precision',
        value: '6 significant figures',
        why: 'Enough that display rounding never adds a meaningful error (at most 5 parts in a million) and that the result can be checked against an independent calculation. It is not the precision of your result, which is set by your inputs, often 2 or 3 significant figures; round to that when you record it.',
    },
    {
        name: 'Rounding',
        value: 'Half-to-even, applied once, on display',
        why: 'The IEEE 754 default rule: an exact tie goes to the even digit, so repeated rounding does not drift upward. Spreadsheet ROUND, and the Dilution Planner, Antibody Titration Planner, Master Mix and Reconstitution tools, round ties away from zero, so on an exact tie the last displayed digit can differ by one.',
    },
    {
        name: 'Smallest value it can represent',
        value: '4.94e-324 in the reported unit',
        why: 'The limit of double-precision numbers. Below it a result is reported as 0 and flagged; reporting in a smaller unit usually shows the value.',
    },
];
export const PRECISION_NOTE = 'Results are shown to 6 significant figures, rounded half-to-even, once, on display. The unrounded value is in the structured result (JSON). Converting forward and then back returns the unrounded number you started with to within one unit in the last binary place (a few parts in 10¹⁶), far below the 6 figures displayed.';
export interface FlagRow {
    readonly code: string;
    readonly means: string;
    readonly action: string;
}
export const FLAG_LEGEND: readonly FlagRow[] = [
    { code: 'FL-01', means: 'Molecular weight outside 1 to 1000 kDa (1 to 2000 kDa if declared a conjugate). Outside the usual range.', action: 'Confirm the unit and the value. If the weight includes a label or payload, declare it a conjugate.' },
    { code: 'FL-02', means: 'Mass concentration above 250 mg/mL. Above typical formulations.', action: 'Confirm the unit. Also check whether the concentration is per volume of solution or per volume of solvent, which the tool cannot tell.' },
    { code: 'FL-03', means: 'Molar concentration below 1 pM. Below most working solutions.', action: 'Check the units; for a genuinely dilute standard the flag is expected.' },
    { code: 'FL-04', means: 'Source of the weight is "calculated from sequence". A sequence mass excludes glycosylation and other modifications where present; for an aglycosylated construct it is the actual mass.', action: 'The weight must count the same thing as your mass concentration. If the concentration includes the glycans or other modifications (a weighed amount, or a vendor figure for the whole glycoprotein), use a measured mass instead: intact mass spectrometry, or a certificate that states the mass was measured. If the concentration came from A280 with an extinction coefficient calculated from the sequence, it counts the polypeptide only, and the sequence mass is the matching weight.' },
    { code: 'FL-05', means: 'Source of the weight is "not recorded". The result cannot be traced to a source.', action: 'Find the source before recording the result in a method.' },
    { code: 'FL-06', means: 'The weight is declared a subunit. The molar concentration is not of the assembled molecule. It is of the subunit only where your mass concentration counts that subunit alone, or the molecule is made of identical subunits.', action: 'If you need the concentration of the assembled molecule, enter the assembled mass and declare it assembled.' },
    { code: 'FL-07', means: 'What the weight is the mass of is "not recorded". The record cannot say whether the concentration is of the assembled molecule, a subunit or a conjugate.', action: 'Find out what the weight is the mass of (the assembled molecule, a subunit, or a conjugate including its label or payload) and declare it before recording the result.' },
    { code: 'FL-08', means: 'The weight is declared a conjugate. The molar concentration counts conjugate molecules. Where each conjugate carries one antibody, that is also the antibody\'s molar concentration. The dye or payload concentration is not computed: drug-to-antibody ratio and degree of labelling are not applied.', action: 'Check that your mass concentration is also of the whole conjugate. If it is of the antibody protein, as fluorochrome datasheets usually quote, enter the antibody\'s own weight and declare it assembled instead. For the mass concentration of the protein alone, multiply the molar concentration by the protein\'s molecular weight; for the dye or payload, multiply it by the degree of labelling or drug-to-antibody ratio.' },
    { code: 'FL-09', means: 'A declaration was carried over a change of direction and not re-confirmed. The result uses values you declared in the other direction.', action: 'Confirm the carried values before recording the result.' },
    { code: 'FL-10', means: 'Both concentrations are exactly zero. No solute is present; this is not a very low concentration, and the conversion is exact.', action: 'Check that zero is what you meant to enter.' },
    { code: 'FL-11', means: 'A computed value is too small to represent in the chosen unit. It is shown as 0 but is not zero.', action: 'Report the result in a smaller unit.' },
];
export const FLAG_LEGEND_INTRO = 'Flags never block a result. Each says in words what to check. The code beside a flag is a short label; the table gives every flag and what to do about it. Threshold flags are evaluated on the unrounded value, so a flagged result and an unflagged one can display identically.';
export const WHY_NOT_A_SPREADSHEET_INTRO = 'Converting nM to µg/mL needs a molecular weight, and in practice that weight is guessed, carried over from a different construct, or taken from a sequence when the protein is glycosylated. A subunit mass used where the assembled mass was needed is wrong by the ratio of the two: about 2 for a half-antibody or a homodimeric Fc fusion, about 3 for an IgG heavy chain, about 6 for an IgG light chain. A conjugate mass used for the underlying protein matters in flow cytometry, where R-phycoerythrin is roughly 240 kDa against 150 kDa for the antibody it is attached to. A spreadsheet can give a clean, plausible number in all of these cases. This tool differs in five ways.';
export const WHY_NOT_A_SPREADSHEET: readonly string[] = [
    '**Every assumption is a recorded choice, not a hidden cell.** The weight, where it came from and what it is the mass of are required declarations, and all three appear with the result.',
    '**Units are carried and checked.** Every unit is chosen, never defaulted or guessed from the size of a number, so 125 meant as µg/mL cannot quietly become 125 mg/mL.',
    '**Rounding happens once, on display.** The arithmetic is unrounded and the unit factors are combined into one divisor, so a conversion and its reverse agree to far better than the figures displayed.',
    '**Flags say in words what to check.** An unusual weight, an unrecorded source or a conjugate mass is named on the result rather than left for you to notice.',
    '**The same inputs always give the same output, and the copy-out records all of it.** The notebook line and the structured result carry the declarations, the flags, the precision and the engine version.',
];
export const DOES_NOT_INTRO = 'The tool guarantees the arithmetic, and guarantees that the weight, its source and what it is the mass of are recorded. It cannot check whether the weight you entered is the right one. Specifically, it cannot detect:';
export const DOES_NOT_ALSO: readonly string[] = [
    'It does not supply, look up or suggest a molecular weight, including for common antibodies.',
    'The molar concentration is of molecules, not of binding sites; multiply by the construct\'s valency for paratope concentration.',
];
