import { UNIT_LABEL, type MassUnit, type MolarUnit, type MwUnit } from './units';
export type RejectionCode = 'C1-HI-01' | 'C1-HI-02' | 'C1-AD-01' | 'C1-AD-02';
export interface Rejection {
    code: RejectionCode;
    message: string;
}
export function checkMolecularWeight(value: number, unit: MwUnit): Rejection | null {
    if (!Number.isFinite(value)) {
        return {
            code: 'C1-AD-01',
            message: `The molecular weight is not a number. Enter the value on its own and choose the unit beside it: a weight typed as "150 kDa", or with a comma for a decimal point, cannot be read as a quantity.`,
        };
    }
    if (value <= 0) {
        return {
            code: 'C1-HI-01',
            message: `The molecular weight is ${value} ${UNIT_LABEL[unit]}. Mass per mole cannot be zero or negative, so this cannot be a molecular weight.`,
        };
    }
    return null;
}
export function checkConcentration(value: number, unit: MassUnit | MolarUnit, quantity: 'mass concentration' | 'molar concentration'): Rejection | null {
    if (!Number.isFinite(value)) {
        return {
            code: 'C1-AD-02',
            message: `The ${quantity} is not a number. Enter the value on its own and choose the unit beside it: a value typed with a comma for a decimal point, or with its unit in the same field, cannot be read as a quantity.`,
        };
    }
    if (value < 0) {
        return {
            code: 'C1-HI-02',
            message: `The ${quantity} is ${value} ${UNIT_LABEL[unit]}. A concentration cannot be negative: it is an amount of substance in a volume.`,
        };
    }
    return null;
}
