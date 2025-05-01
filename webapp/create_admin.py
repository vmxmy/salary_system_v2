    # --- 粘贴这里的代码 ---
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- 你需要修改这里 ---
username_to_create = 'admin'
password_to_hash = 'your_very_secure_password' # 替换成你的真实密码
    # --- 修改结束 ---

super_admin_role_id = 1 # 确认 Super Admin 的 ID

hashed_password = pwd_context.hash(password_to_hash)

print("-" * 20)
print(f"Username: {username_to_create}")
print(f"Hashed Password: {hashed_password}")
print("-" * 20)
print(f"Super Admin Role ID (Assumed): {super_admin_role_id}")
print("-" * 20)
print("SQL Insert Statement (Execute in your DB):")
print(f"INSERT INTO users (username, hashed_password, role_id, is_active) VALUES ('{username_to_create}', '{hashed_password}', {super_admin_role_id}, TRUE);")
print("-" * 20)
# --- 粘贴结束 ---