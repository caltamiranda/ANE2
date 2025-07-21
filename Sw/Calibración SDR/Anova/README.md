# 📈 ANOVA Device Comparison Script

This script analyzes signal samples from two devices using ANOVA (Analysis of Variance) and generates an Excel report comparing them.

---

## 📦 Installation (Linux)

```bash
python -m venv anova-venv      # Create virtual environment
source anova-venv/bin/activate # Activate the virtual environment
pip install -r requirements.txt

```

# ▶️ How to Run
```bash
python anova-script.py <folder-device1> <folder-device2>
```
- Replace `folder-device1` and `folder-device2` with the paths to the directories containing the JSON signal files for each device.


# 📊 What This Script Does

- Performs statistical analysis (ANOVA) on the signal samples.

- Expects multiple JSON files with signal data — the more signals, the more accurate the results.

- Generates an Excel file named: `device_differences_report.xlsx`
