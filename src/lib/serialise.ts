import type { ConversionResult } from './compute';
import { computeConversion } from './compute';
import { ENGINE_VERSION, type Direction } from './convert';
import { DISPLAY_SIG_FIGS, ROUNDING_MODE } from './format';
import type { FlagCode } from './flags';
import { TOOL_ID, TOOL_NAME } from './site';
import type { MassBasis, MassUnit, MolarUnit, MwProvenance, MwUnit } from './units';
import { NOTHING_RETAINED, type RetainedFields } from './retention';
export const SCHEMA_NAME = 'ligant-benchtools-c1-conversion';
export const SCHEMA_VERSION = '1.4.0';
export interface Quantity<U extends string = string> {
    value: number;
    unit: U;
    underflowed: boolean;
}
export interface StructuredFlag {
    code: FlagCode;
    message: string;
    evaluatedOn: string;
    kind: 'threshold' | 'declaration' | 'retention';
}
export interface StructuredResult {
    schema: {
        name: string;
        version: string;
    };
    tool: {
        id: string;
        name: string;
        engineVersion: string;
    };
    direction: Direction;
    entered: 'mass' | 'molar';
    quantities: {
        massConcentration: Quantity<MassUnit>;
        molarConcentration: Quantity<MolarUnit>;
        molecularWeight: Quantity<MwUnit>;
        effectiveDivisor: Quantity<string>;
    };
    declarations: {
        molecularWeightProvenance: MwProvenance;
        massBasis: MassBasis;
        retained: RetainedFields;
    };
    displayed: {
        massConcentration: string;
        molarConcentration: string;
        significantFigures: number;
        roundingMode: typeof ROUNDING_MODE;
    };
    flags: StructuredFlag[];
    derivation: {
        relation: string;
        unitHandling: string;
        assumptions: string[];
    };
    statements: {
        precision: string;
        scope: string;
        moleculesNotSites: string;
        thresholdEvaluation: string;
        cleanPanelScope: string;
    };
}
export function toStructuredResult(result: ConversionResult): StructuredResult {
    return {
        schema: { name: SCHEMA_NAME, version: SCHEMA_VERSION },
        tool: { id: TOOL_ID, name: TOOL_NAME, engineVersion: result.engineVersion },
        direction: result.direction,
        entered: result.entered,
        quantities: {
            massConcentration: {
                value: result.massValue,
                unit: result.units.mass,
                underflowed: result.underflow.massConcentration,
            },
            molarConcentration: {
                value: result.molarValue,
                unit: result.units.molar,
                underflowed: result.underflow.molarConcentration,
            },
            molecularWeight: { value: result.declarations.mwValue, unit: result.units.mw, underflowed: false },
            effectiveDivisor: { value: result.effectiveMw, unit: result.effectiveMwUnit, underflowed: false },
        },
        declarations: {
            molecularWeightProvenance: result.declarations.provenance,
            massBasis: result.declarations.massBasis,
            retained: { ...result.declarations.retained },
        },
        displayed: {
            massConcentration: result.displayed.mass,
            molarConcentration: result.displayed.molar,
            significantFigures: result.displayed.sigFigs,
            roundingMode: ROUNDING_MODE,
        },
        flags: result.flags.map((f) => ({
            code: f.code,
            message: f.message,
            evaluatedOn: f.evaluatedOn,
            kind: f.kind,
        })),
        derivation: {
            relation: result.relation,
            unitHandling: result.unitHandling,
            assumptions: [...result.assumptions],
        },
        statements: { ...result.statements },
    };
}
export function toJson(result: ConversionResult): string {
    return JSON.stringify(toStructuredResult(result), null, 2);
}
export function reproduceFrom(obj: StructuredResult): ConversionResult {
    const q = obj.quantities;
    const enteredValue = obj.direction === 'mass-to-molar' ? q.massConcentration.value : q.molarConcentration.value;
    const outcome = computeConversion({
        direction: obj.direction,
        enteredValue,
        mwValue: q.molecularWeight.value,
        provenance: obj.declarations.molecularWeightProvenance,
        massBasis: obj.declarations.massBasis,
        retained: obj.declarations.retained ?? NOTHING_RETAINED,
        units: {
            mass: q.massConcentration.unit,
            molar: q.molarConcentration.unit,
            mw: q.molecularWeight.unit,
        },
    });
    if (!outcome.ok) {
        throw new Error(`the structured object did not reproduce: ${outcome.rejections.map((r) => r.code).join(', ')}`);
    }
    return outcome;
}
export interface ValidationProblem {
    path: string;
    problem: string;
}
export function validateStructuredResult(obj: unknown): ValidationProblem[] {
    const problems: ValidationProblem[] = [];
    const fail = (path: string, problem: string) => problems.push({ path, problem });
    if (typeof obj !== 'object' || obj === null) {
        return [{ path: '', problem: 'not an object' }];
    }
    const o = obj as Record<string, any>;
    if (o.schema?.name !== SCHEMA_NAME)
        fail('schema.name', `expected ${SCHEMA_NAME}`);
    if (typeof o.schema?.version !== 'string' || !o.schema.version)
        fail('schema.version', 'missing');
    if (typeof o.tool?.engineVersion !== 'string' || !o.tool.engineVersion) {
        fail('tool.engineVersion', 'missing: C1-NF-06 and C1-OUT-01 require it on the output');
    }
    if (o.direction !== 'mass-to-molar' && o.direction !== 'molar-to-mass')
        fail('direction', 'not a direction');
    if (o.entered !== 'mass' && o.entered !== 'molar')
        fail('entered', 'not "mass" or "molar"');
    for (const key of ['massConcentration', 'molarConcentration', 'molecularWeight', 'effectiveDivisor']) {
        const q = o.quantities?.[key];
        const path = `quantities.${key}`;
        if (typeof q !== 'object' || q === null) {
            fail(path, 'missing');
            continue;
        }
        if (typeof q.value !== 'number' || !Number.isFinite(q.value))
            fail(`${path}.value`, 'not a finite number');
        if (typeof q.unit !== 'string' || q.unit === '') {
            fail(`${path}.unit`, 'C1-OUT-03 requires a unit attached to every quantity');
        }
        if (typeof q.underflowed !== 'boolean') {
            fail(`${path}.underflowed`, 'missing: a zero that is not the value must be marked, not merely reported');
        }
    }
    if (typeof o.declarations?.molecularWeightProvenance !== 'string' || !o.declarations.molecularWeightProvenance) {
        fail('declarations.molecularWeightProvenance', 'missing; C1-MW-04 makes it required');
    }
    if (typeof o.declarations?.massBasis !== 'string' || !o.declarations.massBasis) {
        fail('declarations.massBasis', 'missing: C1-MW-07 makes it required');
    }
    for (const key of ['mw', 'provenance', 'massBasis']) {
        if (typeof o.declarations?.retained?.[key] !== 'boolean') {
            fail(`declarations.retained.${key}`, 'missing: C1-ST-03 requires the retention state to be recorded, not implied by absence');
        }
    }
    if (o.displayed?.significantFigures !== DISPLAY_SIG_FIGS)
        fail('displayed.significantFigures', 'not the displayed precision');
    if (o.displayed?.roundingMode !== ROUNDING_MODE)
        fail('displayed.roundingMode', 'not stated');
    for (const key of ['massConcentration', 'molarConcentration']) {
        if (typeof o.displayed?.[key] !== 'string' || !o.displayed[key])
            fail(`displayed.${key}`, 'missing');
    }
    if (!Array.isArray(o.flags)) {
        fail('flags', 'missing: an empty array is the no-flags case and is not the same as absent');
    }
    else {
        o.flags.forEach((f: any, i: number) => {
            if (!/^C1-FL-(0[1-9]|1[01])$/.test(f?.code ?? ''))
                fail(`flags[${i}].code`, 'not a machine-readable reason code');
            if (typeof f?.message !== 'string' || !f.message)
                fail(`flags[${i}].message`, 'missing');
            if (!['threshold', 'declaration', 'retention'].includes(f?.kind))
                fail(`flags[${i}].kind`, 'missing');
        });
    }
    if (typeof o.derivation?.relation !== 'string' || !o.derivation.relation)
        fail('derivation.relation', 'missing: C1-CV-03');
    if (typeof o.derivation?.unitHandling !== 'string' || !o.derivation.unitHandling)
        fail('derivation.unitHandling', 'missing');
    if (!Array.isArray(o.derivation?.assumptions) || o.derivation.assumptions.length === 0) {
        fail('derivation.assumptions', 'missing: C1-OUT-01');
    }
    for (const key of ['precision', 'scope', 'moleculesNotSites', 'thresholdEvaluation', 'cleanPanelScope']) {
        if (typeof o.statements?.[key] !== 'string' || !o.statements[key])
            fail(`statements.${key}`, 'missing');
    }
    return problems;
}
export { ENGINE_VERSION };
