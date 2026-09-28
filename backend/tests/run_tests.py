import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from tests.test_calculator import (
    test_fy24_25_new_regime_7lakh_zero_tax,
    test_fy24_25_old_vs_new_comparison,
    test_capital_gains_equity_fy24_25
)

def run():
    print("Running Tax Engine Tests...")
    test_fy24_25_new_regime_7lakh_zero_tax()
    print("✓ test_fy24_25_new_regime_7lakh_zero_tax passed.")
    test_fy24_25_old_vs_new_comparison()
    print("✓ test_fy24_25_old_vs_new_comparison passed.")
    test_capital_gains_equity_fy24_25()
    print("✓ test_capital_gains_equity_fy24_25 passed.")
    print("All Tax Engine tests passed successfully!")

if __name__ == "__main__":
    run()
