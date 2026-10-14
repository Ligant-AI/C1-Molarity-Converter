import { useMemo, useState } from 'react';
import { MASS_BASIS, MASS_BASIS_LABEL, MASS_UNITS, MOLAR_UNITS, MW_PROVENANCE, MW_PROVENANCE_LABEL, MW_UNITS, UNIT_LABEL, type MassBasis, type MassUnit, type MolarUnit, type MwProvenance, type MwUnit, } from './lib/units';
import { ENGINE_VERSION, type Direction } from './lib/convert';
import { computeConversion, notebookLine } from './lib/compute';
import { toJson } from './lib/serialise';
import { SCOPE_STATEMENT, UNDETECTABLE_FAILURES, flagLabel } from './lib/flags';
import { CONSTANTS_AND_ASSUMPTIONS, DOES_NOT_ALSO, DOES_NOT_INTRO, FLAG_LEGEND, FLAG_LEGEND_INTRO, HOW_IT_WORKS_FORMULAE, HOW_IT_WORKS_INTRO, HOW_TO_USE, PRECISION_NOTE, TOOLTIPS, WHAT_IT_DOES, WHY_NOT_A_SPREADSHEET, WHY_NOT_A_SPREADSHEET_INTRO, WORKED_EXAMPLES, WORKED_EXAMPLES_INTRO, } from './lib/copy';
import { confirmField, retainedOnDirectionChange, toRetainedFields, type RetainableField } from './lib/retention';
import { APP_VERSION, TOOL_NAME } from './lib/site';
import { LigantMark, SuiteFooter, SuiteHeader } from '@ligant/bench-chrome/react';
import { FOOTER, HEADER } from './lib/chrome';
import { InfoTip } from './InfoTip';
import { formatSigFigs } from './lib/format';
function Emphasised({ text }: {
    text: string;
}) {
    return <>{text.split('**').map((s, i) => (i % 2 ? <strong key={i}>{s}</strong> : s))}</>;
}
const SHOW_RECORD = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('record');
export function App() {
    const [direction, setDirection] = useState<Direction>('mass-to-molar');
    const [entered, setEntered] = useState('');
    const [enteredUnit, setEnteredUnit] = useState<MassUnit | MolarUnit | ''>('');
    const [outMassUnit, setOutMassUnit] = useState<MassUnit>('mg/mL');
    const [outMolarUnit, setOutMolarUnit] = useState<MolarUnit>('uM');
    const [mw, setMw] = useState('');
    const [mwUnit, setMwUnit] = useState<MwUnit | ''>('');
    const [provenance, setProvenance] = useState<MwProvenance | ''>('');
    const [massBasis, setMassBasis] = useState<MassBasis | ''>('');
    const [copied, setCopied] = useState<'notebook' | 'json' | null>(null);
    function copyToClipboard(text: string, which: 'notebook' | 'json') {
        const write = navigator.clipboard?.writeText(text);
        if (!write) {
            setCopied(null);
            return;
        }
        write.then(() => setCopied(which), () => setCopied(null));
    }
    const [retained, setRetained] = useState<ReadonlySet<RetainableField>>(new Set());
    const confirm = (field: RetainableField) => setRetained((r) => confirmField(r, field));
    function changeDirection(next: Direction) {
        if (next === direction)
            return;
        setDirection(next);
        setEntered('');
        setEnteredUnit('');
        setCopied(null);
        setRetained(retainedOnDirectionChange({
            mw: mw.trim() || mwUnit,
            provenance,
            massBasis,
        }));
    }
    const units = useMemo(() => direction === 'mass-to-molar'
        ? { mass: enteredUnit as MassUnit, molar: outMolarUnit, mw: mwUnit as MwUnit }
        : { mass: outMassUnit, molar: enteredUnit as MolarUnit, mw: mwUnit as MwUnit }, [direction, enteredUnit, outMassUnit, outMolarUnit, mwUnit]);
    const outcome = useMemo(() => {
        if (entered.trim() === '' ||
            enteredUnit === '' ||
            mw.trim() === '' ||
            mwUnit === '' ||
            provenance === '' ||
            massBasis === '') {
            return null;
        }
        return computeConversion({
            direction,
            enteredValue: Number(entered),
            mwValue: Number(mw),
            provenance,
            massBasis,
            units,
            retained: toRetainedFields(retained),
        });
    }, [direction, entered, enteredUnit, mw, mwUnit, provenance, massBasis, units, retained]);
    const result = outcome && outcome.ok ? outcome : null;
    const missing = [
        entered.trim() === '' && `enter the ${direction === 'mass-to-molar' ? 'mass' : 'molar'} concentration`,
        enteredUnit === '' && 'select the unit of the concentration',
        mw.trim() === '' && 'enter the molecular weight',
        mwUnit === '' && 'select the unit of the molecular weight',
        provenance === '' && 'declare the source of that weight; "not recorded" is an accepted answer',
        massBasis === '' && 'declare what the weight is the mass of; "not recorded" is an accepted answer',
    ].filter((m): m is string => typeof m === 'string');
    const rejections = outcome && !outcome.ok ? outcome.rejections : null;
    const enteredIsMass = direction === 'mass-to-molar';
    return (<>
      <a className="skip" href="#result">Skip to result</a>
      <div className="wrap">
        <SuiteHeader {...HEADER}/>

        
        <main className="converter layout">
          <div className="stack">
            
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
                    <InfoTip topic="the conversion direction" paragraphs={TOOLTIPS.direction}/>
                  </legend>
                  <div className="radios stacked">
                    <label>
                      <input type="radio" name="direction" checked={direction === 'mass-to-molar'} onChange={() => changeDirection('mass-to-molar')}/>
                      <span>
                        <strong>mass → molar</strong>: enter a mass concentration; the molar concentration is computed
                      </span>
                    </label>
                    <label>
                      <input type="radio" name="direction" checked={direction === 'molar-to-mass'} onChange={() => changeDirection('molar-to-mass')}/>
                      <span>
                        <strong>molar → mass</strong>: enter a molar concentration; the mass concentration is computed
                      </span>
                    </label>
                  </div>
                </fieldset>

                <div className="field">
                  <div className="label-row">
                    <label htmlFor="outunit">Report the result in</label>
                    <InfoTip topic="the result unit" paragraphs={TOOLTIPS.resultUnit}/>
                  </div>
                  {enteredIsMass ? (<select id="outunit" value={outMolarUnit} onChange={(e) => setOutMolarUnit(e.target.value as MolarUnit)}>
                      {MOLAR_UNITS.map((u) => (<option key={u} value={u}>{UNIT_LABEL[u]}</option>))}
                    </select>) : (<select id="outunit" value={outMassUnit} onChange={(e) => setOutMassUnit(e.target.value as MassUnit)}>
                      {MASS_UNITS.map((u) => (<option key={u} value={u}>{UNIT_LABEL[u]}</option>))}
                    </select>)}
                </div>
              </div>
            </section>

            
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
                    
                    <div className="label-row">
                      <label htmlFor="entered">
                        {enteredIsMass ? 'Mass concentration' : 'Molar concentration'}
                      </label>
                      <InfoTip topic={enteredIsMass ? 'the mass concentration' : 'the molar concentration'} paragraphs={TOOLTIPS.concentration}/>
                    </div>
                    <input id="entered" type="text" inputMode="decimal" value={entered} autoComplete="off" className={rejections?.some((r) => r.code === 'C1-HI-02') ? 'bad' : undefined} onChange={(e) => {
            setEntered(e.target.value);
            setCopied(null);
        }}/>
                  </div>
                  <div className="field">
                    <div className="label-row">
                      <label htmlFor="enteredunit">Unit</label>
                      <InfoTip topic={enteredIsMass ? 'the mass concentration unit' : 'the molar concentration unit'} paragraphs={TOOLTIPS.concentrationUnit} align="end"/>
                    </div>
                    <select id="enteredunit" value={enteredUnit} onChange={(e) => {
            setEnteredUnit(e.target.value as MassUnit | MolarUnit);
            setCopied(null);
        }}>
                      <option value="" disabled>(select a unit)</option>
                      {(enteredIsMass ? MASS_UNITS : MOLAR_UNITS).map((u) => (<option key={u} value={u}>{UNIT_LABEL[u]}</option>))}
                    </select>
                  </div>
                </div>
                <p className="hint">Required. Neither the value nor its unit is defaulted or suggested.</p>
              </div>
            </section>

            
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
                      <InfoTip topic="the molecular weight" paragraphs={TOOLTIPS.mw}/>
                    </div>
                    <input id="mw" type="text" inputMode="decimal" value={mw} autoComplete="off" className={rejections?.some((r) => r.code === 'C1-HI-01') ? 'bad' : undefined} onChange={(e) => {
            setMw(e.target.value);
            confirm('mw');
            setCopied(null);
        }}/>
                  </div>
                  <div className="field">
                    <div className="label-row">
                      <label htmlFor="mwunit">Unit</label>
                      <InfoTip topic="the molecular weight unit" paragraphs={TOOLTIPS.mwUnit} align="end"/>
                    </div>
                    <select id="mwunit" value={mwUnit} onChange={(e) => {
            setMwUnit(e.target.value as MwUnit);
            confirm('mw');
            setCopied(null);
        }}>
                      <option value="" disabled>(select a unit)</option>
                      {MW_UNITS.map((u) => (<option key={u} value={u}>{UNIT_LABEL[u]}</option>))}
                    </select>
                  </div>
                </div>

                
                <div className="field">
                  <div className="label-row">
                    <label htmlFor="prov">
                      Source of that weight
                      {retained.has('provenance') && <span className="retained">Retained, not re-confirmed</span>}
                    </label>
                    <InfoTip topic="the source of the weight" paragraphs={TOOLTIPS.provenance}/>
                  </div>
                  <select id="prov" value={provenance} onChange={(e) => {
            setProvenance(e.target.value as MwProvenance);
            confirm('provenance');
            setCopied(null);
        }}>
                    <option value="" disabled>(select a source)</option>
                    {MW_PROVENANCE.map((p) => (<option key={p} value={p}>{MW_PROVENANCE_LABEL[p]}</option>))}
                  </select>
                </div>

                
                <fieldset className="field">
                  <legend>
                    The stated weight is the mass of
                    {retained.has('massBasis') && <span className="retained">Retained, not re-confirmed</span>}
                    <InfoTip topic="what the weight is the mass of" paragraphs={TOOLTIPS.massBasis}/>
                  </legend>
                  <div className="radios stacked">
                    {MASS_BASIS.map((b) => (<label key={b}>
                        <input type="radio" name="massBasis" value={b} checked={massBasis === b} onChange={() => {
                setMassBasis(b);
                confirm('massBasis');
                setCopied(null);
            }}/>
                        <span>{MASS_BASIS_LABEL[b]}</span>
                      </label>))}
                  </div>
                </fieldset>
              </div>
            </section>

            <div className="method">
              <section className="panel prose method-panel" aria-labelledby="about-h">
                <div className="panel-head">
                  <div className="titles">
                    <h2 id="about-h">About this calculator</h2>
                  </div>
                </div>
                <div className="panel-body">
                  <h3>What it does</h3>
                  {WHAT_IT_DOES.map((p) => <p key={p}>{p}</p>)}

                  <h3>How to use it</h3>
                  <ol className="steps">
                    {HOW_TO_USE.map((s) => (<li key={s.title}>
                        <strong>{s.title}</strong>
                        <p>{s.body}</p>
                      </li>))}
                  </ol>
                  
                  <details className="examples">
                    <summary>
                      <h4>Worked examples</h4>
                    </summary>
                    <p>{WORKED_EXAMPLES_INTRO}</p>
                    <ul className="example-list">
                      {WORKED_EXAMPLES.map((x) => (<li key={x.title}>
                          <strong>{x.title}</strong> <Emphasised text={x.body}/>
                        </li>))}
                    </ul>
                  </details>

                  <h3>How it works</h3>
                  {HOW_IT_WORKS_INTRO.map((p) => <p key={p}>{p}</p>)}
                  <p className="formulae">
                    {HOW_IT_WORKS_FORMULAE.map((f) => <code key={f}>{f}</code>)}
                  </p>
                  <h4>Constants and assumptions</h4>
                  <div className="table-scroll">
                    <table className="plain-table">
                      <thead>
                        <tr><th>Name</th><th>Value</th><th>Why</th></tr>
                      </thead>
                      <tbody>
                        {CONSTANTS_AND_ASSUMPTIONS.map((r) => (<tr key={r.name}><td>{r.name}</td><td>{r.value}</td><td>{r.why}</td></tr>))}
                      </tbody>
                    </table>
                  </div>
                  <h4>Precision, rounding and engine version</h4>
                  <p>{PRECISION_NOTE}</p>
                  <p>Engine {ENGINE_VERSION}. The version changes whenever the calculation changes, so two results with the same engine version come from the same arithmetic.</p>
                  <h4>Flags</h4>
                  <p>{FLAG_LEGEND_INTRO}</p>
                  <div className="table-scroll">
                    <table className="plain-table">
                      <thead>
                        <tr><th>Code</th><th>What it means</th><th>What to do</th></tr>
                      </thead>
                      <tbody>
                        {FLAG_LEGEND.map((r) => (<tr key={r.code}><td><code>{r.code}</code></td><td>{r.means}</td><td>{r.action}</td></tr>))}
                      </tbody>
                    </table>
                  </div>

                  <h3>Why not a spreadsheet?</h3>
                  <p>{WHY_NOT_A_SPREADSHEET_INTRO}</p>
                  <ul className="example-list">
                    {WHY_NOT_A_SPREADSHEET.map((t) => (<li key={t}><Emphasised text={t}/></li>))}
                  </ul>

                  <h3>What it does not do</h3>
                  <p>{DOES_NOT_INTRO}</p>
                  <ol className="failure-list">
                    {UNDETECTABLE_FAILURES.map((f) => <li key={f}>{f}</li>)}
                  </ol>
                  {DOES_NOT_ALSO.map((p) => <p key={p}>{p}</p>)}
                  <p><strong>{SCOPE_STATEMENT}</strong></p>
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
                {result && (<div className="actions">
                    <button className="copy" type="button" onClick={() => {
                copyToClipboard(notebookLine(result), 'notebook');
            }}>
                      {copied === 'notebook' ? 'Copied' : 'Copy for lab notebook'}
                    </button>
                    <button className="copy" type="button" onClick={() => {
                copyToClipboard(toJson(result), 'json');
            }}>
                      {copied === 'json' ? 'Copied' : 'Copy structured result (JSON)'}
                    </button>
                  </div>)}
              </div>
              <div className="panel-body">
                <p className="hint lead">
                  The result is shown with every declaration it was computed under.
                </p>

                {rejections && rejections.map((r) => (<p className="rejection" key={r.code}>
                    {r.message}
                  </p>))}

                {!outcome && (<div className="state-block incomplete">
                    <h3>No result yet: declarations incomplete</h3>
                    <ul>
                      {missing.map((m) => <li key={m}>{m}</li>)}
                    </ul>
                  </div>)}

                {result && (<>
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

                    {result.flags.length === 0 ? (<div className="no-flags">
                        <p>No flags raised.</p>
                        
                        <p className="no-flags-scope">{result.statements.cleanPanelScope}</p>
                      </div>) : (result.flags.map((f) => (<p className="flag" key={f.code}>
                          <code>{flagLabel(f.code)}</code>
                          {f.message}
                        </p>)))}

                    <div className="statements">
                      
                      {result.flags.some((f) => f.kind === 'threshold') && (<p>{result.statements.thresholdEvaluation}</p>)}
                      <p>{result.statements.precision}</p>
                      <p>{result.statements.moleculesNotSites}</p>
                      <p><strong>{result.statements.scope}</strong></p>
                    </div>
                  </>)}
              </div>
            </section>
          </div>
        </main>

        
        {SHOW_RECORD && result && (<section className="panel record" aria-labelledby="record-h">
            <div className="panel-head">
              <h2 id="record-h">Structured result</h2>
            </div>
            <div className="panel-body">
              <p style={{ marginTop: 0 }}>
                The structured result, rendered from the same computation and the same
                serialiser the copy button uses. Shown because <code>?record</code> is in the address; nothing here is
                stored, and no input is populated from the address.
              </p>
              <pre className="record-json">{toJson(result)}</pre>
            </div>
          </section>)}

        <SuiteFooter {...FOOTER}/>

        <div className="colophon">
          <LigantMark size={16}/>
          <span>Ligant · {TOOL_NAME} {APP_VERSION}</span>
        </div>
      </div>
    </>);
}
