import './Timeline.css';
import { useProjectStore } from '../../store/projectStore';
import { useSelectionStore } from '../../store/selectionStore';
import SectionBlock from './SectionBlock';

export default function Timeline() {
  const { currentSong } = useProjectStore();
  const { selection, clearSelection } = useSelectionStore();

  if (!currentSong) {
    return <div className="timeline"><p style={{ color: '#606080' }}>No song loaded.</p></div>;
  }

  const totalBars = currentSong.sections.reduce((a, s) => a + s.bars.length, 0);

  return (
    <div className="timeline" onClick={(e) => {
      // clear selection when clicking empty area
      if ((e.target as HTMLElement).classList.contains('timeline')) clearSelection();
    }}>
      <div className="timeline-header">
        <h2>{currentSong.title}</h2>
        <span className="timeline-info">
          {currentSong.keyContext.root} {currentSong.keyContext.mode} · {currentSong.tempo} bpm · {totalBars} bars
          {selection && ` · Selection: §${selection.start.sectionIndex + 1} Bar ${selection.start.barIndex + 1}`}
        </span>
      </div>
      {currentSong.sections.map((section, idx) => (
        <SectionBlock key={section.id} section={section} sectionIndex={idx} />
      ))}
    </div>
  );
}
