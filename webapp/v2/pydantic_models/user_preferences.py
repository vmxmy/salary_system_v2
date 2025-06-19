"""
用户偏好设置相关的Pydantic模型
"""
from typing import Dict, Any, Optional, List
from datetime import datetime
from pydantic import BaseModel, Field


class ColumnFilterConfig(BaseModel):
    """列筛选配置"""
    hideJsonbColumns: bool = Field(default=True, description="隐藏JSONB列")
    hideZeroColumns: bool = Field(default=True, description="隐藏全零列")
    hideEmptyColumns: bool = Field(default=True, description="隐藏空列")
    includePatterns: List[str] = Field(default_factory=list, description="包含模式")
    excludePatterns: List[str] = Field(default_factory=list, description="排除模式")
    minValueThreshold: float = Field(default=0, description="最小值阈值")
    maxValueThreshold: Optional[float] = Field(default=None, description="最大值阈值")
    showOnlyNumericColumns: bool = Field(default=False, description="只显示数值列")


class PayrollDataModalPresetBase(BaseModel):
    """工资数据模态框预设基础模型"""
    name: str = Field(..., min_length=1, max_length=100, description="预设名称")
    description: Optional[str] = Field(None, max_length=500, description="预设描述")
    category: Optional[str] = Field(None, max_length=50, description="预设分组/分类")
    filterConfig: ColumnFilterConfig = Field(..., description="列筛选配置")
    columnSettings: Dict[str, Any] = Field(default_factory=dict, description="列设置配置")
    tableFilterState: Optional[Dict[str, Any]] = Field(default_factory=dict, description="表头筛选状态")
    isDefault: bool = Field(default=False, description="是否为默认预设")
    isPublic: bool = Field(default=False, description="是否为公共预设")


class PayrollDataModalPresetCreate(PayrollDataModalPresetBase):
    """创建工资数据模态框预设"""
    pass


class PayrollDataModalPresetUpdate(BaseModel):
    """更新工资数据模态框预设"""
    name: Optional[str] = Field(None, min_length=1, max_length=100, description="预设名称")
    description: Optional[str] = Field(None, max_length=500, description="预设描述")
    category: Optional[str] = Field(None, max_length=50, description="预设分组/分类")
    filterConfig: Optional[ColumnFilterConfig] = Field(None, description="列筛选配置")
    columnSettings: Optional[Dict[str, Any]] = Field(None, description="列设置配置")
    tableFilterState: Optional[Dict[str, Any]] = Field(None, description="表头筛选状态")
    isDefault: Optional[bool] = Field(None, description="是否为默认预设")
    isPublic: Optional[bool] = Field(None, description="是否为公共预设")


class PayrollDataModalPresetResponse(PayrollDataModalPresetBase):
    """工资数据模态框预设响应"""
    id: int = Field(..., description="预设ID")
    usageCount: int = Field(default=0, description="使用次数")
    lastUsedAt: Optional[str] = Field(None, description="最后使用时间")
    createdAt: datetime = Field(..., description="创建时间")
    updatedAt: Optional[datetime] = Field(None, description="更新时间")

    class Config:
        from_attributes = True


class PayrollDataModalPresetList(BaseModel):
    """工资数据模态框预设列表"""
    presets: List[PayrollDataModalPresetResponse] = Field(..., description="预设列表")
    total: int = Field(..., description="总数量")


class PresetCategory(BaseModel):
    """预设分类"""
    code: str = Field(..., description="分类代码")
    name: str = Field(..., description="分类名称")
    description: Optional[str] = Field(None, description="分类描述")
    presetCount: int = Field(default=0, description="该分类下的预设数量")


class PresetSaveRequest(BaseModel):
    """保存预设请求"""
    name: str = Field(..., min_length=1, max_length=100, description="预设名称")
    description: Optional[str] = Field(None, max_length=500, description="预设描述")
    category: Optional[str] = Field(None, max_length=50, description="预设分组/分类")
    filterConfig: ColumnFilterConfig = Field(..., description="列筛选配置")
    columnSettings: Dict[str, Any] = Field(default_factory=dict, description="列设置配置")
    tableFilterState: Optional[Dict[str, Any]] = Field(default_factory=dict, description="表头筛选状态")
    isDefault: bool = Field(default=False, description="是否设为默认")
    isPublic: bool = Field(default=False, description="是否设为公共")


