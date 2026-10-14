import { massToMolar, molarToMass, type ConversionUnits } from './convert';
import { MASS_UNITS, MOLAR_UNITS, type MassUnit, type MolarUnit } from './units';
export interface UnderflowState {
    massConcentration: boolean;
    molarConcentration: boolean;
}
export const NO_UNDERFLOW: UnderflowState = Object.freeze({
    massConcentration: false,
    molarConcentration: false,
});
export function detectUnderflow(pair: {
    massValue: number;
    molarValue: number;
    entered: 'mass' | 'molar';
}): UnderflowState {
    const enteredValue = pair.entered === 'mass' ? pair.massValue : pair.molarValue;
    const computedValue = pair.entered === 'mass' ? pair.molarValue : pair.massValue;
    const underflowed = enteredValue !== 0 && computedValue === 0;
    return {
        massConcentration: underflowed && pair.entered === 'molar',
        molarConcentration: underflowed && pair.entered === 'mass',
    };
}
export function anyUnderflow(u: UnderflowState): boolean {
    return u.massConcentration || u.molarConcentration;
}
export function representableMolarUnits(massValue: number, mwValue: number, units: ConversionUnits): MolarUnit[] {
    return MOLAR_UNITS.filter((molar) => {
        const v = massToMolar(massValue, mwValue, { ...units, molar });
        return v !== 0 && Number.isFinite(v);
    });
}
export function representableMassUnits(molarValue: number, mwValue: number, units: ConversionUnits): MassUnit[] {
    return MASS_UNITS.filter((mass) => {
        const v = molarToMass(molarValue, mwValue, { ...units, mass });
        return v !== 0 && Number.isFinite(v);
    });
}
export function representableAlternatives(u: UnderflowState, pair: {
    massValue: number;
    molarValue: number;
}, mwValue: number, units: ConversionUnits): readonly string[] {
    if (u.molarConcentration)
        return representableMolarUnits(pair.massValue, mwValue, units);
    if (u.massConcentration)
        return representableMassUnits(pair.molarValue, mwValue, units);
    return [];
}
