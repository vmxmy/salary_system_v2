// 最小测试文件
export interface TestConfig {
  test: string;
}

export interface TestResult<T> {
  item: T;
}

export enum TestMode {
  TEST = 'test'
}

export class TestEngine {
  test() {
    return 'test';
  }
}

export const testFunction = () => {
  return 'test';
}; 