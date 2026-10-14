import type { InlineExtension } from '@earendil-works/pi-coding-agent';
import opencodeZen from './index.ts';

const plugins: InlineExtension[] = [{ name: 'opencode-zen', factory: opencodeZen }];

export default plugins;
