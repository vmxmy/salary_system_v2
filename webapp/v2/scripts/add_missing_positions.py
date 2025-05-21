"""
添加批量导入员工时缺失的职位信息脚本。
"""
import sys
from pathlib import Path
from datetime import date
import logging
import os

# 设置路径，使得可以导入webapp包
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from sqlalchemy import create_engine, func
from sqlalchemy.orm import sessionmaker

from webapp.v2.database import DATABASE_URL_V2
from webapp.v2.models.hr import Position

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def main():
    # 连接数据库
    engine = create_engine(DATABASE_URL_V2)
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        # 需要添加的职位列表
        positions_to_add = [
            {"name": "五级管理岗位", "code": "GLG5", "description": "五级管理岗位", "is_active": True},
            {"name": "六级管理岗位", "code": "GLG6", "description": "六级管理岗位", "is_active": True},
            {"name": "七级管理岗位", "code": "GLG7", "description": "七级管理岗位", "is_active": True},
            {"name": "八级管理岗位", "code": "GLG8", "description": "八级管理岗位", "is_active": True},
            {"name": "技术工二级", "code": "JSG2", "description": "技术工二级", "is_active": True},
        ]
        
        # 获取当前日期作为生效日期
        today = date.today()
        
        added_count = 0
        skipped_count = 0
        
        # 添加职位
        for position_data in positions_to_add:
            # 检查职位是否已存在
            existing_position = session.query(Position).filter(
                func.lower(Position.name) == func.lower(position_data["name"])
            ).first()
            
            if existing_position:
                logger.info(f"职位 '{position_data['name']}' 已存在，跳过添加")
                skipped_count += 1
                continue
            
            # 创建新职位
            new_position = Position(
                code=position_data["code"],
                name=position_data["name"],
                description=position_data["description"],
                effective_date=today,
                is_active=position_data["is_active"]
            )
            
            session.add(new_position)
            added_count += 1
            logger.info(f"已添加职位: '{position_data['name']}'")
        
        # 提交事务
        session.commit()
        logger.info(f"成功添加 {added_count} 个职位，跳过 {skipped_count} 个已存在的职位")
        
    except Exception as e:
        session.rollback()
        logger.error(f"添加职位时发生错误: {str(e)}")
        raise
    finally:
        session.close()

if __name__ == "__main__":
    main()
    print("职位添加任务完成。现在可以重新尝试批量导入员工数据。") 