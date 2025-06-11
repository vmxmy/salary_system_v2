import requests
import time
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

API_LIST = [
    "/users/1",
    "/users",
    "/departments",
    "/departments/hierarchy",
    "/departments/tree",
    "/positions",
    "/personnel-categories",
    "/organization/overview",
    "/organization/distribution",
    "/lookup-values-public",
    "/lookup-types",
    "/payroll-periods",
    "/payroll-periods/1",
    "/payroll-runs",
    "/payroll-entries",
    "/payroll-component-definitions",
    "/payroll-component-definitions/1",
    "/health",
    # 可根据实际情况补充更多核心API
]
BASE_URL = "http://localhost:8080"  # 实际后端地址

def test_apis():
    for path in API_LIST:
        url = BASE_URL + path
        try:
            start = time.time()
            resp = requests.get(url, timeout=30)
            elapsed = (time.time() - start) * 1000
            logging.info(f"{url} - {resp.status_code} - {elapsed:.2f}ms")
        except Exception as e:
            logging.error(f"{url} - ERROR: {e}")

if __name__ == "__main__":
    test_apis()