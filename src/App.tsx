import { useMemo, useState } from 'react'
import {
  MASS_BASIS,
  MASS_BASIS_LABEL,
  MASS_UNITS,
  MOLAR_UNITS,
  MW_PROVENANCE,
  MW_PROVENANCE_LABEL,
  MW_UNITS,
  UNIT_LABEL,
  type MassBasis,
  type MassUnit,
  type MolarUnit,
  type MwProvenance,
  type MwUnit,
} from './lib/units'
import type { Direction } from './lib/convert'
import { computeConversion, notebookLine } from './lib/compute'
import { toJson } from './lib/serialise'
import { UNDETECTABLE_FAILURES } from './lib/flags'
import {
  CANNOT_DETECT_INTRO,
  HOW_TO_USE,
  STANDFIRST,
  TOOLTIPS,
  WHY_THIS_TOOL_EXISTS,
  WORKED_EXAMPLES,
  WORKED_EXAMPLES_INTRO,
} from './lib/copy'
import { confirmField, retainedOnDirectionChange, toRetainedFields, type RetainableField } from './lib/retention'
import { APP_VERSION, NETWORK_CLAIM_VERIFIED, TOOL_NAME } from './lib/site'
import { LigantMark, SiteFooter, SiteHeader } from './Brand'
import { InfoTip } from './InfoTip'
import { formatSigFigs } from './lib/format'

/** Renders the `**` emphasis used in `lib/copy.ts`. */
function Emphasised({ text }: { text: string }) {
  return <>{text.split('**').map((s, i) => (i % 2 ? <strong key={i}>{s}</strong> : s))}</>
}

/**
 * The whole tool.
 *
 * The suite's layout, shared with the Dilution Planner and Reconstitution:
 * numbered declaration panels on the left and the result on the right, so
 * C1-NF-03's inputs and result sit side by side on one screen. What teaches
 * the tool follows the declarations in the left column: how to use it, worked
 * examples, why it exists, and the §9 list of what it cannot detect
 * (C1-FC-01), which is rendered from `UNDETECTABLE_FAILURES` rather than
 * edited as prose. Each control's explanation is a tooltip, not a hint line,
 * so reading it does not make the panels taller.
 *
 * THE §11 CONSTANTS REGISTER IS NOT ON THE PAGE. Removed by the product
 * owner's ruling of 11 September 2026, as a scope decision. The rows stay in
 * `lib/flags.ts`, which the flag rules read. C1-CN-01 still requires them at
 * the tool's own address and acceptance 17 still tests for them; both are to be
 * amended or struck in the URS rather than satisfied here.
 *
 * C1-ST-02: nothing is persisted. There is no localStorage, no sessionStorage
 * and no URL state, so there is nothing that could survive a reload
 * invisibly. That is the strongest form of the requirement rather than a
 * shortcut past it: the alternative, persisting and marking it, adds a thing
 * to get wrong for a convenience nobody asked for.
 *
 * C1-UN-01 / C1-MW-03: the two INPUT units arrive unselected, on the same terms
 * as the provenance and mass-basis declarations. See `enteredUnit` below.
 */
/**
 * C1-OUT-03, made inspectable without a clipboard.
 *
 * The structured object has been ratified on rendered output alone for three
 * review passes, because clipboard reads are blocked in the reviewer's
 * environment. A record that can only be verified when one particular person is
 * in the loop is not verified; it is vouched for. `?record` renders the same
 * object into the page.
 *
 * READ, NOT PERSISTED, and the distinction matters for C1-ST-02. The parameter
 * toggles a panel and touches no input: nothing is repopulated from the URL, so
 * no value can arrive in a field without the user having typed it. The panel's
 * own presence is the visible evidence of the only state the URL carries.
 *
 * Read once at module scope rather than per render, so it cannot become a
 * reactive input to the computation.
 */
const SHOW_RECORD =
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('record')

