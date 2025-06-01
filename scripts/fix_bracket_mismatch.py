import sys
import re

BRACKETS = {
    '(': ')',
    '{': '}',
    '[': ']'
}

OPENING = set(BRACKETS.keys())
CLOSING = set(BRACKETS.values())

def find_mismatches(lines):
    stack = []
    mismatches = []
    for lineno, line in enumerate(lines, start=1):
        for i, ch in enumerate(line):
            if ch in OPENING:
                stack.append((ch, lineno, i))
            elif ch in CLOSING:
                if stack and BRACKETS.get(stack[-1][0]) == ch:
                    stack.pop()
                else:
                    # Found closing bracket without matching opening
                    mismatches.append(('unmatched_closing', ch, lineno, i))
    # Any remaining opening brackets are unmatched
    for (ch, lineno, i) in stack:
        mismatches.append(('unmatched_opening', ch, lineno, i))
    return mismatches

def auto_fix(lines):
    """
    简单自动修复：
    - 对于未匹配的开括号，尝试在对应代码块末尾添加缺失的闭括号
    - 不处理未匹配的闭括号（因为删除可能破坏代码）
    """
    mismatches = find_mismatches(lines)
    # 统计未匹配的开括号按类型和行号
    unmatched_openings = [m for m in mismatches if m[0] == 'unmatched_opening']

    if not unmatched_openings:
        print("No unmatched opening brackets found. No fix needed.")
        return lines

    # 以行号为键，收集缺失闭括号
    fixes = {}
    for _, ch, lineno, _ in unmatched_openings:
        fixes.setdefault(lineno, []).append(BRACKETS[ch])

    # 将缺失的闭括号添加到对应行的末尾（或下一行）
    new_lines = lines[:]
    # 为避免影响行号，先收集所有行号，后统一添加
    for lineno in sorted(fixes.keys(), reverse=True):
        closing_brackets = ''.join(fixes[lineno])
        # 在该行末尾添加缺失的闭括号
        new_lines[lineno-1] = new_lines[lineno-1].rstrip('\n') + closing_brackets + '\n'

    return new_lines

def main():
    if len(sys.argv) < 2:
        print("Usage: python fix_bracket_mismatch.py <file_path>")
        sys.exit(1)

    file_path = sys.argv[1]
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    mismatches = find_mismatches(lines)
    if not mismatches:
        print("No bracket mismatches found.")
        return

    print("Bracket mismatches found:")
    for m in mismatches:
        kind, ch, lineno, col = m
        print(f"  {kind} '{ch}' at line {lineno}, column {col+1}")

    fixed_lines = auto_fix(lines)

    output_path = file_path + '.fixed'
    with open(output_path, 'w', encoding='utf-8') as f:
        f.writelines(fixed_lines)

    print(f"Fixed file saved as: {output_path}")

if __name__ == '__main__':
    main()