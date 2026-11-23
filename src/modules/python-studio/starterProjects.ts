export interface StarterFileSpec {
  path: string;
  content: string;
}

export interface StarterProjectTemplate {
  id: string;
  name: string;
  description: string;
  recommendedPackages: string[];
  files: StarterFileSpec[];
  defaultActiveFile: string;
}

export const STARTER_PROJECT_TEMPLATES: StarterProjectTemplate[] = [
  {
    id: 'pk-modeling',
    name: 'Pharmacokinetics: Oral vs IV',
    description:
      'One-compartment IV bolus and oral plasma concentration modeling with multi-file imports, CSV dataset loading, AUC calculation, and Matplotlib visualization.',
    recommendedPackages: ['numpy', 'pandas', 'matplotlib'],
    defaultActiveFile: 'main.py',
    files: [
      {
        path: 'main.py',
        content: `"""One-Compartment Pharmacokinetics: IV Bolus vs Oral Absorption."""
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from pk_utils import iv_bolus_conc, oral_conc, trapezoidal_auc, elimination_half_life

# Load clinical sampling schedule from project CSV
df_samples = pd.read_csv("data/clinical_sampling.csv")
print("Loaded Clinical Sampling Table:")
display(df_samples)

# Simulation parameters (500 mg dose, Vd = 25 L, ka = 1.15 /h, ke = 0.18 /h)
dose_mg = 500.0
vd_l = 25.0
ka = 1.15
ke = 0.18
t_grid = np.linspace(0, 12, 121)

c_iv = iv_bolus_conc(t_grid, dose_mg, vd_l, ke)
c_oral = oral_conc(t_grid, dose_mg, vd_l, ka, ke, F=0.85)

auc_iv = trapezoidal_auc(t_grid, c_iv)
auc_oral = trapezoidal_auc(t_grid, c_oral)
cmax_oral = float(np.max(c_oral))
tmax_oral = float(t_grid[int(np.argmax(c_oral))])

summary = pd.DataFrame([
    {"Route": "IV Bolus", "Cmax (mg/L)": round(float(c_iv[0]), 2), "Tmax (h)": 0.0, "AUC_0-12 (mg·h/L)": round(auc_iv, 2)},
    {"Route": "Oral (F=0.85)", "Cmax (mg/L)": round(cmax_oral, 2), "Tmax (h)": round(tmax_oral, 2), "AUC_0-12 (mg·h/L)": round(auc_oral, 2)},
])
print(f"Elimination Half-Life (t1/2): {elimination_half_life(ke):.2f} h")
display(summary)

fig, ax = plt.subplots(figsize=(7.5, 4.2))
ax.plot(t_grid, c_iv, label="IV Bolus (100% Bioavailable)", color="#38bdf8", linewidth=2.2)
ax.plot(t_grid, c_oral, label="Oral Tablet (F = 0.85)", color="#10b981", linewidth=2.2)
ax.scatter(df_samples["Time_hr"], df_samples["Observed_Oral_mg_L"], color="#f59e0b", zorder=5, label="Observed Oral Samples")
ax.set_title("Plasma Concentration-Time Profile (Oral vs IV Bolus)")
ax.set_xlabel("Time after Administration (h)")
ax.set_ylabel("Plasma Concentration (mg/L)")
ax.grid(True, linestyle="--", alpha=0.35)
ax.legend()
plt.tight_layout()
plt.show()
`
      },
      {
        path: 'pk_utils.py',
        content: `"""Reusable pharmacokinetic equations for compartment modeling."""
import numpy as np


def elimination_half_life(ke: float) -> float:
    return float(np.log(2.0) / ke)


def iv_bolus_conc(t, dose_mg: float, vd_l: float, ke: float):
    t_arr = np.asarray(t, dtype=float)
    return (dose_mg / vd_l) * np.exp(-ke * t_arr)


def oral_conc(t, dose_mg: float, vd_l: float, ka: float, ke: float, F: float = 1.0):
    t_arr = np.asarray(t, dtype=float)
    if np.isclose(ka, ke):
        return (F * dose_mg * ka / vd_l) * t_arr * np.exp(-ke * t_arr)
    prefactor = (F * dose_mg * ka) / (vd_l * (ka - ke))
    return np.maximum(0.0, prefactor * (np.exp(-ke * t_arr) - np.exp(-ka * t_arr)))


def trapezoidal_auc(t, c) -> float:
    return float(np.trapezoid(c, t) if hasattr(np, "trapezoid") else np.trapz(c, t))
`
      },
      {
        path: 'data/clinical_sampling.csv',
        content: `Time_hr,Observed_Oral_mg_L,Observed_IV_mg_L
0.5,8.4,18.2
1.0,12.1,16.7
1.5,13.6,15.3
2.0,13.9,14.0
4.0,10.8,9.8
6.0,7.6,6.8
8.0,5.2,4.7
12.0,2.5,2.3
`
      },
      {
        path: 'README.md',
        content: `# Pharmacokinetics Modeling Project

Run \`main.py\` with **Ctrl+Enter** (or the **Run File** button) to:
1. Read \`data/clinical_sampling.csv\` from the synced virtual filesystem.
2. Import helper functions from \`pk_utils.py\`.
3. Compute AUC, Cmax, Tmax, and elimination half-life.
4. Render a high-resolution Matplotlib concentration-time curve in the Output panel.
`
      }
    ]
  },
  {
    id: 'multiple-dose-pk',
    name: 'Multiple-Dose PK & Steady-State',
    description:
      'Repeated dosing superposition (Css,max, Css,min, Css,avg), accumulation factor R, loading dose optimization, and therapeutic window plot.',
    recommendedPackages: ['numpy', 'pandas', 'matplotlib'],
    defaultActiveFile: 'main.py',
    files: [
      {
        path: 'main.py',
        content: `"""Multiple-Dose IV & Oral Accumulation to Steady-State (Css,max / Css,min)."""
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

# Drug parameters: 250 mg every 8 h, Vd = 20 L, t1/2 = 6 h (ke = 0.1155 /h)
dose_mg = 250.0
tau = 8.0
vd_l = 20.0
ke = np.log(2.0) / 6.0
ka = 1.2
F = 0.9
n_doses = 8

# Accumulation factor R = 1 / (1 - exp(-ke * tau))
R = 1.0 / (1.0 - np.exp(-ke * tau))
loading_dose = dose_mg * R

# Steady-state IV metrics
c0_single = dose_mg / vd_l
css_max_iv = c0_single * R
css_min_iv = css_max_iv * np.exp(-ke * tau)
css_avg_iv = (dose_mg) / (ke * vd_l * tau)

summary = pd.DataFrame([
    {"Regimen": "Maintenance 250 mg q8h", "Accumulation R": round(R, 3), "Css,max (mg/L)": round(css_max_iv, 2), "Css,min (mg/L)": round(css_min_iv, 2), "Css,avg (mg/L)": round(css_avg_iv, 2)},
    {"Regimen": f"With Loading Dose ({loading_dose:.0f} mg)", "Accumulation R": round(R, 3), "Css,max (mg/L)": round(css_max_iv, 2), "Css,min (mg/L)": round(css_min_iv, 2), "Css,avg (mg/L)": round(css_avg_iv, 2)},
])
display(summary)
print(f"Accumulation Ratio (R): {R:.2f} | Recommended Loading Dose (DL): {loading_dose:.1f} mg")

# Superposition over 8 dosing intervals
t_total = np.linspace(0, n_doses * tau, 600)
conc_maint = np.zeros_like(t_total)
conc_loaded = np.zeros_like(t_total)
conc_oral = np.zeros_like(t_total)

for k in range(n_doses):
    dt = t_total - (k * tau)
    mask = dt >= 0
    d_cur = loading_dose if k == 0 else dose_mg
    conc_maint[mask] += (dose_mg / vd_l) * np.exp(-ke * dt[mask])
    conc_loaded[mask] += (d_cur / vd_l) * np.exp(-ke * dt[mask])
    oral_term = (F * dose_mg * ka) / (vd_l * (ka - ke)) * (np.exp(-ke * dt[mask]) - np.exp(-ka * dt[mask]))
    conc_oral[mask] += np.maximum(0.0, oral_term)

fig, ax = plt.subplots(figsize=(7.5, 4.3))
ax.axhspan(8.0, 22.0, color="#10b981", alpha=0.12, label="Therapeutic Window (8–22 mg/L)")
ax.plot(t_total, conc_maint, color="#38bdf8", linewidth=2.0, label="IV Maintenance Only")
ax.plot(t_total, conc_loaded, color="#f59e0b", linestyle="--", linewidth=2.0, label="IV + Loading Dose")
ax.plot(t_total, conc_oral, color="#10b981", linewidth=2.0, label="Oral Multi-Dose (F=0.9)")
ax.set_title("Multiple-Dose Accumulation to Steady State (q8h)")
ax.set_xlabel("Time (hours)")
ax.set_ylabel("Plasma Concentration (mg/L)")
ax.grid(True, linestyle="--", alpha=0.35)
ax.legend(loc="lower right", fontsize=8)
plt.tight_layout()
plt.show()
`
      }
    ]
  },
  {
    id: 'bioequivalence-stats',
    name: 'Bioequivalence & Statistical QC (SciPy)',
    description:
      'Log-transformed 90% confidence interval for Test vs Reference AUC/Cmax (80–125% BE bounds), paired t-test, and multi-batch ANOVA.',
    recommendedPackages: ['numpy', 'pandas', 'scipy', 'matplotlib'],
    defaultActiveFile: 'main.py',
    files: [
      {
        path: 'main.py',
        content: `"""Bioequivalence 90% Confidence Interval & Multi-Batch Tablet Assay ANOVA."""
import numpy as np
import pandas as pd
from scipy import stats
import matplotlib.pyplot as plt

df = pd.read_csv("be_crossover.csv")
display(df)

# Log-transformed AUC ratio (Test / Reference) for 90% CI (Two One-Sided Tests)
log_diff = np.log(df["AUC_Test"]) - np.log(df["AUC_Reference"])
n = len(log_diff)
mean_diff = float(np.mean(log_diff))
se_diff = float(stats.sem(log_diff))
t_crit = float(stats.t.ppf(0.95, df=n - 1))  # 90% two-sided CI

ci_low_pct = float(np.exp(mean_diff - t_crit * se_diff) * 100.0)
ci_high_pct = float(np.exp(mean_diff + t_crit * se_diff) * 100.0)
gmr_pct = float(np.exp(mean_diff) * 100.0)
t_stat, p_val = stats.ttest_rel(np.log(df["AUC_Test"]), np.log(df["AUC_Reference"]))

be_pass = ci_low_pct >= 80.0 and ci_high_pct <= 125.0
print(f"Geometric Mean Ratio (T/R): {gmr_pct:.2f}%")
print(f"90% Confidence Interval: [{ci_low_pct:.2f}%, {ci_high_pct:.2f}%] -> BE Status: {'PASS (80-125%)' if be_pass else 'FAIL'}")
print(f"Paired t-test on ln(AUC): t = {t_stat:.3f}, p = {p_val:.4f}")

# One-way ANOVA across 3 manufacturing tablet batches (% label claim)
batch_a = np.array([99.4, 100.2, 98.9, 100.6, 99.8, 100.1])
batch_b = np.array([98.8, 99.5, 100.4, 99.2, 99.9, 100.3])
batch_c = np.array([101.2, 100.5, 99.7, 101.0, 100.4, 99.8])
f_stat, anova_p = stats.f_oneway(batch_a, batch_b, batch_c)
print(f"3-Batch Assay One-Way ANOVA: F = {f_stat:.3f}, p = {anova_p:.4f}")

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(9.0, 3.8))
ax1.errorbar([gmr_pct], [1], xerr=[[gmr_pct - ci_low_pct], [ci_high_pct - gmr_pct]],
             fmt="o", color="#10b981", ecolor="#10b981", elinewidth=2.5, capsize=6, label="Test / Ref AUC 90% CI")
ax1.axvline(80, color="#ef4444", linestyle="--", label="BE Lower Limit (80%)")
ax1.axvline(100, color="#94a3b8", linestyle=":", label="Unity (100%)")
ax1.axvline(125, color="#ef4444", linestyle="--", label="BE Upper Limit (125%)")
ax1.set_xlim(70, 135)
ax1.set_yticks([])
ax1.set_title("Bioequivalence 90% CI")
ax1.set_xlabel("Test / Reference Ratio (%)")
ax1.legend(fontsize=7)

ax2.boxplot([batch_a, batch_b, batch_c], labels=["Batch A", "Batch B", "Batch C"])
ax2.axhline(100.0, color="#10b981", linestyle=":")
ax2.set_title(f"Batch Assay ANOVA (p={anova_p:.3f})")
ax2.set_ylabel("Assay (% Label Claim)")
ax2.grid(True, linestyle="--", alpha=0.3)
plt.tight_layout()
plt.show()
`
      },
      {
        path: 'be_crossover.csv',
        content: `Subject,AUC_Reference,AUC_Test,Cmax_Reference,Cmax_Test
S01,142.5,146.1,18.2,18.8
S02,128.0,124.5,16.4,15.9
S03,165.4,169.0,21.0,21.4
S04,119.2,122.8,15.1,15.6
S05,154.0,151.2,19.3,19.0
S06,138.6,143.0,17.8,18.1
S07,149.1,147.8,18.9,18.5
S08,131.5,135.4,16.7,17.2
`
      }
    ]
  },
  {
    id: 'tablet-qc',
    name: 'Tablet QC & Dissolution (SciPy)',
    description:
      'Weight variation compliance check (IP/BP limits), non-linear first-order dissolution curve fitting via scipy.optimize.curve_fit, and control plots.',
    recommendedPackages: ['numpy', 'pandas', 'scipy', 'matplotlib'],
    defaultActiveFile: 'main.py',
    files: [
      {
        path: 'main.py',
        content: `"""Tablet Weight Variation QC & Non-Linear Dissolution Curve Fitting."""
import numpy as np
import pandas as pd
from scipy import optimize, stats
import matplotlib.pyplot as plt

df = pd.read_csv("batches/dissolution_profiles.csv")
display(df)

# First-order dissolution model: Q(t) = Q_max * (1 - exp(-k * t))
def first_order_release(t, q_max, k):
    return q_max * (1.0 - np.exp(-k * t))

t_data = df["Time_min"].to_numpy(dtype=float)
ir_data = df["IR_Pct_Released"].to_numpy(dtype=float)
sr_data = df["SR_Pct_Released"].to_numpy(dtype=float)

popt_ir, _ = optimize.curve_fit(first_order_release, t_data, ir_data, p0=[100.0, 0.05])
popt_sr, _ = optimize.curve_fit(first_order_release, t_data, sr_data, p0=[100.0, 0.015])

print(f"IR Fit -> Q_max: {popt_ir[0]:.2f}%, k: {popt_ir[1]:.4f} min^-1")
print(f"SR Fit -> Q_max: {popt_sr[0]:.2f}%, k: {popt_sr[1]:.4f} min^-1")

# Tablet weight variation QC sample (20 tablets, 500 mg nominal)
weights = np.array([
    498.4, 502.1, 496.9, 504.3, 499.8, 501.2, 497.5, 503.0, 500.4, 495.8,
    501.9, 499.1, 503.6, 498.0, 500.7, 502.4, 497.9, 501.0, 499.5, 500.2
])
mean_w = float(np.mean(weights))
sd_w = float(np.std(weights, ddof=1))
rsd_pct = (sd_w / mean_w) * 100.0
ci_low, ci_high = stats.t.interval(0.95, df=len(weights) - 1, loc=mean_w, scale=stats.sem(weights))
print(f"Tablet Weight Mean: {mean_w:.2f} mg | RSD: {rsd_pct:.2f}% | 95% CI: [{ci_low:.2f}, {ci_high:.2f}] mg")

t_smooth = np.linspace(0, 120, 200)
fig, ax = plt.subplots(figsize=(7.5, 4.2))
ax.scatter(t_data, ir_data, color="#10b981", label="IR Observed")
ax.plot(t_smooth, first_order_release(t_smooth, *popt_ir), color="#10b981", linewidth=2, label=f"IR Fit (k={popt_ir[1]:.3f}/m)")
ax.scatter(t_data, sr_data, color="#f59e0b", label="SR Observed")
ax.plot(t_smooth, first_order_release(t_smooth, *popt_sr), color="#f59e0b", linestyle="--", linewidth=2, label=f"SR Fit (k={popt_sr[1]:.3f}/m)")
ax.axhline(80, color="#94a3b8", linestyle=":", linewidth=1.2, label="IP Q-Spec Threshold (80%)")
ax.set_title("In-Vitro Dissolution Kinetics (First-Order SciPy Fit)")
ax.set_xlabel("Time (minutes)")
ax.set_ylabel("Cumulative Drug Released (%)")
ax.set_ylim(0, 108)
ax.grid(True, linestyle="--", alpha=0.35)
ax.legend()
plt.tight_layout()
plt.show()
`
      },
      {
        path: 'batches/dissolution_profiles.csv',
        content: `Time_min,IR_Pct_Released,SR_Pct_Released
0,0.0,0.0
15,53.4,17.8
30,80.2,31.9
45,92.5,45.2
60,97.1,56.8
90,99.0,73.4
120,99.6,84.9
`
      }
    ]
  },
  {
    id: 'enzyme-kinetics',
    name: 'Enzyme Kinetics (Michaelis–Menten)',
    description:
      'Non-linear curve fitting of substrate velocity data for Vmax and Km, Lineweaver–Burk linearization, and competitive inhibition modeling.',
    recommendedPackages: ['numpy', 'pandas', 'scipy', 'matplotlib'],
    defaultActiveFile: 'main.py',
    files: [
      {
        path: 'main.py',
        content: `"""Enzyme Kinetics: Michaelis-Menten Non-Linear Fit & Lineweaver-Burk Plot."""
import numpy as np
import pandas as pd
from scipy import optimize
import matplotlib.pyplot as plt

substrate_mM = np.array([0.5, 1.0, 2.0, 4.0, 8.0, 15.0, 30.0])
v_control = np.array([11.8, 19.9, 31.2, 43.8, 55.1, 63.4, 70.1])
v_inhibited = np.array([6.9, 12.1, 20.5, 31.6, 44.2, 55.8, 65.4])

def michaelis_menten(S, vmax, km):
    return (vmax * S) / (km + S)

popt_ctrl, _ = optimize.curve_fit(michaelis_menten, substrate_mM, v_control, p0=[80.0, 3.0])
popt_inh, _ = optimize.curve_fit(michaelis_menten, substrate_mM, v_inhibited, p0=[80.0, 6.0])

table = pd.DataFrame([
    {"Condition": "Control (No Inhibitor)", "Vmax (umol/min)": round(popt_ctrl[0], 2), "Km_app (mM)": round(popt_ctrl[1], 2)},
    {"Condition": "+ Competitive Inhibitor", "Vmax (umol/min)": round(popt_inh[0], 2), "Km_app (mM)": round(popt_inh[1], 2)},
])
display(table)

s_grid = np.linspace(0.1, 32.0, 200)
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(9.2, 3.9))

ax1.scatter(substrate_mM, v_control, color="#10b981", label="Control Data")
ax1.plot(s_grid, michaelis_menten(s_grid, *popt_ctrl), color="#10b981", linewidth=2, label=f"Control (Km={popt_ctrl[1]:.2f} mM)")
ax1.scatter(substrate_mM, v_inhibited, color="#f59e0b", label="Inhibited Data")
ax1.plot(s_grid, michaelis_menten(s_grid, *popt_inh), color="#f59e0b", linestyle="--", linewidth=2, label=f"+ Inhibitor (Km={popt_inh[1]:.2f} mM)")
ax1.set_title("Michaelis-Menten Curve")
ax1.set_xlabel("[S] (mM)")
ax1.set_ylabel("Reaction Velocity v (umol/min)")
ax1.grid(True, linestyle="--", alpha=0.35)
ax1.legend(fontsize=7)

inv_s = 1.0 / substrate_mM
ax2.plot(inv_s, 1.0 / v_control, "o-", color="#10b981", label="Control")
ax2.plot(inv_s, 1.0 / v_inhibited, "s--", color="#f59e0b", label="+ Competitive Inhibitor")
ax2.set_title("Lineweaver-Burk (1/v vs 1/[S])")
ax2.set_xlabel("1 / [S] (mM^-1)")
ax2.set_ylabel("1 / v (min/umol)")
ax2.grid(True, linestyle="--", alpha=0.35)
ax2.legend(fontsize=7)

plt.tight_layout()
plt.show()
`
      }
    ]
  },
  {
    id: 'arrhenius-shelf-life',
    name: 'Arrhenius Stability & Shelf-Life (t90)',
    description:
      'Accelerated stability testing (BP101T Practical 5): Arrhenius regression, Activation Energy (Ea), and 25°C shelf-life prediction.',
    recommendedPackages: ['numpy', 'pandas', 'matplotlib'],
    defaultActiveFile: 'main.py',
    files: [
      {
        path: 'main.py',
        content: `"""BP101T Practical 5: Accelerated Drug Stability & Arrhenius Shelf-Life (t90)."""
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

temps_c = np.array([40.0, 50.0, 60.0, 70.0])
temps_k = temps_c + 273.15
inv_temp = 1.0 / temps_k
k_vals = np.array([0.00012, 0.00043, 0.00148, 0.00465])  # day^-1
ln_k = np.log(k_vals)

# Linear regression: ln(k) = (-Ea/R) * (1/T) + ln(A)
slope, intercept = np.polyfit(inv_temp, ln_k, 1)
R_cal = 1.987  # cal / (mol * K)
ea_kcal = (-slope * R_cal) / 1000.0

k_25c = float(np.exp(slope * (1.0 / (25.0 + 273.15)) + intercept))
t90_days = 0.1053 / k_25c
t90_years = t90_days / 365.25

df_stab = pd.DataFrame({
    "Temp (°C)": temps_c,
    "Temp (K)": temps_k,
    "1/T (×10⁻³ K⁻¹)": np.round(inv_temp * 1000.0, 4),
    "k (day⁻¹)": k_vals,
    "ln(k)": np.round(ln_k, 4),
})
display(df_stab)
print(f"Activation Energy (Ea): {ea_kcal:.2f} kcal/mol")
print(f"Predicted k at 25°C: {k_25c:.6f} day^-1")
print(f"Predicted Shelf-Life (t90 at 25°C): {t90_days:.1f} days ({t90_years:.2f} years)")

inv_grid = np.linspace(inv_temp.min() * 0.99, 1.0 / 298.15, 100)
fig, ax = plt.subplots(figsize=(7.4, 4.2))
ax.scatter(inv_temp * 1000.0, ln_k, color="#38bdf8", s=55, zorder=5, label="Accelerated Stability Data (40–70°C)")
ax.plot(inv_grid * 1000.0, slope * inv_grid + intercept, color="#10b981", linewidth=2.0, label="Arrhenius Regression Fit")
ax.scatter([1000.0 / 298.15], [np.log(k_25c)], color="#f59e0b", s=70, zorder=6, label=f"25°C Extrapolation (t90 = {t90_years:.2f} yr)")
ax.set_title("Arrhenius Plot: ln(k) vs 1/T for Shelf-Life Prediction")
ax.set_xlabel("1000 / T (K⁻¹)")
ax.set_ylabel("ln(k) [k in day⁻¹]")
ax.grid(True, linestyle="--", alpha=0.35)
ax.legend(fontsize=8)
plt.tight_layout()
plt.show()
`
      }
    ]
  },
  {
    id: 'equilibrium-sympy',
    name: 'Acid-Base & Equilibrium (SymPy)',
    description:
      'Symbolic ionization and Henderson-Hasselbalch derivation using SymPy paired with numeric pH speciation fraction curves.',
    recommendedPackages: ['sympy', 'numpy', 'matplotlib'],
    defaultActiveFile: 'main.py',
    files: [
      {
        path: 'main.py',
        content: `"""Symbolic Acid-Base Ionization & Speciation Curves with SymPy."""
import sympy as sp
import numpy as np
import matplotlib.pyplot as plt

# 1. Symbolic Henderson-Hasselbalch & fraction unionized for Aspirin (weak acid, pKa = 3.5)
pH_sym, pKa_sym = sp.symbols("pH pKa", real=True)
ratio_ionized_to_unionized = 10 ** (pH_sym - pKa_sym)
alpha_unionized = sp.simplify(1 / (1 + ratio_ionized_to_unionized))
alpha_ionized = sp.simplify(1 - alpha_unionized)

print("Symbolic unionized fraction f_HA =", alpha_unionized)
print("Symbolic ionized fraction f_A-    =", alpha_ionized)

for label, ph_val in [("Gastric Juice (pH 1.5)", 1.5), ("Duodenum (pH 5.5)", 5.5), ("Plasma (pH 7.4)", 7.4)]:
    f_u = float(alpha_unionized.subs({pH_sym: ph_val, pKa_sym: 3.5}))
    print(f"{label:24s} -> Unionized: {f_u * 100:6.2f}% | Ionized: {(1 - f_u) * 100:6.2f}%")

# 2. Plot speciation across physiological pH 1..9
f_u_num = sp.lambdify((pH_sym, pKa_sym), alpha_unionized, "numpy")
ph_grid = np.linspace(1.0, 9.0, 200)
unionized_pct = f_u_num(ph_grid, 3.5) * 100.0
ionized_pct = 100.0 - unionized_pct

fig, ax = plt.subplots(figsize=(7.5, 4.0))
ax.plot(ph_grid, unionized_pct, label="Unionized Aspirin (HA - Membrane Permeable)", color="#10b981", linewidth=2.2)
ax.plot(ph_grid, ionized_pct, label="Ionized Salicylate (A-)", color="#38bdf8", linewidth=2.2)
ax.axvline(3.5, color="#f59e0b", linestyle="--", label="pKa = 3.5 (50% Ionized)")
ax.set_title("pH-Partition Speciation Profile of Aspirin (pKa = 3.5)")
ax.set_xlabel("Physiological pH")
ax.set_ylabel("Species Percentage (%)")
ax.set_ylim(-2, 104)
ax.grid(True, linestyle="--", alpha=0.35)
ax.legend()
plt.tight_layout()
plt.show()
`
      }
    ]
  },
  {
    id: 'blank-project',
    name: 'Blank Python Project',
    description: 'Clean minimal Python 3 workspace ready for custom scripts, modules, and datasets.',
    recommendedPackages: [],
    defaultActiveFile: 'main.py',
    files: [
      {
        path: 'main.py',
        content: `"""New Python Studio Project."""

def main():
    print("Python Studio runtime is ready.")


if __name__ == "__main__":
    main()
`
      }
    ]
  }
];
