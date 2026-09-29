/**
 * What this tool supplies to the suite's shared header and footer
 * (@ligant/bench-chrome). Everything else in them is the suite's, written once.
 * The citation is in three pieces, so what is shown and what is copied cannot
 * differ; there is no paper behind this tool, so it is the software alone.
 */
import type { FooterOptions, HeaderOptions } from '@ligant/bench-chrome'
import { STANDFIRST } from './copy'
import { APP_VERSION, CITATION_DOI, DEPLOYED_URL, RELEASE_YEAR, REPO_URL, TOOL_NAME, TOOL_PATH } from './site'

export const HEADER: HeaderOptions = {
  path: TOOL_PATH,
  title: TOOL_NAME,
  description: [...STANDFIRST],
}

export const FOOTER: FooterOptions = {
  repoUrl: REPO_URL,
  citations: [
    {
      lead: `Modi, A.B. (${RELEASE_YEAR}). `,
      title: 'Molarity Converter for Biologics',
      tail:
        ` (${APP_VERSION}) [Computer software]. Ligant AI Incorporated. ` +
        `${DEPLOYED_URL.replace('https://', '')}` +
        (CITATION_DOI ? ` doi:${CITATION_DOI}` : ''),
    },
  ],
  disclaimer: 'Research use only. Not qualified for GxP decision-making.',
}
