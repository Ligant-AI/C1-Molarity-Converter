import { ENGINE_VERSION, convert, effectiveMw, effectiveMwUnit, relationApplied, unitHandling, type ConversionUnits, type Direction, } from './convert';
import { DISPLAY_SIG_FIGS, PRECISION_STATEMENT, formatSigFigs } from './format';
import { CLEAN_PANEL_SCOPE_STATEMENT, MOLECULES_NOT_SITES_STATEMENT, SCOPE_STATEMENT, THRESHOLD_EVALUATION_STATEMENT, raiseFlags, type Flag, } from './flags';
import { checkConcentration, checkMolecularWeight, type Rejection } from './validate';
import { MASS_BASIS_LABEL, MW_PROVENANCE_LABEL, UNIT_LABEL, type MassBasis, type MwProvenance, } from './units';
import { NOTHING_RETAINED, type RetainedFields } from './retention';
import { detectUnderflow, type UnderflowState } from './underflow';
export interface ConversionRequest {
    direction: Direction;
    enteredValue: number;
    mwValue: number;
    provenance: MwProvenance;
    massBasis: MassBasis;
    units: ConversionUnits;
    retained?: RetainedFields;
}
export interface ConversionResult {
    ok: true;
    engineVersion: string;
    direction: Direction;
    massValue: number;
    molarValue: number;
    entered: 'mass' | 'molar';
    displayed: {
        mass: string;
        molar: string;
        sigFigs: number;
    };
    flags: Flag[];
    underflow: UnderflowState;
    units: ConversionUnits;
    declarations: {
        mwValue: number;
        provenance: MwProvenance;
        massBasis: MassBasis;
        retained: RetainedFields;
    };
    relation: string;
    unitHandling: string;
    effectiveMw: number;
    effectiveMwUnit: string;
    assumptions: readonly string[];
    statements: {
        precision: string;
        scope: string;
        moleculesNotSites: string;
        thresholdEvaluation: string;
        cleanPanelScope: string;
    };
}
export interface ConversionRejected {
    ok: false;
    rejections: Rejection[];
}
export type ConversionOutcome = ConversionResult | ConversionRejected;
export function computeConversion(request: ConversionRequest): ConversionOutcome {
    const { direction, enteredValue, mwValue, units } = request;
    const rejections: Rejection[] = [];
    const mwRejection = checkMolecularWeight(mwValue, units.mw);
    if (mwRejection)
        rejections.push(mwRejection);
    const enteredIsMass = direction === 'mass-to-molar';
    const concRejection = checkConcentration(enteredValue, enteredIsMass ? units.mass : units.molar, enteredIsMass ? 'mass concentration' : 'molar concentration');
    if (concRejection)
        rejections.push(concRejection);
    if (rejections.length > 0)
        return { ok: false, rejections };
    const pair = convert(direction, enteredValue, mwValue, units);
    const retained = request.retained ?? NOTHING_RETAINED;
    const underflow = detectUnderflow(pair);
    const flags = raiseFlags({
        mwValue,
        mwUnit: units.mw,
        provenance: request.provenance,
        massBasis: request.massBasis,
        massValue: pair.massValue,
        massUnit: units.mass,
        molarValue: pair.molarValue,
        molarUnit: units.molar,
        retained,
        underflow,
    });
    return {
        ok: true,
        engineVersion: ENGINE_VERSION,
        direction,
        massValue: pair.massValue,
        molarValue: pair.molarValue,
        entered: pair.entered,
        displayed: {
            mass: formatSigFigs(pair.massValue),
            molar: formatSigFigs(pair.molarValue),
            sigFigs: DISPLAY_SIG_FIGS,
        },
        flags,
        underflow,
        units,
        declarations: { mwValue, provenance: request.provenance, massBasis: request.massBasis, retained },
        relation: relationApplied(direction),
        unitHandling: unitHandling(direction, units),
        effectiveMw: effectiveMw(mwValue, units),
        effectiveMwUnit: effectiveMwUnit(units),
        assumptions: assumptionsFor(request),
        statements: {
            precision: PRECISION_STATEMENT,
            scope: SCOPE_STATEMENT,
            moleculesNotSites: MOLECULES_NOT_SITES_STATEMENT,
            thresholdEvaluation: THRESHOLD_EVALUATION_STATEMENT,
            cleanPanelScope: CLEAN_PANEL_SCOPE_STATEMENT,
        },
    };
}
function assumptionsFor(request: ConversionRequest): readonly string[] {
    const { units } = request;
    const retained = request.retained ?? NOTHING_RETAINED;
    const CARRIED = 'retained from the previous conversion direction, not re-confirmed';
    return [
        `Molecular weight taken as ${request.mwValue} ${UNIT_LABEL[units.mw]}, ${retained.mw ? CARRIED : 'as declared'}. The tool does not supply or check molecular weights.`,
        `Source of that weight: ${MW_PROVENANCE_LABEL[request.provenance]}${retained.provenance ? `: ${CARRIED}` : ''}.`,
        `The stated weight is the mass of: ${MASS_BASIS_LABEL[request.massBasis]}${retained.massBasis ? `: ${CARRIED}` : ''}.`,
    ];
}
export function notebookLine(result: ConversionResult): string {
    const { units, declarations, displayed } = result;
    const head = `${displayed.mass} ${UNIT_LABEL[units.mass]} = ${displayed.molar} ${UNIT_LABEL[units.molar]}`;
    const mw = `MW ${declarations.mwValue} ${UNIT_LABEL[units.mw]} (${MW_PROVENANCE_LABEL[declarations.provenance]}; ${MASS_BASIS_LABEL[declarations.massBasis]})`;
    const flags = result.flags.length
        ? ` | flags: ${result.flags.map((f) => f.code).join(', ')}`
        : ' | no flags';
    return `${head} | ${mw}${flags} | ${DISPLAY_SIG_FIGS} s.f. | Molarity Converter engine ${result.engineVersion} | ${SCOPE_STATEMENT}`;
}
