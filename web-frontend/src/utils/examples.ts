import type { Direction } from '../types/api';

export type DemoExample = {
  label: string;
  direction: Direction;
  sourceText: string;
  targetText: string;
};

export const demoExamples: DemoExample[] = [
  {
    label: '地名术语',
    direction: '中英',
    sourceText: '新疆国际大巴扎是乌鲁木齐重要的旅游和商业地标。',
    targetText: 'Xinjiang International Grand Bazaar is an important tourist and commercial landmark in Urumqi.',
  },
  {
    label: '政策表达',
    direction: '中英',
    sourceText: '各地要持续推进公共服务均等化，提升基层治理能力。',
    targetText: 'All localities should continue promoting equal access to public services and improve grassroots governance capacity.',
  },
  {
    label: '俄语场景',
    direction: '俄中',
    sourceText: 'Сегодня делегация посетила индустриальный парк в Хоргосе.',
    targetText: '今天代表团参观了霍尔果斯工业园区。',
  },
];

export const directions: Direction[] = ['中英', '英中', '俄中', '中俄', '维中', '中维', '维俄', '俄维'];
