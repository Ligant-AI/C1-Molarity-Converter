export type MassUnit = 'mg/mL' | 'ug/mL' | 'ng/mL' | 'g/L' | 'mg/L';
export type MolarUnit = 'M' | 'mM' | 'uM' | 'nM' | 'pM';
export type MwUnit = 'g/mol' | 'kDa';
export const MASS_UNITS: readonly MassUnit[] = ['mg/mL', 'ug/mL', 'ng/mL', 'g/L', 'mg/L'];
export const MOLAR_UNITS: readonly MolarUnit[] = ['M', 'mM', 'uM', 'nM', 'pM'];
export const MW_UNITS: readonly MwUnit[] = ['g/mol', 'kDa'];
export const MASS_TO_G_PER_L: Readonly<Record<MassUnit, number>> = {
    'mg/mL': 1,
    'ug/mL': 1e-3,
    'ng/mL': 1e-6,
    'g/L': 1,
    'mg/L': 1e-3,
};
export const MOLAR_TO_MOL_PER_L: Readonly<Record<MolarUnit, number>> = {
    M: 1,
    mM: 1e-3,
    uM: 1e-6,
    nM: 1e-9,
    pM: 1e-12,
};
export const MW_TO_G_PER_MOL: Readonly<Record<MwUnit, number>> = {
    'g/mol': 1,
    kDa: 1000,
};
export const UNIT_LABEL: Readonly<Record<MassUnit | MolarUnit | MwUnit, string>> = {
    'mg/mL': 'mg/mL',
    'ug/mL': 'µg/mL',
    'ng/mL': 'ng/mL',
    'g/L': 'g/L',
    'mg/L': 'mg/L',
    M: 'M',
    mM: 'mM',
    uM: 'µM',
    nM: 'nM',
    pM: 'pM',
    'g/mol': 'g/mol',
    kDa: 'kDa',
};
export type MwProvenance = 'certificate-of-analysis' | 'vendor-datasheet' | 'calculated-from-sequence' | 'mass-spectrometry' | 'not-recorded';
export const MW_PROVENANCE: readonly MwProvenance[] = [
    'certificate-of-analysis',
    'vendor-datasheet',
    'calculated-from-sequence',
    'mass-spectrometry',
    'not-recorded',
];
export const MW_PROVENANCE_LABEL: Readonly<Record<MwProvenance, string>> = {
    'certificate-of-analysis': 'certificate of analysis',
    'vendor-datasheet': 'vendor datasheet',
    'calculated-from-sequence': 'calculated from sequence',
    'mass-spectrometry': 'mass spectrometry',
    'not-recorded': 'not recorded',
};
export type MassBasis = 'assembled' | 'monomer' | 'conjugate' | 'not-recorded';
export const MASS_BASIS: readonly MassBasis[] = ['assembled', 'monomer', 'conjugate', 'not-recorded'];
export const MASS_BASIS_LABEL: Readonly<Record<MassBasis, string>> = {
    assembled: 'the assembled molecule as it exists in solution',
    monomer: 'a subunit of the molecule as it exists in solution, such as one chain of a multi-chain construct',
    conjugate: 'a conjugate, including its label or payload; select this whenever a label or payload is included in the stated mass, whatever the format of the underlying protein',
    'not-recorded': 'not recorded',
};
