import assert from 'node:assert/strict';
import fs from 'node:fs';
import { build } from 'esbuild';
import React from 'react';
import { renderToString } from 'react-dom/server';

const outfile = '.tmp_verify_bundle_p37.mjs';

const stubPlugin = {
  name: 'verify-stubs',
  setup(b) {
    b.onResolve({ filter: /\?(worker|url)$/ }, (args) => ({
      path: args.path,
      namespace: 'stub-url'
    }));
    b.onLoad({ filter: /.*/, namespace: 'stub-url' }, () => ({
      contents: 'export default "stub-worker-url";',
      loader: 'js'
    }));
    b.onResolve({ filter: /^virtual:pwa-register\/react$/ }, () => ({
      path: 'virtual-pwa',
      namespace: 'stub-pwa'
    }));
    b.onLoad({ filter: /.*/, namespace: 'stub-pwa' }, () => ({
      contents: `
        export function useRegisterSW() {
          return {
            offlineReady: [false, () => {}],
            needRefresh: [false, () => {}],
            updateServiceWorker: async () => {}
          };
        }
      `,
      loader: 'js'
    }));
    b.onResolve({ filter: /^(@monaco-editor\/react|monaco-editor)$/ }, (args) => ({
      path: args.path,
      namespace: 'stub-monaco'
    }));
    b.onLoad({ filter: /.*/, namespace: 'stub-monaco' }, () => ({
      contents: `
        import React from 'react';
        export default function MonacoStub() { return React.createElement('div', null, 'Monaco'); }
        export const editor = new Proxy({}, { get: () => () => ({ dispose() {} }) });
        export const languages = new Proxy({}, { get: () => () => ({ dispose() {} }) });
      `,
      loader: 'js'
    }));
  }
};

const entrySource = `
  export * from './src/modules/interactive-experiments/types.ts';
  export * from './src/modules/interactive-experiments/simulationRunner.ts';
  export * from './src/modules/interactive-experiments/experimentDb.ts';
  export * from './src/modules/interactive-experiments/experiments/index.ts';
  export { default as InteractiveExperimentsModule } from './src/modules/interactive-experiments/InteractiveExperimentsModule.tsx';
  export { default as App } from './src/App.jsx';
`;

