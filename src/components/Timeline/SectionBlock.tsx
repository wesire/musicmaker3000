import type { Section } from '../../models/types';
import { useSelectionStore } from '../../store/selectionStore';
import BarCell from './BarCell';

interface Props {
  section: Section;
  sectionIndex: number;
}

export default function SectionBlock({ section, sectionIndex }: Props) {
  const { selection, selectSection } = useSelectionStore();

  const isSectionSelected =
    selection !== null &&
    selection.start.sectionIndex === sectionIndex &&
    selection.end.sectionIndex === sectionIndex &&
    selection.start.barIndex === 0 &&
    selection.end.barIndex === section.bars.length - 1;

  function handleHeaderClick() {
    selectSection(sectionIndex, section.bars.length);
  }

  return (
    <div className="section-block">
      <div
        className={`section-header${isSectionSelected ? ' selected' : ''}`}
        onClick={handleHeaderClick}
        title="Click to select entire section"
      >
        <span className="section-type-badge">{section.type}</span>
        <span className="section-label">{section.label}</span>
        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#a0a0b0' }}>
          {section.bars.length} bars
        </span>
      </div>
      <div className="bars-row">
        {section.bars.map((bar, barIndex) => (
          <BarCell key={bar.id} bar={bar} sectionIndex={sectionIndex} barIndex={barIndex} />
        ))}
      </div>
    </div>
  );
}
