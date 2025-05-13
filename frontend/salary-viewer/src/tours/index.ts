import { SALARY_DATA_VIEWER_TOUR } from './SalaryDataViewerTour';
import { FILE_CONVERTER_TOUR } from './FileConverterTour';
import { MAPPING_CONFIGURATOR_TOUR } from './MappingConfiguratorTour';

// 导出所有引导配置
export const TOURS = {
  SALARY_DATA_VIEWER: SALARY_DATA_VIEWER_TOUR,
  FILE_CONVERTER: FILE_CONVERTER_TOUR,
  MAPPING_CONFIGURATOR: MAPPING_CONFIGURATOR_TOUR,
};

// 导出各个引导配置
export * from './SalaryDataViewerTour';
export * from './FileConverterTour';
export * from './MappingConfiguratorTour';