export function App() {
  const [direction, setDirection] = useState<Direction>('mass-to-molar')
  const [entered, setEntered] = useState('')

  /**
   * C1-UN-01: the unit of the entered concentration. Unselected until chosen.
   *
   * This field arrived pre-filled with `mg/mL` until v0.1.1, alongside a
   * compelled provenance and a compelled mass basis. The form therefore taught
   * that some fields are the user's and some are the tool's, along a split the
   * user cannot see: and the derivation echoed "150 kDa" identically whether
   * the user chose kDa or never looked at it. The tool compelled a declaration
   * of where the digits came from and then supplied the exponent itself.
   *
   * The failure that permitted: 125 meant as µg/mL, entered under an mg/mL
   * default, is 1000× wrong with BOTH quantities inside every §8 bound, so
   * nothing on screen catches it. A default that is usually right is worse than
   * one that is usually wrong, because it stops being read.
   *
   * It holds a mass unit or a molar unit depending on the direction, which is
   * why it is one piece of state rather than two: it is one field: "the unit
   * of the number you typed", and what it measures changes with the swap.
   */
  const [enteredUnit, setEnteredUnit] = useState<MassUnit | MolarUnit | ''>('')

  /**
   * The RESULT unit keeps its default, deliberately, and this is the one place
   * the two cases are different.
   *
   * A wrong output unit gives a correct quantity displayed in an unexpected
   * unit, with that unit rendered beside the number; visible, and wrong about
   * nothing. A wrong input unit gives a quantity wrong by 1000× with nothing to
   * catch it. Two added selections, not three.
   */
  const [outMassUnit, setOutMassUnit] = useState<MassUnit>('mg/mL')
  const [outMolarUnit, setOutMolarUnit] = useState<MolarUnit>('uM')

  const [mw, setMw] = useState('')
  const [mwUnit, setMwUnit] = useState<MwUnit | ''>('')
  const [provenance, setProvenance] = useState<MwProvenance | ''>('')
  const [massBasis, setMassBasis] = useState<MassBasis | ''>('')
  const [copied, setCopied] = useState<'notebook' | 'json' | null>(null)

  /**
   * The label read "Copied" the instant either button was clicked, whether or
   * not `writeText` had resolved, so a rejected write or a browser with no
   * Clipboard API said the same thing a successful one did. Waiting on the
   * promise is what the record-panel check already assumes when it reads the
   * clipboard back rather than trusting the label; the label itself had
   * nothing behind it. `writeText` returns `undefined`, not a promise, when
   * the API is absent, so that case is handled before `.then` is reached.
   */
  function copyToClipboard(text: string, which: 'notebook' | 'json') {
    const write = navigator.clipboard?.writeText(text)
    if (!write) {
      setCopied(null)
      return
    }
    write.then(
      () => setCopied(which),
      () => setCopied(null),
    )
  }

  /**
   * C1-ST-03. Which declarations were carried across the last direction change
   * and have not been confirmed since.
   *
   * A SET, per field. It was one boolean until v0.1.1, which satisfied the
   * requirement at the moment of the switch and broke one keystroke later:
   * editing the weight cleared the badge from the source and the mass basis,
   * which were still carrying their pre-switch values and were now unmarked.
   * The rules live in `lib/retention.ts` so they can be tested without a DOM.
   */
  const [retained, setRetained] = useState<ReadonlySet<RetainableField>>(new Set())
  const confirm = (field: RetainableField) => setRetained((r) => confirmField(r, field))

  function changeDirection(next: Direction) {
    if (next === direction) return
    setDirection(next)
    // The entered concentration and its unit are cleared rather than retained:
    // the unit changes what it measures across the swap, and a number that
    // silently becomes a molar quantity because the direction moved is the
    // paste defect again. The molecular weight's unit does not change meaning,
    // so it is retained with the weight and badged with it.
    setEntered('')
    setEnteredUnit('')
    setCopied(null)
    setRetained(
      retainedOnDirectionChange({
        // The weight field holds a value if either the number or its unit does.
        mw: mw.trim() || mwUnit,
        provenance,
        massBasis,
      }),
    )
  }

  const units = useMemo(
    () =>
      direction === 'mass-to-molar'
        ? { mass: enteredUnit as MassUnit, molar: outMolarUnit, mw: mwUnit as MwUnit }
        : { mass: outMassUnit, molar: enteredUnit as MolarUnit, mw: mwUnit as MwUnit },
    [direction, enteredUnit, outMassUnit, outMolarUnit, mwUnit],
  )

  const outcome = useMemo(() => {
    // Nothing is computed until every declaration is present. C1-MW-01: no
    // conversion completes without a molecular weight; C1-MW-04/07 make the two
    // declarations required; C1-UN-01/C1-MW-03 make the two input units
    // required on the same terms.
    if (
      entered.trim() === '' ||
      enteredUnit === '' ||
      mw.trim() === '' ||
      mwUnit === '' ||
      provenance === '' ||
      massBasis === ''
    ) {
      return null
    }
    return computeConversion({
      direction,
      enteredValue: Number(entered),
      mwValue: Number(mw),
      provenance,
      massBasis,
      units,
      // C1-ST-03 / C1-FL-09. The badge was the whole of retention until v0.2.0,
      // which left the derivation saying "as declared" of a carried value and
      // the structured object with no trace of it at all.
      retained: toRetainedFields(retained),
    })
  }, [direction, entered, enteredUnit, mw, mwUnit, provenance, massBasis, units, retained])

  const result = outcome && outcome.ok ? outcome : null

  /**
   * What the empty result panel lists, in the order the form asks for it. The
   * same six conditions that gate `outcome` above, so the list cannot name a
   * declaration the computation does not wait for, or omit one it does.
   */
  const missing = [
    entered.trim() === '' && `enter the ${direction === 'mass-to-molar' ? 'mass' : 'molar'} concentration`,
    enteredUnit === '' && 'select the unit of the concentration',
    mw.trim() === '' && 'enter the molecular weight',
    mwUnit === '' && 'select the unit of the molecular weight',
    provenance === '' && 'declare the source of that weight; "not recorded" is an accepted answer',
    massBasis === '' && 'declare what the weight is the mass of; "not recorded" is an accepted answer',
  ].filter((m): m is string => typeof m === 'string')
  const rejections = outcome && !outcome.ok ? outcome.rejections : null
  const enteredIsMass = direction === 'mass-to-molar'

  return (
    <>
      <a className="skip" href="#result">Skip to result</a>
      <div className="wrap">
        <SiteHeader
          tool={TOOL_NAME}
          description={STANDFIRST.map((p) => <p key={p}>{p}</p>)}
        />

        {/*
          The suite's layout: numbered declaration panels on the left, the
          result on the right, and what teaches the tool under the declarations
          in the same column, as in the Dilution Planner and Reconstitution.
          Under 1060px it is one column: declarations, result, then the rest.
        */}
        <main className="converter layout">
          <div className="stack">
            {/* C1-CV-02. Selected before data entry; not a mode. */}
            <section className="panel" aria-labelledby="direction-h">
              <div className="panel-head">
                <div className="titles">
                  <span className="step" aria-hidden="true">1</span>
                  <h2 id="direction-h">Direction</h2>
                </div>
              </div>
              <div className="panel-body">
                <fieldset className="field">
                  <legend>
                    What do you know, and what do you want computed?
                    <InfoTip topic="the conversion direction" paragraphs={TOOLTIPS.direction} />
                  </legend>
                  <div className="radios stacked">
                    <label>
                      <input
                        type="radio"
                        name="direction"
                        checked={direction === 'mass-to-molar'}
                        onChange={() => changeDirection('mass-to-molar')}
                      />
                      <span>
                        <strong>mass → molar</strong>: enter a mass concentration; the molar concentration is computed
                      </span>
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="direction"
                        checked={direction === 'molar-to-mass'}
                        onChange={() => changeDirection('molar-to-mass')}
                      />
                      <span>
                        <strong>molar → mass</strong>: enter a molar concentration; the mass concentration is computed
                      </span>
                    </label>
                  </div>
                </fieldset>

                <div className="field">
                  <div className="label-row">
                    <label htmlFor="outunit">Report the result in</label>
                    <InfoTip topic="the result unit" paragraphs={TOOLTIPS.resultUnit} />
                  </div>
                  {enteredIsMass ? (
                    <select id="outunit" value={outMolarUnit} onChange={(e) => setOutMolarUnit(e.target.value as MolarUnit)}>
                      {MOLAR_UNITS.map((u) => (
                        <option key={u} value={u}>{UNIT_LABEL[u]}</option>
                      ))}
                    </select>
                  ) : (
                    <select id="outunit" value={outMassUnit} onChange={(e) => setOutMassUnit(e.target.value as MassUnit)}>
                      {MASS_UNITS.map((u) => (
                        <option key={u} value={u}>{UNIT_LABEL[u]}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </section>

            {/* C1-UN-01. The unit is chosen, not supplied. */}
            <section className="panel" aria-labelledby="conc-h">
              <div className="panel-head">
                <div className="titles">
                  <span className="step" aria-hidden="true">2</span>
                  <h2 id="conc-h">Concentration</h2>
                </div>
              </div>
              <div className="panel-body">
                <div className="field-row">
                  <div className="field">
                    {/*
                      The tooltip sits beside the label, not inside it: a button
                      inside a <label> is interactive content inside another
                      control's label, and a click on it is not reliably the
                      button's.
                    */}
                    <div className="label-row">
                      <label htmlFor="entered">
                        {enteredIsMass ? 'Mass concentration' : 'Molar concentration'}
                      </label>
                      <InfoTip
                        topic={enteredIsMass ? 'the mass concentration' : 'the molar concentration'}
                        paragraphs={TOOLTIPS.concentration}
                      />
                    </div>
                    <input
                      id="entered"
                      type="text"
                      inputMode="decimal"
                      value={entered}
                      autoComplete="off"
                      className={rejections?.some((r) => r.code === 'C1-HI-02') ? 'bad' : undefined}
                      onChange={(e) => {
                        setEntered(e.target.value)
                        setCopied(null)
                      }}
                    />
                  </div>
                  <div className="field">
                    <div className="label-row">
                      <label htmlFor="enteredunit">Unit</label>
                      <InfoTip
                        topic={enteredIsMass ? 'the mass concentration unit' : 'the molar concentration unit'}
                        paragraphs={TOOLTIPS.concentrationUnit}
                        align="end"
                      />
                    </div>
                    <select
                      id="enteredunit"
                      value={enteredUnit}
                      onChange={(e) => {
                        setEnteredUnit(e.target.value as MassUnit | MolarUnit)
                        setCopied(null)
                      }}
                    >
                      <option value="" disabled>(select a unit)</option>
                      {(enteredIsMass ? MASS_UNITS : MOLAR_UNITS).map((u) => (
                        <option key={u} value={u}>{UNIT_LABEL[u]}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <p className="hint">Required. Neither the value nor its unit is defaulted or suggested.</p>
              </div>
            </section>

            {/* C1-MW-01/02/03. Required, never inferred, unit always explicit. */}
            <section className="panel" aria-labelledby="mw-h">
              <div className="panel-head">
                <div className="titles">
                  <span className="step" aria-hidden="true">3</span>
                  <h2 id="mw-h">Molecular weight</h2>
                </div>
              </div>
              <div className="panel-body">
                <div className="field-row">
                  <div className="field">
                    <div className="label-row">
                      <label htmlFor="mw">
                        Molecular weight
                        {retained.has('mw') && <span className="retained">Retained, not re-confirmed</span>}
                      </label>
                      <InfoTip topic="the molecular weight" paragraphs={TOOLTIPS.mw} />
                    </div>
                    <input
                      id="mw"
                      type="text"
                      inputMode="decimal"
                      value={mw}
                      autoComplete="off"
                      className={rejections?.some((r) => r.code === 'C1-HI-01') ? 'bad' : undefined}
                      onChange={(e) => {
                        setMw(e.target.value)
                        confirm('mw')
                        setCopied(null)
                      }}
                    />
                  </div>
                  <div className="field">
                    <div className="label-row">
                      <label htmlFor="mwunit">Unit</label>
                      <InfoTip topic="the molecular weight unit" paragraphs={TOOLTIPS.mwUnit} align="end" />
                    </div>
                    <select
                      id="mwunit"
                      value={mwUnit}
                      onChange={(e) => {
                        setMwUnit(e.target.value as MwUnit)
                        confirm('mw')
                        setCopied(null)
                      }}
                    >
                      <option value="" disabled>(select a unit)</option>
                      {MW_UNITS.map((u) => (
                        <option key={u} value={u}>{UNIT_LABEL[u]}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* C1-MW-04/05. "Not recorded" is a value, not a blank. */}
                <div className="field">
                  <div className="label-row">
                    <label htmlFor="prov">
                      Source of that weight
                      {retained.has('provenance') && <span className="retained">Retained, not re-confirmed</span>}
                    </label>
                    <InfoTip topic="the source of the weight" paragraphs={TOOLTIPS.provenance} />
                  </div>
                  <select
                    id="prov"
                    value={provenance}
                    onChange={(e) => {
                      setProvenance(e.target.value as MwProvenance)
                      confirm('provenance')
                      setCopied(null)
                    }}
                  >
                    <option value="" disabled>(select a source)</option>
                    {MW_PROVENANCE.map((p) => (
                      <option key={p} value={p}>{MW_PROVENANCE_LABEL[p]}</option>
                    ))}
                  </select>
                </div>

                {/*
                  C1-MW-07/08. Single-select, and radios rather than a dropdown.

                  The options are not strictly exclusive in the abstract, a
                  PE-conjugated scFv is both single-chain and conjugated, and §3.3
                  resolves that by carrying the precedence rule inside the conjugate
                  option's own label. A <select> truncates its options to the width
                  of the control, which hides exactly the clause the rule depends on,
                  and the URS is explicit that without it two people in the same lab
                  answer differently for the same reagent. Radios show every label in
                  full.
                */}
                <fieldset className="field">
                  <legend>
                    The stated weight is the mass of
                    {retained.has('massBasis') && <span className="retained">Retained, not re-confirmed</span>}
                    <InfoTip topic="what the weight is the mass of" paragraphs={TOOLTIPS.massBasis} />
                  </legend>
                  <div className="radios stacked">
                    {MASS_BASIS.map((b) => (
                      <label key={b}>
                        <input
                          type="radio"
                          name="massBasis"
                          value={b}
                          checked={massBasis === b}
                          onChange={() => {
                            setMassBasis(b)
                            confirm('massBasis')
                            setCopied(null)
                          }}
                        />
                        <span>{MASS_BASIS_LABEL[b]}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>
            </section>

            <div className="method">
              <section className="panel prose" aria-labelledby="howto-h">
                <div className="panel-head">
                  <h2 id="howto-h">How to use this tool</h2>
                </div>
                <div className="panel-body">
                  <ol className="steps">
                    {HOW_TO_USE.map((s) => (
                      <li key={s.title}>
                        <strong>{s.title}</strong>
                        <p>{s.body}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              </section>

              {/*
                Closed by default: a returning user does not need it open, and the
                page is already longer than a laptop screen on a flagged result.
              */}
              <details className="panel prose examples">
                <summary className="panel-head">
                  <h2>Worked examples</h2>
                </summary>
                <div className="panel-body">
                  <p>{WORKED_EXAMPLES_INTRO}</p>
                  <ul className="example-list">
                    {WORKED_EXAMPLES.map((x) => (
                      <li key={x.title}>
                        <strong>{x.title}</strong> <Emphasised text={x.body} />
                      </li>
                    ))}
                  </ul>
                </div>
              </details>

              <section className="panel prose" aria-labelledby="why-h">
                <div className="panel-head">
                  <h2 id="why-h">Why this tool exists</h2>
                </div>
                <div className="panel-body">
                  {WHY_THIS_TOOL_EXISTS.map((p) => <p key={p}>{p}</p>)}
                </div>
              </section>

              {/* §9 / C1-FC-01. Required on the tool's own page, visible to the user. */}
              <section className="panel prose" aria-labelledby="cannot-h">
                <div className="panel-head">
                  <h2 id="cannot-h">What this tool cannot detect</h2>
                </div>
                <div className="panel-body">
                  <p>{CANNOT_DETECT_INTRO}</p>
                  <ol className="failure-list">
                    {UNDETECTABLE_FAILURES.map((f) => <li key={f}>{f}</li>)}
                  </ol>
                </div>
              </section>
            </div>
          </div>

          <div className="rail">
            <section className="panel" aria-labelledby="result-h" id="result">
              <div className="panel-head">
                <div className="titles">
                  <h2 id="result-h">The result</h2>
                </div>
                {result && (
                  <div className="actions">
                    <button
                      className="copy"
                      type="button"
                      onClick={() => {
                        // C1-OUT-09, and C1-ST-01: the line carries the
                        // declarations and every flag. A value cannot be taken
                        // from here stripped of them.
                        copyToClipboard(notebookLine(result), 'notebook')
                      }}
                    >
                      {copied === 'notebook' ? 'Copied' : 'Copy for lab notebook'}
                    </button>
                    <button
                      className="copy"
                      type="button"
                      onClick={() => {
                        // C1-OUT-03. The structured object, with a unit on every
                        // quantity and the unrounded values per C1-UN-07. C1's
                        // own schema: open item 1 is still open and no ADC shape
                        // has been invented to stand in for one.
                        copyToClipboard(toJson(result), 'json')
                      }}
                    >
                      {copied === 'json' ? 'Copied' : 'Copy structured result (JSON)'}
                    </button>
                  </div>
                )}
              </div>
              <div className="panel-body">
                <p className="hint lead">
                  The result is shown with every declaration it was computed under.
                </p>

                {rejections && rejections.map((r) => (
                  <p className="rejection" key={r.code}>
                    <code>{r.code}</code>
                    {r.message}
                  </p>
                ))}

                {!outcome && (
                  <div className="state-block incomplete">
                    <h3>No result yet: declarations incomplete</h3>
                    <ul>
                      {missing.map((m) => <li key={m}>{m}</li>)}
                    </ul>
                  </div>
                )}

                {result && (
                  <>
                    <p className="result-value">
                      {enteredIsMass ? result.displayed.molar : result.displayed.mass}
                      <span className="unit">
                        {UNIT_LABEL[enteredIsMass ? units.molar : units.mass]}
                      </span>
                    </p>
                    <p className="result-from">
                      from {entered} {UNIT_LABEL[enteredUnit as MassUnit | MolarUnit]}
                    </p>

                    <dl className="derivation">
                      <div>
                        <dt>Relation</dt>
                        <dd>
                          {/*
                            C1-CV-03 exists so a reader can check the arithmetic.
                            The relation carried its unit handling inside the same
                            string until v0.1.1: "(mg/mL ÷ effective kDa → µM)",
                            and "effective kDa" is not a unit; it was a name for the
                            folded divisor, and a coined term cannot be evaluated.
                            The relation is now named quantities only, and the unit
                            handling is stated under it in standard units.
                          */}
                          {result.relation}
                          <span className="sub">
                            {result.unitHandling}{' '}
                            Divisor: {formatSigFigs(result.effectiveMw)} {result.effectiveMwUnit}.
                          </span>
                        </dd>
                      </div>
                      <div>
                        <dt>Molecular weight</dt>
                        <dd>{result.declarations.mwValue} {UNIT_LABEL[units.mw]}</dd>
                      </div>
                      <div>
                        <dt>Source</dt>
                        <dd>{MW_PROVENANCE_LABEL[result.declarations.provenance]}</dd>
                      </div>
                      <div>
                        <dt>Mass of</dt>
                        <dd>{MASS_BASIS_LABEL[result.declarations.massBasis]}</dd>
                      </div>
                      <div>
                        <dt>Assumptions</dt>
                        <dd>
                          <ul className="assumptions">
                            {result.assumptions.map((a) => <li key={a}>{a}</li>)}
                          </ul>
                        </dd>
                      </div>
                      <div>
                        <dt>Engine</dt>
                        <dd>{result.engineVersion}</dd>
                      </div>
                    </dl>

                    {result.flags.length === 0 ? (
                      <div className="no-flags">
                        <p>No flags raised.</p>
                        {/*
                          C1-OUT-08, NADIRA's round-7 ruling, conditional on
                          shipping: see CLEAN_PANEL_SCOPE_STATEMENT. One line, so
                          removal is a one-line change if it reads as a disclaimer
                          at the bench rather than as scope.
                        */}
                        <p className="no-flags-scope">{result.statements.cleanPanelScope}</p>
                      </div>
                    ) : (
                      result.flags.map((f) => (
                        <p className="flag" key={f.code}>
                          <code>{f.code}</code>
                          {f.message}
                        </p>
                      ))
                    )}

                    <div className="statements">
                      {/*
                        Said where the confusion happens rather than in a footnote: a
                        result one ULP below a threshold is flagged and displays
                        identically to one exactly on it.
                      */}
                      {result.flags.some((f) => f.kind === 'threshold') && (
                        <p>{result.statements.thresholdEvaluation}</p>
                      )}
                      <p>{result.statements.precision}</p>
                      <p>{result.statements.moleculesNotSites}</p>
                      <p><strong>{result.statements.scope}</strong></p>
                    </div>
                  </>
                )}
              </div>
            </section>
          </div>
        </main>

        {/*
          Below the converter, deliberately, so the default rendering with no
          parameter carries no trace of it.

          `toJson(result)` is THE SAME CALL the copy button makes. Not a second
          serialisation path: a divergence between what is shown and what is
          copied would be invisible and would defeat the point of showing it.
        */}
        {SHOW_RECORD && result && (
          <section className="panel record" aria-labelledby="record-h">
            <div className="panel-head">
              <h2 id="record-h">Structured result</h2>
            </div>
            <div className="panel-body">
              <p style={{ marginTop: 0 }}>
                C1-OUT-03, rendered from the same computation and the same serialiser the copy
                button uses. Shown because <code>?record</code> is in the address; nothing here is
                stored, and no input is populated from the address.
              </p>
              <pre className="record-json">{toJson(result)}</pre>
            </div>
          </section>
        )}

        {/*
          C1-NF-01 is an environment claim about the SERVED page, and acceptance
          test 14 establishes it. The shared footer will not render a
          transmission claim without being told which evidence state the tool is
          in: see TransmissionEvidence in Brand.tsx. C1 supplies its own from
          NETWORK_CLAIM_VERIFIED, which check-network.mjs refuses to let anyone
          set on the strength of a local run.
        */}
        {/*
          No children here: the privacy statement in SiteFooter's own prose
          now covers "no account" and "nothing persists" directly, so a
          tool-specific line repeating it would just be the same sentence
          twice in the same footer.
        */}
        <SiteFooter
          transmission={
            NETWORK_CLAIM_VERIFIED
              ? { verifiedAtThisAddress: true }
              : {
                  verifiedAtThisAddress: false,
                  outstanding:
                    'acceptance test 14 is unrun, and only it can rule out a request inserted after the build.',
                }
          }
        />

        <div className="colophon">
          <LigantMark size={16} />
          <span>Ligant · {TOOL_NAME} {APP_VERSION}</span>
        </div>
      </div>
    </>
  )
}
