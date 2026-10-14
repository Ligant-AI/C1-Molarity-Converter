import { MASS_TO_G_PER_L, MOLAR_TO_MOL_PER_L, MW_TO_G_PER_MOL, UNIT_LABEL, type MassUnit, type MolarUnit, type MwUnit, } from './units';
export type Direction = 'mass-to-molar' | 'molar-to-mass';
export const ENGINE_VERSION = '0.5.0';
export interface ConversionUnits {
    mass: MassUnit;
    molar: MolarUnit;
    mw: MwUnit;
}
export function effectiveMw(mwValue: number, units: ConversionUnits): number {
    const gPerMol = mwValue * MW_TO_G_PER_MOL[units.mw];
    return (gPerMol * MOLAR_TO_MOL_PER_L[units.molar]) / MASS_TO_G_PER_L[units.mass];
}
export function massToMolar(massValue: number, mwValue: number, units: ConversionUnits): number {
    return massValue / effectiveMw(mwValue, units);
}
export function molarToMass(molarValue: number, mwValue: number, units: ConversionUnits): number {
    return molarValue * effectiveMw(mwValue, units);
}
export interface ConvertedPair {
    massValue: number;
    molarValue: number;
    entered: 'mass' | 'molar';
}
export function convert(direction: Direction, enteredValue: number, mwValue: number, units: ConversionUnits): ConvertedPair {
    if (direction === 'mass-to-molar') {
        return {
            massValue: enteredValue,
            molarValue: massToMolar(enteredValue, mwValue, units),
            entered: 'mass',
        };
    }
    return {
        massValue: molarToMass(enteredValue, mwValue, units),
        molarValue: enteredValue,
        entered: 'molar',
    };
}
export function relationApplied(direction: Direction): string {
    return direction === 'mass-to-molar'
        ? 'molar concentration = mass concentration ÷ molecular weight'
        : 'mass concentration = molar concentration × molecular weight';
}
export function unitHandling(direction: Direction, units: ConversionUnits): string {
    const mass = UNIT_LABEL[units.mass];
    const molar = UNIT_LABEL[units.molar];
    const mw = UNIT_LABEL[units.mw];
    const entered = direction === 'mass-to-molar' ? mass : molar;
    const reported = direction === 'mass-to-molar' ? molar : mass;
    return `Units: ${entered} entered, ${mw} declared, ${reported} reported; folded into one divisor, applied once.`;
}
export function effectiveMwUnit(units: ConversionUnits): string {
    return `${UNIT_LABEL[units.mass]} per ${UNIT_LABEL[units.molar]}`;
}
