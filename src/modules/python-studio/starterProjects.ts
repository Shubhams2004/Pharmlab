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
