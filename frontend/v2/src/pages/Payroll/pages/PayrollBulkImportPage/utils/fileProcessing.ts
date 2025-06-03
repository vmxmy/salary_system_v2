// 智能CSV编码处理函数
export const handleEncodingIssues = (rawText: string, detectedEncoding: string): string => {
  try {
    // 不使用硬编码映射，而是通过提示用户和智能检测来处理
    
    // 1. 检查文本是否包含有效的CSV结构
    const hasValidStructure = rawText.includes(',') || rawText.includes('\t') || rawText.includes('\n');
    
    // 2. 检查是否包含明显的乱码字符
    const hasGarbledChars = /[À-ÿ]{2,}/.test(rawText) || rawText.includes('�');
    
    if (hasValidStructure && !hasGarbledChars) {
      // 文本结构正常，直接返回
      return rawText;
    }
    
    if (hasGarbledChars) {
      // 检测到乱码，建议用户重新保存文件
      console.log('⚠️ 检测到编码问题，建议用户转换文件编码');
      
      // 尝试基本的清理：移除明显的非文本字符
      let cleaned = rawText
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // 移除控制字符
        .replace(/�/g, '?'); // 替换替换字符
      
      return cleaned;
    }
    
    return rawText;
  } catch (error) {
    console.log('❌ 编码处理失败，返回原始文本');
    return rawText;
  }
};

// Excel文件类型验证
export const validateFileType = (file: File): boolean => {
  const validTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'text/csv' // .csv
  ];
  
  return validTypes.includes(file.type);
};

// CSV编码检测和处理
export const processCSVEncoding = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  
  // 智能编码检测和处理
  let csvText = '';
  let detectedEncoding = 'unknown';
  
  // 检测BOM (字节顺序标记)
  const hasBOM = uint8Array.length >= 3 && 
                uint8Array[0] === 0xEF && 
                uint8Array[1] === 0xBB && 
                uint8Array[2] === 0xBF;
  
  if (hasBOM) {
    // 检测到UTF-8 BOM，移除BOM后解码
    const withoutBOM = uint8Array.slice(3);
    csvText = new TextDecoder('utf-8').decode(withoutBOM);
    detectedEncoding = 'utf-8-bom';
    console.log('✅ 检测到UTF-8 BOM，使用UTF-8编码解析');
  } else {
    // 没有BOM，需要智能检测编码
    try {
      // 首先尝试UTF-8解码
      csvText = new TextDecoder('utf-8', { fatal: true }).decode(uint8Array);
      
      // 检查解码结果的质量
      const hasReplacementChars = csvText.includes('\uFFFD');
      const hasValidChineseChars = /[\u4e00-\u9fff]/.test(csvText);
      const hasCommonCsvStructure = csvText.includes(',') || csvText.includes('\n');
      
      if (hasReplacementChars) {
        throw new Error('UTF-8解码包含替换字符');
      }
      
      // 如果包含有效的中文字符或CSV结构，认为UTF-8解码成功
      if (hasValidChineseChars || hasCommonCsvStructure) {
        detectedEncoding = 'utf-8';
        console.log('✅ UTF-8编码解析成功');
      } else {
        // 可能是纯ASCII文件，但UTF-8解码成功
        detectedEncoding = 'utf-8';
        console.log('✅ 使用UTF-8编码解析（可能是ASCII文件）');
      }
    } catch (utf8Error) {
      console.log('⚠️ UTF-8解码失败，尝试处理GBK编码文件...');
      
      // UTF-8解码失败，可能是GBK编码
      // 使用Latin-1作为中介来保持字节完整性
      const rawText = new TextDecoder('latin1').decode(uint8Array);
      
      // 智能处理编码问题
      csvText = handleEncodingIssues(rawText, 'gbk-like');
      detectedEncoding = 'encoding-issues-handled';
      console.log('⚠️ 检测到编码问题，已进行基本处理');
    }
  }
  
  console.log('📝 检测到的编码:', detectedEncoding);
  console.log('📝 解码后的CSV文本预览:', csvText.substring(0, 200));
  
  return csvText;
};

// 解析文本数据为表格格式
export const parseTextData = (textInput: string): { headers: string[]; rows: any[][] } => {
  const lines = textInput.trim().split('\n');
  const headers = lines[0].split('\t').map(h => h.trim());
  const rows = lines.slice(1).map(line => 
    line.split('\t').map(cell => {
      const trimmed = cell.trim();
      // 将空字符串转换为null，符合数据处理最佳实践
      return trimmed === '' ? null : trimmed;
    })
  );
  
  return { headers, rows };
};

// 过滤空白行
export const filterEmptyRows = (rows: any[][]): any[][] => {
  return rows.filter(row => 
    row && row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '')
  );
};

// 清理表头
export const cleanHeaders = (headers: any[]): string[] => {
  return headers.map((header, index) => 
    header ? String(header).trim() : `未命名列${index + 1}`
  );
}; 