export type RetainableField = 'mw' | 'provenance' | 'massBasis';
export const RETAINABLE_FIELDS: readonly RetainableField[] = ['mw', 'provenance', 'massBasis'];
export interface DeclarationState {
    mw: string;
    provenance: string;
    massBasis: string;
}
export function retainedOnDirectionChange(state: DeclarationState): Set<RetainableField> {
    const retained = new Set<RetainableField>();
    if (state.mw.trim() !== '')
        retained.add('mw');
    if (state.provenance !== '')
        retained.add('provenance');
    if (state.massBasis !== '')
        retained.add('massBasis');
    return retained;
}
export function confirmField(retained: ReadonlySet<RetainableField>, field: RetainableField): Set<RetainableField> {
    const next = new Set(retained);
    next.delete(field);
    return next;
}
export interface RetainedFields {
    mw: boolean;
    provenance: boolean;
    massBasis: boolean;
}
export const NOTHING_RETAINED: RetainedFields = Object.freeze({
    mw: false,
    provenance: false,
    massBasis: false,
});
export function toRetainedFields(retained: ReadonlySet<RetainableField>): RetainedFields {
    return {
        mw: retained.has('mw'),
        provenance: retained.has('provenance'),
        massBasis: retained.has('massBasis'),
    };
}
export function anyRetained(r: RetainedFields): boolean {
    return r.mw || r.provenance || r.massBasis;
}
export function retainedFieldNames(r: RetainedFields): string[] {
    const names: string[] = [];
    if (r.mw)
        names.push('the molecular weight');
    if (r.provenance)
        names.push('its source');
    if (r.massBasis)
        names.push('the mass basis');
    return names;
}
