#!/usr/bin/env python3
"""
预设分组API测试脚本
测试所有分组相关的API端点功能
"""

import asyncio
import json
import sys
import os
from typing import Optional, Dict, Any
from datetime import datetime

# 添加项目根目录到 Python 路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from database import get_db_v2
from models.reports import ReportUserPreferenceGroup, ReportUserPreference
from models.security import User
from pydantic_models.user_preferences import (
    PresetGroupCreate,
    PresetGroupUpdate,
    PresetGroupReorderRequest
)
from routers.config.user_preferences_router import (
    get_preset_groups,
    create_preset_group,
    update_preset_group,
    delete_preset_group,
    get_preset_groups_stats,
    reorder_preset_groups
)

class MockUser:
    """模拟用户类用于测试"""
    def __init__(self, user_id: int = 1, username: str = "test_user"):
        self.id = user_id
        self.username = username

class APITester:
    def __init__(self):
        self.db: Session = next(get_db_v2())
        self.test_user = MockUser()
        self.created_group_ids = []
        
    def cleanup(self):
        """清理测试数据"""
        try:
            # 删除测试创建的分组
            for group_id in self.created_group_ids:
                group = self.db.query(ReportUserPreferenceGroup).filter(
                    ReportUserPreferenceGroup.id == group_id
                ).first()
                if group:
                    self.db.delete(group)
            
            self.db.commit()
            print("✅ 测试数据清理完成")
        except Exception as e:
            print(f"❌ 清理测试数据失败: {e}")
            self.db.rollback()
        finally:
            self.db.close()

    async def test_create_group(self) -> Optional[int]:
        """测试创建分组"""
        print("\n🧪 测试创建分组...")
        
        try:
            group_data = PresetGroupCreate(
                name="测试分组1",
                description="这是一个测试分组",
                color="#1890ff",
                icon="FolderOutlined",
                sort_order=0,
                is_active=True
            )
            
            result = await create_preset_group(group_data, self.db, self.test_user)
            
            assert result.name == "测试分组1"
            assert result.description == "这是一个测试分组"
            assert result.color == "#1890ff"
            assert result.icon == "FolderOutlined"
            assert result.user_id == self.test_user.id
            
            self.created_group_ids.append(result.id)
            print(f"✅ 创建分组成功，ID: {result.id}")
            return result.id
            
        except Exception as e:
            print(f"❌ 创建分组失败: {e}")
            return None

    async def test_create_duplicate_group(self):
        """测试创建重复名称分组"""
        print("\n🧪 测试创建重复名称分组...")
        
        try:
            group_data = PresetGroupCreate(
                name="测试分组1",  # 与已存在的分组同名
                description="重复名称测试",
                color="#ff0000",
                icon="AppstoreOutlined"
            )
            
            result = await create_preset_group(group_data, self.db, self.test_user)
            print("❌ 应该抛出异常但没有抛出")
            
        except Exception as e:
            if "已存在" in str(e):
                print("✅ 正确检测到重复名称并抛出异常")
            else:
                print(f"❌ 抛出了意外的异常: {e}")

    async def test_get_groups(self):
        """测试获取分组列表"""
        print("\n🧪 测试获取分组列表...")
        
        try:
            result = await get_preset_groups(self.db, self.test_user)
            
            assert result.total >= 1
            assert len(result.groups) >= 1
            
            # 检查是否包含我们创建的分组
            test_group = next((g for g in result.groups if g.name == "测试分组1"), None)
            assert test_group is not None
            
            print(f"✅ 获取分组列表成功，共 {result.total} 个分组")
            
        except Exception as e:
            print(f"❌ 获取分组列表失败: {e}")

    async def test_update_group(self, group_id: int):
        """测试更新分组"""
        print("\n🧪 测试更新分组...")
        
        try:
            update_data = PresetGroupUpdate(
                name="测试分组1-已更新",
                description="更新后的描述",
                color="#52c41a",
                icon="SettingOutlined"
            )
            
            result = await update_preset_group(group_id, update_data, self.db, self.test_user)
            
            assert result.name == "测试分组1-已更新"
            assert result.description == "更新后的描述"
            assert result.color == "#52c41a"
            assert result.icon == "SettingOutlined"
            
            print("✅ 更新分组成功")
            
        except Exception as e:
            print(f"❌ 更新分组失败: {e}")

    async def test_create_second_group(self) -> Optional[int]:
        """创建第二个分组用于测试排序"""
        print("\n🧪 创建第二个分组...")
        
        try:
            group_data = PresetGroupCreate(
                name="测试分组2",
                description="第二个测试分组",
                color="#722ed1",
                icon="TeamOutlined",
                sort_order=1
            )
            
            result = await create_preset_group(group_data, self.db, self.test_user)
            self.created_group_ids.append(result.id)
            print(f"✅ 创建第二个分组成功，ID: {result.id}")
            return result.id
            
        except Exception as e:
            print(f"❌ 创建第二个分组失败: {e}")
            return None

    async def test_reorder_groups(self, group_id1: int, group_id2: int):
        """测试重新排序分组"""
        print("\n🧪 测试重新排序分组...")
        
        try:
            # 交换顺序
            reorder_data = PresetGroupReorderRequest(
                group_ids=[group_id2, group_id1]  # 颠倒顺序
            )
            
            result = await reorder_preset_groups(reorder_data, self.db, self.test_user)
            
            # 验证排序是否生效
            groups_result = await get_preset_groups(self.db, self.test_user)
            groups = groups_result.groups
            
            # 找到两个测试分组并验证顺序
            group1 = next((g for g in groups if g.id == group_id1), None)
            group2 = next((g for g in groups if g.id == group_id2), None)
            
            assert group1 is not None and group2 is not None
            assert group2.sort_order < group1.sort_order  # group2应该排在前面
            
            print("✅ 重新排序分组成功")
            
        except Exception as e:
            print(f"❌ 重新排序分组失败: {e}")

    async def test_get_stats(self):
        """测试获取分组统计"""
        print("\n🧪 测试获取分组统计...")
        
        try:
            result = await get_preset_groups_stats(self.db, self.test_user)
            
            assert isinstance(result, list)
            assert len(result) >= 2  # 至少有两个测试分组
            
            print(f"✅ 获取分组统计成功，共 {len(result)} 个分组的统计信息")
            
            # 打印统计详情
            for stat in result:
                print(f"   分组ID: {stat.group_id}, 预设数量: {stat.preset_count}")
            
        except Exception as e:
            print(f"❌ 获取分组统计失败: {e}")

    async def test_delete_group_with_presets(self, group_id: int):
        """测试删除有关联预设的分组（应该失败）"""
        print("\n🧪 测试删除有关联预设的分组...")
        
        try:
            # 先创建一个关联的预设
            preference_config = {
                "name": "测试预设",
                "category": "测试分组1-已更新",  # 关联到第一个分组
                "filter_config": {},
                "column_settings": {},
                "table_filter_state": {},
                "is_default": False,
                "is_public": False,
                "usage_count": 0
            }
            
            preset = ReportUserPreference(
                user_id=self.test_user.id,
                preference_type="payroll_data_modal_preset",
                object_type="payroll_data_modal",
                preference_config=preference_config
            )
            
            self.db.add(preset)
            self.db.commit()
            
            # 尝试删除分组（应该失败）
            await delete_preset_group(group_id, self.db, self.test_user)
            print("❌ 应该抛出异常但没有抛出")
            
        except Exception as e:
            if "个预设使用此分组" in str(e):
                print("✅ 正确检测到关联预设并阻止删除")
                
                # 清理测试预设
                self.db.delete(preset)
                self.db.commit()
            else:
                print(f"❌ 抛出了意外的异常: {e}")

    async def test_delete_group(self, group_id: int):
        """测试删除分组"""
        print(f"\n🧪 测试删除分组 {group_id}...")
        
        try:
            result = await delete_preset_group(group_id, self.db, self.test_user)
            
            # 验证分组是否真的被删除
            deleted_group = self.db.query(ReportUserPreferenceGroup).filter(
                ReportUserPreferenceGroup.id == group_id
            ).first()
            
            assert deleted_group is None
            
            # 从记录中移除
            if group_id in self.created_group_ids:
                self.created_group_ids.remove(group_id)
            
            print("✅ 删除分组成功")
            
        except Exception as e:
            print(f"❌ 删除分组失败: {e}")

    async def test_update_nonexistent_group(self):
        """测试更新不存在的分组"""
        print("\n🧪 测试更新不存在的分组...")
        
        try:
            update_data = PresetGroupUpdate(name="不存在的分组")
            result = await update_preset_group(99999, update_data, self.db, self.test_user)
            print("❌ 应该抛出异常但没有抛出")
            
        except Exception as e:
            if "不存在或无权限访问" in str(e):
                print("✅ 正确检测到分组不存在并抛出异常")
            else:
                print(f"❌ 抛出了意外的异常: {e}")

    async def run_all_tests(self):
        """运行所有测试"""
        print("🚀 开始测试预设分组API...")
        
        try:
            # 1. 测试创建分组
            group_id1 = await self.test_create_group()
            if not group_id1:
                return
            
            # 2. 测试创建重复名称分组
            await self.test_create_duplicate_group()
            
            # 3. 测试获取分组列表
            await self.test_get_groups()
            
            # 4. 测试更新分组
            await self.test_update_group(group_id1)
            
            # 5. 创建第二个分组
            group_id2 = await self.test_create_second_group()
            if not group_id2:
                return
            
            # 6. 测试重新排序
            await self.test_reorder_groups(group_id1, group_id2)
            
            # 7. 测试获取统计信息
            await self.test_get_stats()
            
            # 8. 测试删除有关联预设的分组
            await self.test_delete_group_with_presets(group_id1)
            
            # 9. 测试更新不存在的分组
            await self.test_update_nonexistent_group()
            
            # 10. 测试删除分组
            await self.test_delete_group(group_id1)
            await self.test_delete_group(group_id2)
            
            print("\n🎉 所有测试完成！")
            
        except Exception as e:
            print(f"\n💥 测试过程中发生错误: {e}")
        
        finally:
            self.cleanup()

async def main():
    """主函数"""
    tester = APITester()
    await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())