class PresetListResponse(BaseModel):
    """预设列表响应"""
    presets: List[PayrollDataModalPresetResponse] = Field(..., description="预设列表")
    categories: List[PresetCategory] = Field(default_factory=list, description="分类列表")
    total: int = Field(..., description="总数量")
    defaultPresetId: Optional[int] = Field(None, description="默认预设ID")


class PresetApplyRequest(BaseModel):
    """应用预设请求"""
    presetId: int = Field(..., description="预设ID")


class PresetDuplicateRequest(BaseModel):
    """复制预设请求"""
    newName: str = Field(..., min_length=1, max_length=100, description="新预设名称")
    description: Optional[str] = Field(None, max_length=500, description="新预设描述")
    category: Optional[str] = Field(None, max_length=50, description="预设分组/分类")


class PresetExportResponse(BaseModel):
    """预设导出响应"""
    fileName: str = Field(..., description="文件名")
    fileSize: int = Field(..., description="文件大小")
    downloadUrl: str = Field(..., description="下载链接")
    expiresAt: datetime = Field(..., description="过期时间")


class PresetImportRequest(BaseModel):
    """预设导入请求"""
    fileName: str = Field(..., description="文件名")
    fileContent: str = Field(..., description="文件内容（Base64编码）")
    overwriteExisting: bool = Field(default=False, description="是否覆盖已存在的预设")


class PresetImportResponse(BaseModel):
    """预设导入响应"""
    importedCount: int = Field(..., description="导入成功数量")
    skippedCount: int = Field(default=0, description="跳过数量")
    errorCount: int = Field(default=0, description="错误数量")
    errors: List[str] = Field(default_factory=list, description="错误信息列表")
    importedPresets: List[PayrollDataModalPresetResponse] = Field(
        default_factory=list, 
        description="导入的预设列表"
    )


# ===== 预设分组相关模型 =====

class PresetGroupBase(BaseModel):
    """预设分组基础模型"""
    name: str = Field(..., min_length=1, max_length=50, description="分组名称")
    description: Optional[str] = Field(None, max_length=200, description="分组描述")
    color: Optional[str] = Field(None, max_length=7, description="分组颜色(十六进制)")
    icon: Optional[str] = Field(None, max_length=50, description="分组图标")
    sort_order: int = Field(default=0, description="排序顺序")
    is_active: bool = Field(default=True, description="是否激活")


class PresetGroupCreate(PresetGroupBase):
    """创建预设分组"""
    pass


class PresetGroupUpdate(BaseModel):
    """更新预设分组"""
    name: Optional[str] = Field(None, min_length=1, max_length=50, description="分组名称")
    description: Optional[str] = Field(None, max_length=200, description="分组描述")
    color: Optional[str] = Field(None, max_length=7, description="分组颜色(十六进制)")
    icon: Optional[str] = Field(None, max_length=50, description="分组图标")
    sort_order: Optional[int] = Field(None, description="排序顺序")
    is_active: Optional[bool] = Field(None, description="是否激活")


class PresetGroupResponse(PresetGroupBase):
    """预设分组响应"""
    id: int = Field(..., description="分组ID")
    user_id: int = Field(..., description="用户ID")
    created_at: datetime = Field(..., description="创建时间")
    updated_at: datetime = Field(..., description="更新时间")

    class Config:
        from_attributes = True


class PresetGroupListResponse(BaseModel):
    """预设分组列表响应"""
    groups: List[PresetGroupResponse] = Field(..., description="分组列表")
    total: int = Field(..., description="总数量")


class PresetGroupStatsResponse(BaseModel):
    """预设分组统计响应"""
    group_id: int = Field(..., description="分组ID", alias="groupId")
    preset_count: int = Field(..., description="预设数量", alias="presetCount")
    last_used_at: Optional[datetime] = Field(None, description="最后使用时间", alias="lastUsedAt")

    class Config:
        populate_by_name = True


class PresetGroupReorderRequest(BaseModel):
    """预设分组重新排序请求"""
    group_ids: List[int] = Field(..., description="分组ID列表（按新顺序排列）", alias="groupIds")

    class Config:
        populate_by_name = True 