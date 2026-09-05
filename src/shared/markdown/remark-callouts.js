import { visit } from 'unist-util-visit';

const CALLOUTS = {
  note: { icon: '✦', label: 'Note' },
  tip: { icon: '✧', label: 'Tip' },
  warning: { icon: '⚠', label: 'Warning' },
  important: { icon: '◆', label: 'Important' },
  success: { icon: '✓', label: 'Success' },
};

export default function remarkCallouts() {
  return (tree) => {
    visit(tree, 'containerDirective', (node) => {
      const type = CALLOUTS[node.name] ? node.name : 'note';
      const callout = CALLOUTS[type];

      node.data ??= {};
      node.data.hName = 'aside';
      node.data.hProperties = {
        className: ['callout', `callout--${type}`],
        role: 'note',
      };
      node.children.unshift({
        type: 'paragraph',
        data: {
          hProperties: { className: ['callout__title'] },
        },
        children: [{ type: 'text', value: `${callout.icon} ${callout.label}` }],
      });
    });
  };
}
