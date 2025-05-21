declare module 'react-highlight-words' {
  import * as React from 'react';

  export interface HighlighterProps {
    activeClassName?: string;
    activeIndex?: number;
    activeStyle?: React.CSSProperties;
    autoEscape?: boolean;
    caseSensitive?: boolean;
    className?: string;
    findChunks?: (props: any) => any[];
    highlightClassName?: string;
    highlightStyle?: React.CSSProperties;
    highlightTag?: string | React.ComponentType<any>;
    sanitize?: (text: string) => string;
    searchWords: string[];
    textToHighlight: string;
    unhighlightClassName?: string;
    unhighlightStyle?: React.CSSProperties;
  }

  export default class Highlighter extends React.Component<HighlighterProps> {}
} 