import { visit } from 'unist-util-visit';

// CommonMark treats a closing emphasis delimiter immediately followed by a
// Korean letter as intraword punctuation. Support the Markdown form users
// naturally write in Korean: **강조할 문장**이다.
export default function remarkKoreanEmphasis() {
  return (tree) => {
    visit(tree, 'text', (node, index, parent) => {
      if (index === undefined || !parent || !node.value.includes('**')) return;

      const children = [];
      const pattern = /\*\*([^*\n]+?)\*\*/g;
      let cursor = 0;
      let match;

      while ((match = pattern.exec(node.value))) {
        if (match.index > cursor) children.push({ type: 'text', value: node.value.slice(cursor, match.index) });
        children.push({ type: 'strong', children: [{ type: 'text', value: match[1] }] });
        cursor = match.index + match[0].length;
      }

      if (cursor === 0) return;
      if (cursor < node.value.length) children.push({ type: 'text', value: node.value.slice(cursor) });
      parent.children.splice(index, 1, ...children);
    });
  };
}
