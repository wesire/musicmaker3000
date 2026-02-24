import type { Section } from '../../models/types';
import { useSelectionStore } from '../../store/selectionStore';
import { useProjectStore } from '../../store/projectStore';
import { useOverlayStore } from '../../store/overlayStore';
import { analyzeSection } from '../../services/analysisEngine';
import BarCell from './BarCell';

interface Props {
  section: Section;
  sectionIndex: number;
}

export default function SectionBlock({ section, sectionIndex }: Props) {
  const { selection, selectSection } = useSelectionStore();
  const { currentSong } = useProjectStore();
  const { settings } = useOverlayStore();

  const keyContext = section.keyContext ?? currentSong?.keyContext ?? { root: 'C', mode: 'major' as const };

  const isSectionSelected =
    selection !== null &&
    selection.start.sectionIndex === sectionIndex &&
    selection.end.sectionIndex === sectionIndex &&
    selection.start.barIndex === 0 &&
    selection.end.barIndex === section.bars.length - 1;

  // Compute cadence markers when the overlay is active
  const cadenceByBar: Record<number, string> = {};
  if (settings.showCadenceMarkers && section.bars.length > 0) {
    const sectionAnalysis = analyzeSection(section.bars, keyContext, section.id);
    for (const { barIndex, type } of sectionAnalysis.cadences) {
      const labels: Record<string, string> = {
        authentic: '✓ auth', half: '↑ half', plagal: '✓ plag', deceptive: '↺ dec',
      };
      cadenceByBar[barIndex] = labels[type] ?? type;
    }
  }

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
        {settings.showSectionLabels && (
          <span className="section-type-badge">{section.type}</span>
        )}
        {settings.showSectionLabels && (
          <span className="section-label">{section.label}</span>
        )}
        {settings.showKeyContext && section.keyContext && (
          <span className="section-key-badge">
            {section.keyContext.root} {section.keyContext.mode}
          </span>
        )}
        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#a0a0b0' }}>
          {section.bars.length} bars
        </span>
      </div>
      <div className="bars-row">
        {section.bars.map((bar, barIndex) => (
          <BarCell
            key={bar.id}
            bar={bar}
            sectionIndex={sectionIndex}
            barIndex={barIndex}
            keyContext={keyContext}
            cadenceLabel={cadenceByBar[barIndex]}
          />
        ))}
      </div>
    </div>
  );
}
