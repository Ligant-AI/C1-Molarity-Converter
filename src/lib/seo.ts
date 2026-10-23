import { escapeHtml as esc } from '@ligant/bench-chrome';
import { APP_VERSION, DEPLOYED_URL, REPO_URL, SITE_URL, TOOL_NAME } from './site';
export interface FaqItem {
    q: string;
    a: string;
}
export const SEO = {
    title: "Ligant · Molarity Converter for Biologics: Mass to Molar",
    ogTitle: "Ligant · Molarity Converter for Biologics",
    h1: "Molarity converter for biologics: mass concentration to molar and back",
    lead: "This tool converts a mass concentration to a molar concentration, or the reverse, for a protein whose molecular weight you supply: for example, 2 mg/mL of a 150 kDa antibody is 13.3 µM. It asks where the molecular weight came from and what it is the mass of, and puts both in the result, so the number can still be checked later. It does not supply, look up or suggest a molecular weight, and it cannot check whether the weight you entered is the right one.",
    description: "Free converter between mass and molar concentration for a protein whose molecular weight you declare, recording the weight's source and what it is the mass of.",
    faqHeading: 'Questions and answers',
    faq: [
        {
            q: "How do I convert mg/mL to molar for an antibody or other protein?",
            a: "Choose the direction first, because it decides which concentration you type and which one is computed: mass → molar if you know the mass concentration, molar → mass if you know the molar concentration. Enter the concentration and choose its unit (mg/mL, µg/mL, ng/mL, g/L or mg/L for mass; M, mM, µM, nM or pM for molar); neither has a default. Enter the molecular weight and choose its unit, g/mol or kDa. Say where the weight came from and what it is the mass of. Both are required, and \"not recorded\" is accepted and appears on the result. Choose the unit to report the result in. The tool divides the mass concentration by the molecular weight, or multiplies the molar concentration by it: for example, 2 mg/mL of a 150 kDa antibody is 13.3 µM. Then read the result with its notes.",
        },
        {
            q: "Which molecular weight do I use, and what is it the mass of?",
            a: "Take it from your certificate of analysis, vendor datasheet, sequence calculation or mass spec result. Do not take it from memory or from a similar construct. The tool has no table of weights and never supplies, looks up or suggests one. Then say what the weight is the mass of: the assembled molecule as it exists in solution; a subunit, such as one chain of a multi-chain construct; or a conjugate, including its label or payload, which you select whenever a label or payload is included in the stated mass. A subunit mass used where the assembled mass was needed is wrong by the ratio of the two: about 2 for a half-antibody or a homodimeric Fc fusion, about 3 for an IgG heavy chain, about 6 for an IgG light chain. If you declare a subunit, the result is never the concentration of the assembled molecule, and it is the subunit's concentration only where your mass concentration counts that subunit alone, or the molecule is made of identical subunits.",
        },
        {
            q: "Can I use the molecular weight calculated from the sequence for a glycosylated antibody?",
            a: "Only if it counts the same thing as your mass concentration. A sequence mass excludes glycosylation and other modifications where present; for an aglycosylated construct it is the actual mass. If the concentration includes the glycans or other modifications (a weighed amount, or a vendor figure for the whole glycoprotein), use a measured mass instead: intact mass spectrometry, or a certificate that states the mass was measured. If the concentration came from A280 with an extinction coefficient calculated from the sequence, it counts the polypeptide only, and the sequence mass is the matching weight. Choosing \"calculated from sequence\" as the source raises a flag (FL-04) that says this.",
        },
        {
            q: "How do I convert the concentration of a conjugated antibody?",
            a: "Declare a conjugate whenever a label or payload is included in the stated mass. The molar concentration then counts conjugate molecules; where each conjugate carries one antibody, that is also the antibody's molar concentration. The dye or payload concentration is not computed: drug-to-antibody ratio and degree of labeling are not applied. Check that your mass concentration is also of the whole conjugate. If it is of the antibody protein, as fluorochrome datasheets usually quote, enter the antibody's own weight and declare it assembled instead. For the mass concentration of the protein alone, multiply the molar concentration by the protein's molecular weight; for the dye or payload, multiply it by the degree of labeling or drug-to-antibody ratio.",
        },
        {
            q: "What do the flags mean, and do they block the result?",
            a: "A flag never blocks the result: it says in words what to check. FL-01 fires when the molecular weight is outside 1 to 1000 kDa (1 to 2000 kDa if declared a conjugate), which is more often a unit slip (g/mol entered as kDa, or the reverse) than a real protein; confirm the unit and the value. FL-02 fires when the mass concentration is above 250 mg/mL; confirm the unit, and check whether the concentration is per volume of solution or per volume of solvent, which the tool cannot tell. FL-03 fires when the molar concentration is below 1 pM; check the units, though for a genuinely dilute standard the flag is expected. Other flags record a sequence-calculated weight (FL-04), an unrecorded source (FL-05), a subunit declaration (FL-06), an unrecorded \"mass of\" (FL-07), a conjugate (FL-08), a declaration carried over a change of direction (FL-09), both concentrations being zero (FL-10) and a value too small to show in the chosen unit (FL-11). No flags raised means the values checked are consistent and within range; it does not mean this molecular weight is the right one for this construct.",
        },
        {
            q: "What can go wrong that the converter cannot detect?",
            a: "It does the arithmetic and records the weight, its source and what it is the mass of, but it cannot check whether the weight you entered is the right one. Specifically, it cannot detect a weight that is correct for a different construct, or was correct for a prior lot or formulation; a subunit mass quoted where the assembled mass was needed, or the reverse; a conjugate mass declared as unconjugated, or the reverse; a unit-magnitude transcription error where the entered weight still falls inside the plausible range (the weight check catches a 1000-fold error only if it lands outside the checked range, 1 to 1000 kDa, or 1 to 2000 kDa if declared a conjugate); any error in the input concentration; or whether a stated concentration is per volume of solution or per volume of solvent. The molar concentration is of molecules, not of binding sites; multiply by the construct's valency for paratope concentration.",
        },
        {
            q: "How many significant figures does the result have?",
            a: "Results are shown to 6 significant figures, rounded half-to-even, once, on display; the unrounded value is in the structured result (JSON). That is not the precision of your result, which is set by your inputs, often 2 or 3 significant figures; round to that when you record it. A value too small to represent in the unit you chose is shown as 0 and flagged (FL-11); report the result in a smaller unit.",
        },
        {
            q: "Is my data uploaded anywhere?",
            a: "No. Calculations run entirely in your browser, and your inputs are never transmitted, stored, or logged. The page sends an email address only if you choose to submit one in the newsletter signup, and its web analytics counts visits and sees how quickly the page loads, with further analytics only if you allow it in the banner; no analytics ever receives anything you type into this tool.",
        },
        {
            q: "Is it free?",
            a: "Yes. It is free to use and open source under the Apache 2.0 licence. Its source code is on GitHub, so you can download it and run it on your own computer.",
        },
    ] as readonly FaqItem[],
    featureList: [
        "Mass concentration to molar concentration, and the reverse, for a molecular weight you declare",
        "Records where the molecular weight came from and what it is the mass of, and prints both with the result",
        "Flags a molecular weight, mass concentration or molar concentration outside the usual range, without blocking the result",
        "Notebook copy and structured result (JSON) carrying the declarations, flags, precision and engine version",
    ] as readonly string[],
} as const;
export function faqPanelHtml(): string {
    const body = SEO.faq.map(({ q, a }) => `<div><h3>${esc(q)}</h3><p>${esc(a)}</p></div>`).join('');
    return `<section class="panel faq-panel" aria-labelledby="faq-heading"><div class="panel-head"><div class="titles"><h2 id="faq-heading">${esc(SEO.faqHeading)}</h2></div></div><div class="panel-body">${body}</div></section>`;
}
export function softwareApplication() {
    return {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: `Ligant · ${TOOL_NAME}`,
        url: DEPLOYED_URL,
        description: SEO.description,
        applicationCategory: 'ScientificApplication',
        operatingSystem: 'Any (runs in a web browser)',
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0' },
        license: `${DEPLOYED_URL}LICENSE`,
        softwareVersion: APP_VERSION.replace(/^v/, ''),
        codeRepository: REPO_URL,
        featureList: [...SEO.featureList],
    };
}
export function faqPage() {
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: SEO.faq.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
    };
}
export function breadcrumbs() {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Ligant Bench Tools', item: `${SITE_URL}/` },
            { '@type': 'ListItem', position: 2, name: TOOL_NAME, item: DEPLOYED_URL },
        ],
    };
}
const block = (o: object) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`;
export function jsonLdHtml(): string {
    return [softwareApplication(), faqPage(), breadcrumbs()].map(block).join('\n    ');
}
