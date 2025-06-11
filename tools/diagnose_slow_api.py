#!/usr/bin/env python3
"""
自动化诊断慢API脚本
专门用于排查 /simple-payroll/versions 等接口的极慢请求问题
"""

import time
import requests
import psycopg2
import logging
import json
import threading
from datetime import datetime
from typing import Dict, List, Any

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler(f'slow_api_diagnosis_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log'),
        logging.StreamHandler()
    ]
)

# 数据库配置
DB_CONFIG = {
    "dbname": "salary_system_v2",
    "user": "salary_system_v2",
    "password": "810705",
    "host": "10.10.10.16",
    "port": "5432"
}

# API配置
API_BASE_URL = "http://localhost:8080/v2"
TARGET_APIS = [
    "/simple-payroll/versions",
    "/simple-payroll/periods",
    "/simple-payroll/versions/55",
    "/simple-payroll/audit/summary/55"
]

class SlowAPIDiagnoser:
    def __init__(self):
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "api_tests": [],
            "db_analysis": {},
            "blocking_analysis": {},
            "recommendations": []
        }
        
    def run_diagnosis(self):
        """运行完整的诊断流程"""
        logging.info("=== 开始慢API诊断 ===")
        
        # 1. 测试API响应时间
        self.test_api_performance()
        
        # 2. 分析数据库状态
        self.analyze_database_state()
        
        # 3. 监控实时数据库活动
        self.monitor_db_activity_during_api_call()
        
        # 4. 分析阻塞点
        self.analyze_blocking_points()
        
        # 5. 生成建议
        self.generate_recommendations()
        
        # 6. 保存结果
        self.save_results()
        
        logging.info("=== 诊断完成 ===")
        
    def test_api_performance(self):
        """测试API性能"""
        logging.info("\n--- 测试API性能 ---")
        
        for api_path in TARGET_APIS:
            url = API_BASE_URL + api_path
            logging.info(f"测试: {url}")
            
            try:
                start_time = time.time()
                response = requests.get(url, timeout=120)
                elapsed = (time.time() - start_time) * 1000  # ms
                
                result = {
                    "url": url,
                    "status_code": response.status_code,
                    "elapsed_ms": elapsed,
                    "is_slow": elapsed > 5000,
                    "timestamp": datetime.now().isoformat()
                }
                
                if elapsed > 5000:
                    logging.warning(f"⚠️ 慢请求检测: {url} - {elapsed:.2f}ms")
                else:
                    logging.info(f"✓ 正常响应: {url} - {elapsed:.2f}ms")
                    
                self.results["api_tests"].append(result)
                
            except requests.exceptions.Timeout:
                logging.error(f"❌ 请求超时: {url}")
                self.results["api_tests"].append({
                    "url": url,
                    "status_code": -1,
                    "elapsed_ms": 120000,
                    "is_slow": True,
                    "error": "Timeout",
                    "timestamp": datetime.now().isoformat()
                })
            except Exception as e:
                logging.error(f"❌ 请求失败: {url} - {str(e)}")
                self.results["api_tests"].append({
                    "url": url,
                    "status_code": -1,
                    "elapsed_ms": -1,
                    "is_slow": True,
                    "error": str(e),
                    "timestamp": datetime.now().isoformat()
                })
                
    def analyze_database_state(self):
        """分析数据库状态"""
        logging.info("\n--- 分析数据库状态 ---")
        
        try:
            conn = psycopg2.connect(**DB_CONFIG)
            cur = conn.cursor()
            
            # 1. 检查活跃连接数
            cur.execute("""
                SELECT 
                    state,
                    COUNT(*) as count
                FROM pg_stat_activity
                GROUP BY state
                ORDER BY count DESC
            """)
            connection_stats = cur.fetchall()
            
            # 2. 检查长时间运行的查询
            cur.execute("""
                SELECT 
                    pid,
                    usename,
                    state,
                    query,
                    now() - query_start AS duration,
                    wait_event
                FROM pg_stat_activity
                WHERE state != 'idle'
                    AND now() - query_start > interval '5 seconds'
                ORDER BY duration DESC
                LIMIT 10
            """)
            slow_queries = cur.fetchall()
            
            # 3. 检查锁等待
            cur.execute("""
                SELECT 
                    blocked_locks.pid AS blocked_pid,
                    blocked_activity.usename AS blocked_user,
                    blocking_locks.pid AS blocking_pid,
                    blocking_activity.usename AS blocking_user,
                    blocked_activity.query AS blocked_statement,
                    blocking_activity.query AS blocking_statement
                FROM pg_catalog.pg_locks blocked_locks
                JOIN pg_catalog.pg_stat_activity blocked_activity 
                    ON blocked_activity.pid = blocked_locks.pid
                JOIN pg_catalog.pg_locks blocking_locks 
                    ON blocking_locks.locktype = blocked_locks.locktype
                    AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
                    AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
                    AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
                    AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
                    AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
                    AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
                    AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
                    AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
                    AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
                    AND blocking_locks.pid != blocked_locks.pid
                JOIN pg_catalog.pg_stat_activity blocking_activity 
                    ON blocking_activity.pid = blocking_locks.pid
                WHERE NOT blocked_locks.granted
            """)
            lock_waits = cur.fetchall()
            
            # 4. 检查表膨胀
            cur.execute("""
                SELECT 
                    schemaname,
                    tablename,
                    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
                    n_live_tup,
                    n_dead_tup,
                    CASE WHEN n_live_tup > 0 
                        THEN round(100.0 * n_dead_tup / n_live_tup, 2) 
                        ELSE 0 
                    END AS dead_ratio
                FROM pg_stat_user_tables
                WHERE schemaname IN ('payroll', 'hr', 'config')
                    AND n_dead_tup > 1000
                ORDER BY n_dead_tup DESC
                LIMIT 10
            """)
            table_bloat = cur.fetchall()
            
            self.results["db_analysis"] = {
                "connection_stats": [{"state": row[0], "count": row[1]} for row in connection_stats],
                "slow_queries": [{
                    "pid": row[0],
                    "user": row[1],
                    "state": row[2],
                    "query": row[3][:100] + "..." if len(row[3]) > 100 else row[3],
                    "duration_seconds": row[4].total_seconds() if row[4] else 0,
                    "wait_event": row[5]
                } for row in slow_queries],
                "lock_waits": [{
                    "blocked_pid": row[0],
                    "blocked_user": row[1],
                    "blocking_pid": row[2],
                    "blocking_user": row[3],
                    "blocked_query": row[4][:100] + "..." if len(row[4]) > 100 else row[4],
                    "blocking_query": row[5][:100] + "..." if len(row[5]) > 100 else row[5]
                } for row in lock_waits],
                "table_bloat": [{
                    "schema": row[0],
                    "table": row[1],
                    "size": row[2],
                    "live_tuples": row[3],
                    "dead_tuples": row[4],
                    "dead_ratio": float(row[5])
                } for row in table_bloat]
            }
            
            # 分析结果
            total_connections = sum(stat["count"] for stat in self.results["db_analysis"]["connection_stats"])
            active_connections = next((stat["count"] for stat in self.results["db_analysis"]["connection_stats"] 
                                     if stat["state"] == "active"), 0)
            idle_in_transaction = next((stat["count"] for stat in self.results["db_analysis"]["connection_stats"] 
                                      if stat["state"] == "idle in transaction"), 0)
            
            logging.info(f"总连接数: {total_connections}, 活跃: {active_connections}, 空闲事务: {idle_in_transaction}")
            
            if idle_in_transaction > 5:
                logging.warning(f"⚠️ 发现大量空闲事务连接: {idle_in_transaction}")
                
            if len(slow_queries) > 0:
                logging.warning(f"⚠️ 发现 {len(slow_queries)} 个慢查询")
                
            if len(lock_waits) > 0:
                logging.warning(f"⚠️ 发现 {len(lock_waits)} 个锁等待")
                
            cur.close()
            conn.close()
            
        except Exception as e:
            logging.error(f"数据库分析失败: {str(e)}")
            self.results["db_analysis"]["error"] = str(e)
            
    def monitor_db_activity_during_api_call(self):
        """在API调用期间监控数据库活动"""
        logging.info("\n--- 监控API调用期间的数据库活动 ---")
        
        # 选择一个慢API进行监控
        target_api = "/simple-payroll/versions"
        url = API_BASE_URL + target_api
        
        db_activities = []
        monitoring = True
        
        def monitor_db():
            """监控数据库活动的线程函数"""
            try:
                conn = psycopg2.connect(**DB_CONFIG)
                cur = conn.cursor()
                
                while monitoring:
                    cur.execute("""
                        SELECT 
                            now() as snapshot_time,
                            COUNT(*) FILTER (WHERE state = 'active') as active_queries,
                            COUNT(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction,
                            COUNT(*) FILTER (WHERE state != 'idle' AND now() - query_start > interval '1 second') as slow_queries,
                            array_agg(
                                CASE 
                                    WHEN state != 'idle' AND now() - query_start > interval '1 second' 
                                    THEN jsonb_build_object(
                                        'pid', pid,
                                        'duration', extract(epoch from (now() - query_start)),
                                        'query', left(query, 100),
                                        'wait_event', wait_event
                                    )
                                    ELSE NULL
                                END
                            ) FILTER (WHERE state != 'idle' AND now() - query_start > interval '1 second') as slow_query_details
                        FROM pg_stat_activity
                        WHERE pid != pg_backend_pid()
                    """)
                    
                    result = cur.fetchone()
                    db_activities.append({
                        "timestamp": result[0].isoformat(),
                        "active_queries": result[1],
                        "idle_in_transaction": result[2],
                        "slow_queries": result[3],
                        "slow_query_details": result[4] if result[4] else []
                    })
                    
                    time.sleep(0.5)  # 每500ms采样一次
                    
                cur.close()
                conn.close()
                
            except Exception as e:
                logging.error(f"数据库监控失败: {str(e)}")
                
        # 启动监控线程
        monitor_thread = threading.Thread(target=monitor_db)
        monitor_thread.start()
        
        # 调用API
        logging.info(f"开始调用API并监控数据库: {url}")
        try:
            start_time = time.time()
            response = requests.get(url, timeout=120)
            elapsed = (time.time() - start_time) * 1000
            
            logging.info(f"API响应完成: {elapsed:.2f}ms")
            
        except Exception as e:
            logging.error(f"API调用失败: {str(e)}")
            
        finally:
            # 停止监控
            monitoring = False
            monitor_thread.join(timeout=2)
            
        # 分析监控数据
        if db_activities:
            max_active = max(activity["active_queries"] for activity in db_activities)
            max_idle_transaction = max(activity["idle_in_transaction"] for activity in db_activities)
            max_slow_queries = max(activity["slow_queries"] for activity in db_activities)
            
            self.results["blocking_analysis"]["db_monitoring"] = {
                "samples": len(db_activities),
                "max_active_queries": max_active,
                "max_idle_in_transaction": max_idle_transaction,
                "max_slow_queries": max_slow_queries,
                "timeline": db_activities[:20]  # 保存前20个样本
            }
            
            logging.info(f"监控期间最大活跃查询: {max_active}, 最大空闲事务: {max_idle_transaction}, 最大慢查询: {max_slow_queries}")
            
    def analyze_blocking_points(self):
        """分析潜在的阻塞点"""
        logging.info("\n--- 分析潜在阻塞点 ---")
        
        blocking_patterns = []
        
        # 1. 检查是否有大量数据需要处理
        try:
            conn = psycopg2.connect(**DB_CONFIG)
            cur = conn.cursor()
            
            # 检查工资条目数量
            cur.execute("""
                SELECT
                    pr.id as run_id,
                    pr.payroll_period_id,
                    pp.name as period_name,
                    COUNT(pe.id) as entry_count
                FROM payroll.payroll_runs pr
                JOIN payroll.payroll_periods pp ON pr.payroll_period_id = pp.id
                LEFT JOIN payroll.payroll_entries pe ON pe.payroll_run_id = pr.id
                GROUP BY pr.id, pr.payroll_period_id, pp.name
                ORDER BY entry_count DESC
                LIMIT 10
            """)
            
            large_runs = cur.fetchall()
            
            # 检查审核规则数量
            cur.execute("""
                SELECT COUNT(*) as rule_count
                FROM payroll.audit_rule_configurations
                WHERE is_enabled = true
            """)
            
            rule_count = cur.fetchone()[0]
            
            # 检查缓存表状态
            cur.execute("""
                SELECT 
                    COUNT(*) as cached_summaries,
                    COUNT(*) FILTER (WHERE audit_completed_at IS NOT NULL) as completed_summaries
                FROM payroll.payroll_run_audit_summary
            """)
            
            cache_stats = cur.fetchone()
            
            blocking_patterns.append({
                "type": "data_volume",
                "large_payroll_runs": [{
                    "run_id": row[0],
                    "period_id": row[1],
                    "period_name": row[2],
                    "entry_count": row[3]
                } for row in large_runs],
                "enabled_audit_rules": rule_count,
                "cache_stats": {
                    "total_cached": cache_stats[0],
                    "completed": cache_stats[1]
                }
            })
            
            # 分析结果
            for run in large_runs:
                if run[3] > 1000:  # 超过1000条记录
                    logging.warning(f"⚠️ 大数据量工资运行: ID={run[0]}, 条目数={run[3]}")
                    
            if rule_count > 10:
                logging.warning(f"⚠️ 启用的审核规则过多: {rule_count}")
                
            cur.close()
            conn.close()
            
        except Exception as e:
            logging.error(f"阻塞点分析失败: {str(e)}")
            blocking_patterns.append({"type": "error", "message": str(e)})
            
        self.results["blocking_analysis"]["patterns"] = blocking_patterns
        
    def generate_recommendations(self):
        """生成优化建议"""
        logging.info("\n--- 生成优化建议 ---")
        
        recommendations = []
        
        # 基于API测试结果
        slow_apis = [api for api in self.results["api_tests"] if api.get("is_slow", False)]
        if slow_apis:
            recommendations.append({
                "category": "API性能",
                "severity": "high",
                "issue": f"发现 {len(slow_apis)} 个慢API",
                "suggestion": "检查这些API的具体实现，特别是数据库查询和缓存逻辑"
            })
            
        # 基于数据库分析
        db_analysis = self.results.get("db_analysis", {})
        
        # 空闲事务检查
        idle_in_transaction = next((stat["count"] for stat in db_analysis.get("connection_stats", []) 
                                  if stat["state"] == "idle in transaction"), 0)
        if idle_in_transaction > 5:
            recommendations.append({
                "category": "数据库连接",
                "severity": "high",
                "issue": f"发现 {idle_in_transaction} 个空闲事务连接",
                "suggestion": "检查后端代码是否正确关闭事务，确保使用try-finally或with语句管理数据库连接"
            })
            
        # 慢查询检查
        slow_queries = db_analysis.get("slow_queries", [])
        if len(slow_queries) > 0:
            recommendations.append({
                "category": "数据库查询",
                "severity": "high",
                "issue": f"发现 {len(slow_queries)} 个慢查询",
                "suggestion": "优化这些慢查询，考虑添加索引或使用更高效的查询方式"
            })
            
        # 锁等待检查
        lock_waits = db_analysis.get("lock_waits", [])
        if len(lock_waits) > 0:
            recommendations.append({
                "category": "数据库锁",
                "severity": "critical",
                "issue": f"发现 {len(lock_waits)} 个锁等待",
                "suggestion": "检查是否有长事务或死锁，优化事务处理逻辑"
            })
            
        # 表膨胀检查
        table_bloat = db_analysis.get("table_bloat", [])
        for table in table_bloat:
            if table["dead_ratio"] > 20:
                recommendations.append({
                    "category": "数据库维护",
                    "severity": "medium",
                    "issue": f"表 {table['schema']}.{table['table']} 死元组比例过高: {table['dead_ratio']}%",
                    "suggestion": "运行 VACUUM ANALYZE 清理死元组，考虑调整 autovacuum 参数"
                })
                
        # 基于阻塞分析
        blocking_analysis = self.results.get("blocking_analysis", {})
        patterns = blocking_analysis.get("patterns", [])
        
        for pattern in patterns:
            if pattern.get("type") == "data_volume":
                large_runs = pattern.get("large_payroll_runs", [])
                for run in large_runs:
                    if run["entry_count"] > 1000:
                        recommendations.append({
                            "category": "数据量",
                            "severity": "medium",
                            "issue": f"工资运行 {run['run_id']} 包含 {run['entry_count']} 条记录",
                            "suggestion": "考虑分批处理或使用异步任务队列处理大数据量"
                        })
                        
                if pattern.get("enabled_audit_rules", 0) > 10:
                    recommendations.append({
                        "category": "审核规则",
                        "severity": "medium",
                        "issue": f"启用了 {pattern['enabled_audit_rules']} 条审核规则",
                        "suggestion": "优化审核规则执行逻辑，考虑并行处理或缓存优化"
                    })
                    
        # 基于监控数据
        db_monitoring = blocking_analysis.get("db_monitoring", {})
        if db_monitoring.get("max_idle_in_transaction", 0) > 10:
            recommendations.append({
                "category": "并发控制",
                "severity": "high",
                "issue": f"API调用期间最大空闲事务数达到 {db_monitoring['max_idle_in_transaction']}",
                "suggestion": "优化事务管理，减少事务持有时间，考虑使用连接池配置限制"
            })
            
        self.results["recommendations"] = recommendations
        
        # 打印建议
        logging.info("\n=== 优化建议 ===")
        for rec in recommendations:
            logging.info(f"[{rec['severity'].upper()}] {rec['category']}: {rec['issue']}")
            logging.info(f"  建议: {rec['suggestion']}")
            
    def save_results(self):
        """保存诊断结果"""
        filename = f"slow_api_diagnosis_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(self.results, f, ensure_ascii=False, indent=2, default=str)
            
        logging.info(f"\n诊断结果已保存到: {filename}")
        
        # 生成简要报告
        self.generate_summary_report()
        
    def generate_summary_report(self):
        """生成简要报告"""
        report_lines = [
            "=== 慢API诊断报告摘要 ===",
            f"诊断时间: {self.results['timestamp']}",
            "",
            "1. API性能测试结果:"
        ]
        
        for api_test in self.results["api_tests"]:
            status = "❌ 慢" if api_test.get("is_slow") else "✓ 正常"
            report_lines.append(f"   {status} {api_test['url']} - {api_test.get('elapsed_ms', -1):.2f}ms")
            
        report_lines.extend([
            "",
            "2. 数据库状态:"
        ])
        
        db_analysis = self.results.get("db_analysis", {})
        if "connection_stats" in db_analysis:
            for stat in db_analysis["connection_stats"]:
                report_lines.append(f"   {stat['state']}: {stat['count']}")
                
        report_lines.extend([
            "",
            "3. 主要问题:"
        ])
        
        for i, rec in enumerate(self.results.get("recommendations", []), 1):
            if rec["severity"] in ["high", "critical"]:
                report_lines.append(f"   {i}. [{rec['severity'].upper()}] {rec['issue']}")
                
        report_lines.extend([
            "",
            "详细结果请查看JSON文件"
        ])
        
        summary_filename = f"slow_api_diagnosis_summary_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
        with open(summary_filename, 'w', encoding='utf-8') as f:
            f.write('\n'.join(report_lines))
            
        logging.info(f"摘要报告已保存到: {summary_filename}")


if __name__ == "__main__":
    diagnoser = SlowAPIDiagnoser()
    diagnoser.run_diagnosis()