import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

const testGlobal = globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean };
const previousActEnvironment = testGlobal.IS_REACT_ACT_ENVIRONMENT;
const activeRenderers: ReactTestRenderer[] = [];

beforeAll(() => {
  testGlobal.IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(() => {
  for (const renderer of activeRenderers.splice(0)) {
    act(() => {
      renderer.unmount();
    });
  }
});

afterAll(() => {
  if (previousActEnvironment === undefined) {
    delete testGlobal.IS_REACT_ACT_ENVIRONMENT;
  } else {
    testGlobal.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
  }
});

vi.mock('react-native', () => ({
  Platform: { OS: 'web' },
  Text: 'Text',
  View: 'View',
}));

vi.mock('@sackerl/ui', () => ({
  Logo: 'Logo',
  PaperBag: 'PaperBag',
}));

import { ScreenScaffold } from './ScreenScaffold';

function nodesOfType(renderer: ReactTestRenderer, typeName: string): ReactTestInstance[] {
  return renderer.root.findAll((node) => (node.type as unknown as string) === typeName);
}

function visibleText(renderer: ReactTestRenderer): unknown[] {
  return nodesOfType(renderer, 'Text').map((node) => node.props.children as unknown);
}

function renderScreen(props: Parameters<typeof ScreenScaffold>[0]): ReactTestRenderer {
  let renderer!: ReactTestRenderer;

  act(() => {
    renderer = create(<ScreenScaffold {...props} />);
  });
  activeRenderers.push(renderer);

  return renderer;
}

describe('ScreenScaffold', () => {
  it('renders and rerenders supplied copy through the mounted mobile shell', () => {
    const renderer = renderScreen({ eyebrow: 'Welcome', title: 'Your stock' });

    expect(visibleText(renderer)).toEqual(['Welcome', 'Your stock']);
    expect(nodesOfType(renderer, 'PaperBag')).toHaveLength(0);

    act(() => {
      renderer.update(<ScreenScaffold eyebrow="Updated" showBag title="Updated stock" />);
    });

    expect(visibleText(renderer)).toEqual(['Updated', 'Updated stock']);
    expect(nodesOfType(renderer, 'PaperBag')).toHaveLength(1);
  });

  it('adds the paper-bag illustration when requested', () => {
    const renderer = renderScreen({ eyebrow: 'Setup', showBag: true, title: 'Storage' });

    expect(nodesOfType(renderer, 'PaperBag')).toHaveLength(1);
  });
});
