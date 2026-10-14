import { MASS_TO_G_PER_L, MOLAR_TO_MOL_PER_L, MW_TO_G_PER_MOL } from './units';
import type { MassBasis, MassUnit, MolarUnit, MwProvenance, MwUnit } from './units';
import { anyRetained, retainedFieldNames, type RetainedFields } from './retention';
import { anyUnderflow, representableMassUnits, representableMolarUnits, type UnderflowState } from './underflow';
import { UNIT_LABEL } from './units';
export type FlagCode = 'C1-FL-01' | 'C1-FL-02' | 'C1-FL-03' | 'C1-FL-04' | 'C1-FL-05' | 'C1-FL-06' | 'C1-FL-07' | 'C1-FL-08' | 'C1-FL-09' | 'C1-FL-10' | 'C1-FL-11';
export function flagLabel(code: FlagCode): string {
    return code.replace(/^C1-/, '');
}
export interface Flag {
    code: FlagCode;
    message: string;
    evaluatedOn: 'molecular weight' | 'mass concentration' | 'molar concentration' | 'provenance declaration' | 'mass-basis declaration' | 'retention state';
    kind: 'threshold' | 'declaration' | 'retention';
}
export const THRESHOLD_EVALUATION_STATEMENT = 'Threshold flags are evaluated on the unrounded value, which may differ from the displayed value in its last significant figure. A flagged result and an unflagged one can therefore display identically.';
export const CLEAN_PANEL_SCOPE_STATEMENT = 'No flags raised means the values checked are consistent and within range; it does not mean this molecular weight is the right one for this construct.';
export type ThresholdId = 'mw-lower' | 'mw-upper' | 'mw-upper-conjugate' | 'mass-upper' | 'molar-lower' | 'representability';
export interface Threshold {
    readonly id: string;
    readonly label: string;
    readonly value: string;
    readonly basis: 'derived' | 'inspection';
    readonly boundaryCoverage?: true;
}
export const CONSTANTS_REGISTER: readonly Threshold[] = [
    {
        id: 'round-trip-tolerance',
        label: 'Round-trip tolerance',
        value: '1 ULP, compared with ≤',
        basis: 'derived',
    },
    { boundaryCoverage: true, id: 'mw-lower', label: 'Lower MW plausibility bound', value: '1 kDa', basis: 'inspection', },
    {
        boundaryCoverage: true,
        id: 'mw-upper',
        label: 'Upper MW plausibility bound',
        value: '1000 kDa',
        basis: 'inspection',
    },
    {
        boundaryCoverage: true,
        id: 'mw-upper-conjugate',
        label: 'Upper MW plausibility bound, conjugate mass basis',
        value: '2000 kDa',
        basis: 'inspection',
    },
    {
        boundaryCoverage: true,
        id: 'mass-upper',
        label: 'Upper mass concentration bound',
        value: '250 mg/mL',
        basis: 'inspection',
    },
    { boundaryCoverage: true, id: 'molar-lower', label: 'Lower molar concentration bound', value: '1 pM', basis: 'inspection', },
    {
        id: 'viewport-supported',
        label: 'Viewport at which inputs and result fit one screen',
        value: '879px of viewport height for a clean result; NOT MET for a flagged result at any viewport measured',
        basis: 'inspection',
    },
    {
        boundaryCoverage: true,
        id: 'representability',
        label: 'Representable range of a computed quantity',
        value: '4.94e-324 in the reported unit (the smallest positive double)',
        basis: 'derived',
    },
    {
        id: 'displayed-precision',
        label: 'Displayed precision',
        value: '6 significant figures',
        basis: 'inspection',
    },
    {
        id: 'reimplementation-tolerance',
        label: 'Independent reimplementation agreement',
        value: '≤ 1 ULP, compared with ≤',
        basis: 'derived',
    },
    {
        id: 'rounding-mode',
        label: 'Rounding mode at displayed precision',
        value: 'half-to-even',
        basis: 'derived',
    },
] as const;
export const BOUNDARY_THRESHOLDS: readonly ThresholdId[] = CONSTANTS_REGISTER.filter((t) => t.boundaryCoverage).map((t) => t.id as ThresholdId);
export const MW_LOWER_G_PER_MOL = 1000;
export const MW_UPPER_G_PER_MOL = 1000000;
export const MW_UPPER_CONJUGATE_G_PER_MOL = 2000000;
export const MASS_UPPER_G_PER_L = 250;
export const MOLAR_LOWER_MOL_PER_L = 1e-12;
export interface FlagInput {
    mwValue: number;
    mwUnit: MwUnit;
    provenance: MwProvenance;
    massBasis: MassBasis;
    massValue: number;
    massUnit: MassUnit;
    molarValue: number;
    molarUnit: MolarUnit;
    retained: RetainedFields;
    underflow: UnderflowState;
}
export function raiseFlags(input: FlagInput): Flag[] {
    const flags: Flag[] = [];
    const mwGPerMol = input.mwValue * MW_TO_G_PER_MOL[input.mwUnit];
    const massGPerL = input.massValue * MASS_TO_G_PER_L[input.massUnit];
    const molarMolPerL = input.molarValue * MOLAR_TO_MOL_PER_L[input.molarUnit];
    const isConjugate = input.massBasis === 'conjugate';
    const mwUpper = isConjugate ? MW_UPPER_CONJUGATE_G_PER_MOL : MW_UPPER_G_PER_MOL;
    if (mwGPerMol < MW_LOWER_G_PER_MOL || mwGPerMol > mwUpper) {
        flags.push({
            code: 'C1-FL-01',
            kind: 'threshold',
            evaluatedOn: 'molecular weight',
            message: isConjugate
                ? 'Outside the usual range for a conjugate, even allowing for the label or payload; confirm the units and the value.'
                : 'Outside the usual range for a biologic; confirm the units and the value. If the stated weight includes a label or payload, declare it as a conjugate.',
        });
    }
    if (massGPerL > MASS_UPPER_G_PER_L) {
        flags.push({
            code: 'C1-FL-02',
            kind: 'threshold',
            evaluatedOn: 'mass concentration',
            message: 'Above the range of typical high-concentration biologic formulations; confirm the units. At this concentration the protein\'s own volume is no longer negligible: with a partial specific volume near 0.73 mL/g, 250 mg dissolved in 1 mL of buffer makes about 1.18 mL of solution, about 211 mg/mL rather than 250. The tool cannot tell whether the stated concentration is per volume of solution or per volume of solvent.',
        });
    }
    const isEmpty = input.massValue === 0 && input.molarValue === 0;
    if (isEmpty) {
        flags.push({
            code: 'C1-FL-10',
            kind: 'threshold',
            evaluatedOn: 'molar concentration',
            message: 'The concentration is zero: no solute is present. This is not an implausibly low concentration, and the conversion is exact.',
        });
    }
    if (!isEmpty && molarMolPerL < MOLAR_LOWER_MOL_PER_L) {
        flags.push({
            code: 'C1-FL-03',
            kind: 'threshold',
            evaluatedOn: 'molar concentration',
            message: 'Below the range typical of biologic working solutions.',
        });
    }
    if (input.provenance === 'calculated-from-sequence') {
        flags.push({
            code: 'C1-FL-04',
            kind: 'declaration',
            evaluatedOn: 'provenance declaration',
            message: 'Sequence-derived mass excludes glycosylation and other post-translational modification where these are present; for an aglycosylated construct the sequence mass is the actual mass.',
        });
    }
    if (input.provenance === 'not-recorded') {
        flags.push({
            code: 'C1-FL-05',
            kind: 'declaration',
            evaluatedOn: 'provenance declaration',
            message: 'Molecular weight provenance not recorded; the result cannot be traced to a source and should not be carried into a method record without one.',
        });
    }
    if (input.massBasis === 'monomer') {
        flags.push({
            code: 'C1-FL-06',
            kind: 'declaration',
            evaluatedOn: 'mass-basis declaration',
            message: 'Molar concentration computed is of the subunit, not of the assembled molecule.',
        });
    }
    if (input.massBasis === 'not-recorded') {
        flags.push({
            code: 'C1-FL-07',
            kind: 'declaration',
            evaluatedOn: 'mass-basis declaration',
            message: 'Mass basis not recorded; whether this concentration refers to the assembled molecule, a subunit, or a conjugate cannot be determined from the record.',
        });
    }
    if (input.massBasis === 'conjugate') {
        flags.push({
            code: 'C1-FL-08',
            kind: 'declaration',
            evaluatedOn: 'mass-basis declaration',
            message: 'Molecular weight includes label or payload; the molar concentration computed counts conjugate molecules, which equals that of the antibody only where each conjugate carries one antibody. The tool does not apply drug-to-antibody ratio or degree of labelling.',
        });
    }
    if (anyRetained(input.retained)) {
        const names = retainedFieldNames(input.retained);
        const list = names.length === 1
            ? names[0]
            : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
        const verb = names.length === 1 ? 'was' : 'were';
        flags.push({
            code: 'C1-FL-09',
            kind: 'retention',
            evaluatedOn: 'retention state',
            message: `${capitalise(list)} ${verb} retained from the previous conversion direction and ${verb} not re-confirmed. The result is computed from carried values; confirm them before recording it.`,
        });
    }
    if (anyUnderflow(input.underflow)) {
        const units = { mass: input.massUnit, molar: input.molarUnit, mw: input.mwUnit };
        const which = input.underflow.molarConcentration ? 'molar' : 'mass';
        const alternatives: readonly string[] = input.underflow.molarConcentration
            ? representableMolarUnits(input.massValue, input.mwValue, units)
            : representableMassUnits(input.molarValue, input.mwValue, units);
        const best = alternatives[alternatives.length - 1];
        const remedy = best
            ? `Reported in ${UNIT_LABEL[best as keyof typeof UNIT_LABEL] ?? best} the value is representable.`
            : 'No available unit can represent it.';
        flags.push({
            code: 'C1-FL-11',
            kind: 'threshold',
            evaluatedOn: which === 'molar' ? 'molar concentration' : 'mass concentration',
            message: `The ${which} concentration is too small to represent in ${UNIT_LABEL[(which === 'molar' ? input.molarUnit : input.massUnit) as keyof typeof UNIT_LABEL]} and is reported as zero. It is not zero. ${remedy}`,
        });
    }
    return flags;
}
function capitalise(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
}
export const UNDETECTABLE_FAILURES: readonly string[] = [
    'A molecular weight that is correct for a different construct.',
    'A molecular weight that was correct for a prior lot or formulation.',
    'A subunit mass quoted where the assembled mass was needed, or the reverse; the tool requires the declaration but cannot verify it.',
    'A unit-magnitude transcription error where the entered weight still falls inside the plausible range. The molecular weight check (FL-01) catches a 1000× error that lands outside 1–1000 kDa; it cannot catch one that lands inside, and it cannot distinguish a genuinely unusual protein from a typo.',
    'Any error in the input concentration itself.',
    'That a result shown as 0.00000 is a real concentration too small to represent in the unit you chose, rather than an empty solution. The tool DOES detect this and records it, so what it cannot do is show you the value: the two cases are indistinguishable on screen by eye. Reporting the result in a smaller unit is usually enough. 1e-320 mg/mL of a 1000 kDa protein is zero in M and representable in pM.',
    'A conjugate mass declared as unconjugated, or the reverse; the tool requires the declaration but cannot verify it, as above.',
    'Whether a stated concentration is per volume of solution or per volume of solvent. The tool\'s arithmetic never uses solute volume, so the two are indistinguishable to it, but they are not the same number: near 250 mg/mL, a partial specific volume around 0.73 mL/g means the solute occupies roughly 18% of the volume, and flag FL-02 names this where it fires.',
] as const;
export const SCOPE_STATEMENT = 'Research use only. Not qualified for GxP decision-making.';
export const MOLECULES_NOT_SITES_STATEMENT = 'The molar concentration is of molecules, not of binding sites; multiply by the construct\'s valency for paratope concentration.';