try {
  // Minimal browser shims for SSR smoke tests
  globalThis.window = globalThis;
  globalThis.localStorage = {
    _data: new Map(),
    getItem(k) { return this._data.has(k) ? this._data.get(k) : null; },
    setItem(k, v) { this._data.set(k, String(v)); },
    removeItem(k) { this._data.delete(k); }
  };
  globalThis.document = {
    documentElement: {
      classList: { toggle() {}, add() {}, remove() {} },
      style: {},
      dataset: {}
    }
  };
  globalThis.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });

  await build({
    stdin: {
      contents: entrySource,
      resolveDir: process.cwd(),
      sourcefile: 'verify-entry.tsx',
      loader: 'tsx'
    },
    bundle: true,
    platform: 'node',
    format: 'esm',
    outfile,
    plugins: [stubPlugin],
    loader: {
      '.jpg': 'dataurl',
      '.png': 'dataurl',
      '.svg': 'dataurl',
      '.css': 'empty'
    },
    logLevel: 'silent'
  });

  const mod = await import('./' + outfile);

  // 1. Catalog & parameter validation tests
  assert.equal(mod.INTERACTIVE_EXPERIMENTS.length, 6, 'Expected 6 interactive experiments');
  for (const exp of mod.INTERACTIVE_EXPERIMENTS) {
    const defaults = mod.getDefaultParameters(exp);
    const validated = mod.validateAndClampParameters(exp, {
      ...defaults,
      [exp.parameters[0].id]: Number.NaN
    });
    assert.ok(validated[exp.parameters[0].id] !== undefined, 'NaN should recover to default');

    const initSnap = mod.initializeSimulation(exp);
    const steppedSnap = mod.advanceSimulationStep(exp, initSnap, 2);
    assert.ok(steppedSnap.stepIndex > initSnap.stepIndex, `${exp.id} should advance step`);
    const fullSnap = mod.runSimulationToCompletion(exp, defaults);
    assert.equal(fullSnap.isCompleted, true, `${exp.id} should complete cleanly`);
    assert.ok(fullSnap.seriesHistory[exp.series[0].id].length > 5, `${exp.id} should record series points`);
  }

  // 2. Scientific law check #1: USP II Dissolution
  const diss = mod.getExperimentById('exp_dissolution_noyes_whitney');
  const dDefaults = mod.getDefaultParameters(diss);
  const dSlow = mod.runSimulationToCompletion(diss, { ...dDefaults, rpm: 25 });
  const dFast = mod.runSimulationToCompletion(diss, { ...dDefaults, rpm: 100 });
  assert.ok(dFast.metrics.finalPct > dSlow.metrics.finalPct, '100 RPM must dissolve faster than 25 RPM');
  const dissPts = dFast.seriesHistory.pctDissolved;
  for (let i = 1; i < dissPts.length; i++) {
    assert.ok(dissPts[i].y >= dissPts[i - 1].y - 1e-6, 'Dissolution % must be monotonic');
  }
  const dNonSink = mod.runSimulationToCompletion(diss, { ...dDefaults, doseMg: 500, solubilityMgMl: 0.4, volumeMl: 500, sinkIdealized: false });
  const dSink = mod.runSimulationToCompletion(diss, { ...dDefaults, doseMg: 500, solubilityMgMl: 0.4, volumeMl: 500, sinkIdealized: true });
  assert.ok(dSink.metrics.finalPct > dNonSink.metrics.finalPct, 'Idealized sink must exceed non-sink under saturation limit');
  const finalPctVal = dFast.seriesHistory.pctDissolved.at(-1).y;
  const finalRemMg = dFast.seriesHistory.remainingMg.at(-1).y;
  assert.ok(Math.abs((finalPctVal / 100) * Number(dDefaults.doseMg) + finalRemMg - Number(dDefaults.doseMg)) < 0.5, 'Mass balance must hold');

  // 3. Scientific law check #2: Acid-Base Titration
  const titr = mod.getExperimentById('exp_acid_base_titration');
  const tDefaults = mod.getDefaultParameters(titr);
  const hclRun = mod.runSimulationToCompletion(titr, { ...tDefaults, acidType: 'hcl', acidConcM: 0.1, acidVolMl: 25, baseConcM: 0.1, maxBaseVolMl: 50 });
  const phCurveHcl = hclRun.seriesHistory.ph;
  const phAt0 = phCurveHcl[0].y;
  const phAtEq = phCurveHcl.find((p) => Math.abs(p.x - 25) < 0.01)?.y;
  assert.ok(Math.abs(phAt0 - 1.0) < 0.05, `Strong acid 0.1M HCl start pH ~1.0, got ${phAt0}`);
  assert.ok(Math.abs(phAtEq - 7.0) < 0.05, `HCl equivalence pH ~7.0, got ${phAtEq}`);

  const aceticRun = mod.runSimulationToCompletion(titr, { ...tDefaults, acidType: 'acetic', acidConcM: 0.1, acidVolMl: 25, baseConcM: 0.1, maxBaseVolMl: 50 });
  const phAtHalf = aceticRun.seriesHistory.ph.find((p) => Math.abs(p.x - 12.5) < 0.01)?.y;
  assert.ok(Math.abs(phAtHalf - 4.76) < 0.05, `Acetic half-equivalence pH ~4.76, got ${phAtHalf}`);
  assert.ok(aceticRun.metrics.eqVolumeMl === 25, 'Equivalence volume must be 25 mL');

  // 4. Scientific law check #3: 1-Compartment PK
  const pk = mod.getExperimentById('exp_one_compartment_pk');
  const pkDef = mod.getDefaultParameters(pk);
  const pkNormal = mod.runSimulationToCompletion(pk, { ...pkDef, route: 'oral_single', clLhr: 4, vdL: 35, kaHr: 1.4, fBioavail: 0.85, doseMg: 500 });
  const pkHalfCl = mod.runSimulationToCompletion(pk, { ...pkDef, route: 'oral_single', clLhr: 2, vdL: 35, kaHr: 1.4, fBioavail: 0.85, doseMg: 500 });
  assert.ok(Math.abs(pkHalfCl.metrics.halfLifeHr / pkNormal.metrics.halfLifeHr - 2.0) < 0.02, 'Halving CL must double t1/2');
  const keNorm = 4 / 35;
  const expectedTmax = Math.log(1.4 / keNorm) / (1.4 - keNorm);
  assert.ok(Math.abs(pkNormal.metrics.tmaxHr - expectedTmax) < 0.35, `Tmax (${pkNormal.metrics.tmaxHr}) should match theoretical (${expectedTmax})`);
  const pkRepeated = mod.runSimulationToCompletion(pk, { ...pkDef, route: 'oral_repeated', durationHr: 48, tauHr: 8 });
  assert.ok(pkRepeated.metrics.cmaxMgL > pkNormal.metrics.cmaxMgL, 'Repeated oral dosing must accumulate higher than single dose');

  // 5. Scientific law check #4: Cardiac Hemodynamics
  const cvs = mod.getExperimentById('exp_cardiac_hemodynamics');
  const cvsDef = mod.getDefaultParameters(cvs);
  const cvsBase = mod.runSimulationToCompletion(cvs, cvsDef);
  assert.ok(Math.abs(cvsBase.metrics.cardiacOutputLMin - (Number(cvsBase.metrics.strokeVolumeMl) * Number(cvsDef.hrBpm)) / 1000) < 0.15, 'CO = HR * SV / 1000');
  const cvsHighTpr = mod.runSimulationToCompletion(cvs, { ...cvsDef, tprPru: 1.6 });
  assert.ok(cvsHighTpr.metrics.mapMmHg > cvsBase.metrics.mapMmHg, 'Higher TPR must increase MAP');
  const cvsStiff = mod.runSimulationToCompletion(cvs, { ...cvsDef, complianceMlMmHg: 0.7 });
  assert.ok(cvsStiff.metrics.pulsePressureMmHg > cvsBase.metrics.pulsePressureMmHg, 'Lower arterial compliance must widen pulse pressure');

  // 6. Scientific law check #5: Microbial Growth & Sterilization
  const micro = mod.getExperimentById('exp_microbial_growth_sterilization');
  const mDef = mod.getDefaultParameters(micro);
  const growth = mod.runSimulationToCompletion(micro, { ...mDef, mode: 'growth' });
  const bioSeries = growth.seriesHistory.biomassGL;
  const subSeries = growth.seriesHistory.substrateGL;
  assert.ok(bioSeries.at(-1).y > bioSeries[0].y, 'Biomass must increase');
  assert.ok(subSeries.at(-1).y < subSeries[0].y, 'Substrate must be consumed');
  const ster121 = mod.runSimulationToCompletion(micro, { ...mDef, mode: 'sterilization', sterTempC: 121.1, d121Min: 1.5, zValueC: 10, holdTimeMin: 18, n0CountLog: 6 });
  assert.ok(Math.abs(ster121.metrics.finalLogN - (-6.0)) < 0.1, `18 min / 1.5 min D = 12 log reductions -> logN -6, got ${ster121.metrics.finalLogN}`);
  const ster131 = mod.runSimulationToCompletion(micro, { ...mDef, mode: 'sterilization', sterTempC: 131.1, d121Min: 1.5, zValueC: 10, holdTimeMin: 18, n0CountLog: 6 });
  assert.ok(Math.abs(ster131.metrics.dAtTempMin * 10 - ster121.metrics.dAtTempMin) < 0.02, '10 C rise with z=10 must reduce D(T) 10x');

  // 7. Scientific law check #6: Membrane Diffusion
  const diff = mod.getExperimentById('exp_fick_diffusion_membrane');
  const diffDef = mod.getDefaultParameters(diff);
  const diffBase = mod.runSimulationToCompletion(diff, { ...diffDef, thicknessUm: 100 });
  const diffThick = mod.runSimulationToCompletion(diff, { ...diffDef, thicknessUm: 200 });
  assert.ok(Math.abs(diffBase.metrics.jSsUgCm2Hr / diffThick.metrics.jSsUgCm2Hr - 2.0) < 0.02, 'Doubling h must halve steady-state flux Jss');
  assert.ok(Math.abs(diffThick.metrics.lagTimeMin / diffBase.metrics.lagTimeMin - 4.0) < 0.05, 'Doubling h must quadruple lag time h^2/(6D)');

  // 8. Export, Comparison & DB memory fallback roundtrip
  const run1 = {
    id: 'run_1',
    experimentId: diss.id,
    experimentTitle: diss.title,
    label: 'Run 1',
    createdAt: Date.now(),
    params: dSlow.params,
    finalMetrics: dSlow.metrics,
    seriesHistory: dSlow.seriesHistory,
    linked3dAssetIds: [],
    observations: 'Slow agitation test',
    conclusion: '',
    notes: '',
    pinnedForCompare: true
  };
  const run2 = { ...run1, id: 'run_2', label: 'Run 2', params: dFast.params, finalMetrics: dFast.metrics, seriesHistory: dFast.seriesHistory };
  await mod.saveExperimentRun(run1);
  await mod.saveExperimentRun(run2);
  const saved = await mod.getRunsForExperiment(diss.id);
  assert.equal(saved.length, 2, 'Memory fallback DB should store and list 2 runs');
  await mod.updateExperimentRun('run_1', { notes: 'Updated note' });
  const afterUpdate = await mod.getRunsForExperiment(diss.id);
  assert.equal(afterUpdate.find((r) => r.id === 'run_1')?.notes, 'Updated note');
  const csv = mod.buildSeriesCsv(diss, dFast);
  assert.ok(csv.includes('Time') && csv.includes('% Dissolved'), 'CSV export should include headers');
  const jsonStr = mod.buildRunExportJson(diss, run2);
  assert.ok(JSON.parse(jsonStr).experimentCode === 'SIM-PH-01', 'JSON export should parse cleanly');
  const cmp = mod.computeRunComparisonRows(diss, [run1, run2]);
  assert.ok(cmp.metricRows.length > 0 && cmp.paramRows.length > 0, 'Run comparison matrix should populate');
  await mod.deleteExperimentRun('run_1');
  await mod.deleteExperimentRun('run_2');

  // 9. 3D asset matching test
  const sampleAssets = [
    {
      id: 'asset_heart',
      name: 'Human Heart Cross-Section',
      description: '3D anatomical model of heart ventricles, valves, and aorta',
      category: 'organs_tissues',
      department: 'anatomy',
      subject: 'BP104T',
      tags: ['heart', 'cardiac', 'ventricle', 'valve'],
      format: 'glb',
      source: 'user_upload',
      creator: 'Test',
      license: 'CC-BY',
      importedAt: Date.now(),
      fileSizeBytes: 1000,
      hasLocalBlob: true
    }
  ];
  const cvsMatches = mod.match3DAssetsForExperiment(cvs, sampleAssets);
  assert.ok(cvsMatches.length === 1 && cvsMatches[0].asset.id === 'asset_heart', 'Cardiac sim should match heart 3D asset');

  // 10. React SSR render smoke tests
  const catalogHtml = renderToString(React.createElement(mod.InteractiveExperimentsModule));
  assert.ok(catalogHtml.includes('Tablet Dissolution') && catalogHtml.includes('Acid–Base Volumetric Titration'), 'Catalog view should render all experiments');

  const simHtml = renderToString(
    React.createElement(mod.InteractiveExperimentsModule, {
      jumpTarget: { experimentId: 'exp_dissolution_noyes_whitney', stage: 'simulate', nonce: 1 }
    })
  );
  assert.ok(simHtml.includes('Noyes') && simHtml.includes('USP Type II'), 'Simulation view should render dissolution simulator');

  const appHtml = renderToString(React.createElement(mod.App));
  assert.ok(appHtml.includes('Interactive Sims'), 'App dashboard SSR should render Interactive Sims launcher');

  console.log('ALL P3.7 VERIFICATION CHECKS PASSED!');
} finally {
  if (fs.existsSync(outfile)) fs.unlinkSync(outfile);
  if (fs.existsSync('.tmp_verify_p37.mjs')) fs.unlinkSync('.tmp_verify_p37.mjs');
}
