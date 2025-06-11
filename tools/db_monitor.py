import time
import psycopg2
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

DSN = "dbname=salary_system_v2 user=salary_system_v2 password=810705 host=10.10.10.16 port=5432"

def monitor():
    while True:
        try:
            conn = psycopg2.connect(DSN)
            cur = conn.cursor()
            # 活跃连接数
            cur.execute("SELECT count(*) FROM pg_stat_activity WHERE state = 'active';")
            active = cur.fetchone()[0]
            # 总连接数
            cur.execute("SELECT count(*) FROM pg_stat_activity;")
            total = cur.fetchone()[0]
            # 慢SQL
            cur.execute("""
                SELECT pid, query, now() - query_start AS duration
                FROM pg_stat_activity
                WHERE state != 'idle' AND now() - query_start > interval '5 seconds'
                ORDER BY duration DESC LIMIT 5;
            """)
            slow = cur.fetchall()
            logging.info(f"Active: {active}, Total: {total}, Slow: {slow}")
            cur.close()
            conn.close()
        except Exception as e:
            logging.error(f"DB monitor error: {e}")
        time.sleep(60)

if __name__ == "__main__":
    monitor()