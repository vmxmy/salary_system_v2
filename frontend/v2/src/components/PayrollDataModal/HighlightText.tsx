import React from 'react';
import Highlighter from 'react-highlight-words';
import { Typography } from 'antd';
import { getHighlightRanges } from '../../utils/searchUtils';
import type { SearchResult } from '../../utils/searchUtils';

const { Text } = Typography;

// 组件属性接口
export interface HighlightTextProps {
  text: string;
  searchWords?: string[];
  searchResult?: SearchResult<any>;
  fieldName?: string;
  highlightStyle?: React.CSSProperties;
  highlightClassName?: string;
  caseSensitive?: boolean;
  autoEscape?: boolean;
  className?: string;
  style?: React.CSSProperties;
  ellipsis?: boolean;
  maxLength?: number;
}

// 默认高亮样式
const DEFAULT_HIGHLIGHT_STYLE: React.CSSProperties = {
  backgroundColor: '#fff3cd',
  color: '#856404',
  padding: '1px 2px',
  borderRadius: '2px',
  fontWeight: 'bold',
};

/**
 * 文本高亮组件
 * 支持基于搜索词或 Fuse.js 搜索结果的高亮显示
 */
export const HighlightText: React.FC<HighlightTextProps> = ({
  text,
  searchWords = [],
  searchResult,
  fieldName,
  highlightStyle = DEFAULT_HIGHLIGHT_STYLE,
  highlightClassName,
  caseSensitive = false,
  autoEscape = true,
  className,
  style,
  ellipsis = false,
  maxLength,
}) => {
  // 如果文本为空，直接返回
  if (!text) {
    return <span className={className} style={style}>-</span>;
  }

  // 处理文本长度限制
  let displayText = String(text);
  if (maxLength && displayText.length > maxLength) {
    displayText = ellipsis 
      ? `${displayText.substring(0, maxLength)}...`
      : displayText.substring(0, maxLength);
  }

  // 获取搜索词
  let wordsToHighlight = searchWords;

  // 如果提供了搜索结果和字段名，尝试从 Fuse.js 结果中提取高亮信息
  if (searchResult?.matches && fieldName) {
    const fieldMatch = searchResult.matches.find(match => match.key === fieldName);
    if (fieldMatch && fieldMatch.indices) {
      // 使用 Fuse.js 的精确匹配位置进行高亮
      const ranges = getHighlightRanges(displayText, [fieldMatch]);
      
      if (ranges.length > 0) {
        return (
          <span className={className} style={style}>
            {renderWithRanges(displayText, ranges, highlightStyle, highlightClassName)}
          </span>
        );
      }
    }
  }

  // 如果没有搜索词，直接返回原文本
  if (wordsToHighlight.length === 0) {
    return (
      <span className={className} style={style}>
        {displayText}
      </span>
    );
  }

  // 使用 react-highlight-words 进行高亮
  return (
    <span className={className} style={style}>
      <Highlighter
        searchWords={wordsToHighlight}
        textToHighlight={displayText}
        highlightStyle={highlightStyle}
        highlightClassName={highlightClassName}
        caseSensitive={caseSensitive}
        autoEscape={autoEscape}
      />
    </span>
  );
};

/**
 * 基于范围数组渲染高亮文本
 */
const renderWithRanges = (
  text: string, 
  ranges: Array<[number, number]>, 
  highlightStyle: React.CSSProperties,
  highlightClassName?: string
) => {
  if (ranges.length === 0) {
    return text;
  }

  const elements: React.ReactNode[] = [];
  let lastIndex = 0;

  ranges.forEach(([start, end], index) => {
    // 添加高亮前的普通文本
    if (start > lastIndex) {
      elements.push(
        <span key={`normal-${index}`}>
          {text.substring(lastIndex, start)}
        </span>
      );
    }

    // 添加高亮文本
    elements.push(
      <span 
        key={`highlight-${index}`}
        style={highlightStyle}
        className={highlightClassName}
      >
        {text.substring(start, end)}
      </span>
    );

    lastIndex = end;
  });

  // 添加最后的普通文本
  if (lastIndex < text.length) {
    elements.push(
      <span key="normal-end">
        {text.substring(lastIndex)}
      </span>
    );
  }

  return <>{elements}</>;
};

/**
 * 智能高亮组件
 * 自动判断使用哪种高亮方式
 */
export const SmartHighlightText: React.FC<HighlightTextProps & {
  searchQuery?: string;
}> = ({
  searchQuery,
  ...props
}) => {
  // 如果有搜索查询，自动分解为搜索词
  const searchWords = searchQuery 
    ? searchQuery.trim().split(/\s+/).filter(word => word.length > 0)
    : props.searchWords || [];

  return (
    <HighlightText
      {...props}
      searchWords={searchWords}
    />
  );
};

/**
 * 表格单元格高亮组件
 * 专门用于表格中的文本高亮显示
 */
export const TableCellHighlight: React.FC<HighlightTextProps & {
  searchQuery?: string;
  type?: 'text' | 'number' | 'currency';
}> = ({
  text,
  searchQuery,
  type = 'text',
  maxLength = 50,
  ellipsis = true,
  ...props
}) => {
  // 根据类型格式化文本
  const formatText = (value: any, cellType: string) => {
    if (value == null) return '-';
    
    switch (cellType) {
      case 'number':
        return typeof value === 'number' ? value.toLocaleString() : String(value);
      case 'currency':
        return typeof value === 'number' 
          ? `¥${value.toFixed(2)}` 
          : String(value);
      default:
        return String(value);
    }
  };

  const formattedText = formatText(text, type);
  const searchWords = searchQuery 
    ? searchQuery.trim().split(/\s+/).filter(word => word.length > 0)
    : props.searchWords || [];

  return (
    <HighlightText
      text={formattedText}
      searchWords={searchWords}
      maxLength={maxLength}
      ellipsis={ellipsis}
      style={{
        display: 'block',
        lineHeight: '1.4',
        ...props.style
      }}
      {...props}
    />
  );
};

/**
 * 多字段高亮组件
 * 用于同时高亮多个字段的内容
 */
export const MultiFieldHighlight: React.FC<{
  fields: Array<{
    label: string;
    value: any;
    fieldName?: string;
  }>;
  searchResult?: SearchResult<any>;
  searchQuery?: string;
  separator?: string;
  maxFields?: number;
}> = ({
  fields,
  searchResult,
  searchQuery,
  separator = ' | ',
  maxFields = 3,
}) => {
  const displayFields = fields.slice(0, maxFields);
  const searchWords = searchQuery 
    ? searchQuery.trim().split(/\s+/).filter(word => word.length > 0)
    : [];

  return (
    <span>
      {displayFields.map((field, index) => (
        <span key={index}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {field.label}:
          </Text>
          {' '}
          <HighlightText
            text={field.value}
            searchWords={searchWords}
            searchResult={searchResult}
            fieldName={field.fieldName}
            maxLength={20}
            ellipsis
          />
          {index < displayFields.length - 1 && separator}
        </span>
      ))}
      {fields.length > maxFields && (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {' '}+{fields.length - maxFields}个字段
        </Text>
      )}
    </span>
  );
}; 