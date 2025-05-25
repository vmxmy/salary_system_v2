import subprocess
import socket
import os
import sys
from pathlib import Path
import time

# 脚本所在的目录 (应该是 webapp/)
WEBAPP_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = WEBAPP_DIR.parent # 确保 PROJECT_ROOT 在全局作用域定义

LOG_FILE = WEBAPP_DIR / "backend.log"
MAIN_PY_PATH = WEBAPP_DIR / "main.py" # 后端主程序
PORT = 8080
HOST = "0.0.0.0" # 通常Uvicorn会监听的地址

def get_process_using_port(port: int) -> tuple[int, str]:
    """使用 lsof 命令获取使用指定端口的进程信息"""
    try:
        # 使用 lsof 命令查找使用指定端口的进程
        result = subprocess.run(
            ['lsof', '-i', f':{port}'],
            capture_output=True,
            text=True
        )
        if result.returncode == 0 and result.stdout:
            # 输出第二行（第一行是表头）
            lines = result.stdout.strip().split('\n')
            if len(lines) > 1:
                # 解析 lsof 输出
                process_info = lines[1].split()
                if len(process_info) > 1:
                    return int(process_info[1]), process_info[0]
    except Exception as e:
        print(f"⚠️  获取进程信息时发生错误: {e}")
    return None, None

def is_port_in_use(port: int, host: str) -> bool:
    """检查指定的端口和主机是否已被占用"""
    s = None
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(1) # 设置一个短暂的超时，以防主机不响应
        s.bind((host, port))
        return False  # 端口可用
    except OSError as e:
        # errno 98 (EADDRINUSE) on Linux, errno 48 on macOS
        # WSAEADDRINUSE (10048) on Windows
        if e.errno in [socket.errno.EADDRINUSE, 48, 10048]: # socket.errno.EADDRINUSE 在 Windows 上不存在，所以直接用数字
            pid, proc_name = get_process_using_port(port)
            if pid:
                print(f"❌ 错误: 端口 {port} 已被进程 {proc_name} (PID: {pid}) 占用。")
                print(f"   要继续，请先终止该进程: kill {pid}")
            else:
                print(f"❌ 错误: 端口 {port} 已被占用，但无法确定具体进程。")
                print(f"   请尝试使用命令查看: lsof -i :{port}")
            return True # 端口已被占用
        print(f"⚠️  发生意外的套接字错误: {e}") # 其他错误
        return True # 假设端口不可用以策安全
    except Exception as e:
        print(f"⚠️  检查端口时发生未知错误: {e}")
        return True # 假设端口不可用以策安全
    finally:
        if s:
            s.close()

def main():
    print(f"ℹ️  正在检查端口 {HOST}:{PORT} 是否被占用...")
    if is_port_in_use(PORT, HOST):
        return

    print(f"✅ 端口 {PORT} 可用。")
    
    if not MAIN_PY_PATH.exists():
        print(f"❌ 错误: 后端主程序 {MAIN_PY_PATH} 未找到。无法启动后端服务。")
        return

    print(f"🚀 正在尝试后台启动后端服务...")
    print(f"🪵 日志将被写入: {LOG_FILE}")

    # 构建启动命令 - 使用 python -m 方式执行 webapp.main
    command = [
        sys.executable,  # python 解释器路径
        "-m",           # 以模块方式执行
        "uvicorn",      # 使用 uvicorn
        "webapp.main:app", # 应用模块路径
        "--host",       # 主机参数
        "0.0.0.0",     # 主机值
        "--port",       # 端口参数
        "8080",        # 端口值
        "--reload"      # 启用热重载
    ]

    try:
        # 以写入模式打开日志文件 (每次启动会覆盖旧日志)
        # 如果希望追加日志，请使用 'ab' 或 'a' (文本模式)
        with open(LOG_FILE, 'wb') as log_f:
            process_options = {
                'stdout': log_f,
                'stderr': log_f,
                'cwd': str(PROJECT_ROOT), # 使用全局定义的 PROJECT_ROOT
                'close_fds': True # 在 Posix 上，关闭除 stdin/stdout/stderr 之外的继承文件描述符
            }

            if os.name == 'posix':
                # 在Unix-like系统上，创建一个新的会话使其与当前终端分离
                process_options['start_new_session'] = True
            elif os.name == 'nt':
                # 在Windows上，使用这些标志来分离进程并且不创建控制台窗口
                DETACHED_PROCESS = 0x00000008
                CREATE_NEW_PROCESS_GROUP = 0x00000200
                process_options['creationflags'] = DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP
            
            # 启动子进程
            process = subprocess.Popen(command, **process_options)
            
            time.sleep(2) # 短暂等待，让子进程有机会启动或失败

            if process.poll() is None:
                 print(f"✅ 后端服务已作为进程 PID: {process.pid} 启动。")
                 print(f"   请检查 {LOG_FILE} 获取详细日志和状态。")
                 print(f"💡 注意: 要停止此后台服务，你可能需要手动查找并终止该进程 (例如使用 'kill {process.pid}' 或任务管理器)。")
            else:
                print(f"❌ 后端服务启动后立即退出，退出码: {process.poll()}。")
                print(f"   请检查 {LOG_FILE} 获取错误详情。")

    except Exception as e:
        error_message = f"❌ 启动后端服务时发生严重错误: {e}\n"
        print(error_message)
        try:
            # 尝试将启动脚本本身的错误也写入日志
            with open(LOG_FILE, 'ab') as log_f_err: # 追加模式
                 log_f_err.write(f"\n--- 启动脚本错误 ---\n{error_message}".encode('utf-8'))
        except Exception as log_e:
            print(f"   ⚠️  无法将启动错误写入日志文件: {log_e}")

if __name__ == "__main__":
    main() 