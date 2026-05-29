import type { JSX } from 'react';

import { ScreenScaffold } from '../components/ScreenScaffold';

export default function StorageZonesRoute(): JSX.Element {
  return <ScreenScaffold eyebrow="Step 1 of 3" showBag title="Where do you store food?" />;
}
