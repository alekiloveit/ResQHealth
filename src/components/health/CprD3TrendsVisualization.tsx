import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import {
  Award,
  Activity,
  Flame,
  CheckCircle2,
  TrendingUp,
  BarChart3,
  Calendar,
  Zap,
} from 'lucide-react';
import { CprPracticeSession, CprQuizScoreRecord } from '../../types/health';
import { getStoredCprHistory, getStoredCprQuizScores } from '../../utils/storage';

interface CprD3TrendsVisualizationProps {
  onOpenTrainer?: () => void;
  onOpenQuiz?: () => void;
}

export const CprD3TrendsVisualization: React.FC<CprD3TrendsVisualizationProps> = ({
  onOpenTrainer,
  onOpenQuiz,
}) => {
  const [viewMode, setViewMode] = useState<'frequency' | 'scores' | 'cadence'>('frequency');
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoveredData, setHoveredData] = useState<{
    x: number;
    y: number;
    title: string;
    metrics: { label: string; value: string; color?: string }[];
  } | null>(null);

  const [history, setHistory] = useState<CprPracticeSession[]>([]);
  const [quizScores, setQuizScores] = useState<CprQuizScoreRecord[]>([]);

  // Load data
  useEffect(() => {
    setHistory(getStoredCprHistory());
    setQuizScores(getStoredCprQuizScores());
  }, []);

  // Compute aggregate stats
  const totalCompressions = history.reduce((sum, h) => sum + h.totalCompressions, 0);
  const totalMinutes = Math.round(history.reduce((sum, h) => sum + h.durationSeconds, 0) / 60);
  const avgAccuracy = history.length > 0
    ? Math.round(history.reduce((sum, h) => sum + h.targetAccuracyPercent, 0) / history.length)
    : 0;
  const latestQuiz = quizScores[0] || null;
  const readinessIndex = Math.min(100, Math.round(avgAccuracy * 0.6 + (latestQuiz ? latestQuiz.percent * 0.4 : 50)));

  // Render D3 chart
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = containerRef.current.clientWidth || 640;
    const height = 260;
    const margin = { top: 24, right: 32, bottom: 36, left: 44 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Add Gradients
    const defs = svg.append('defs');

    // Emerald gradient for accuracy/scores
    const emeraldGradient = defs
      .append('linearGradient')
      .attr('id', 'emeraldAreaGrad')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    emeraldGradient.append('stop').attr('offset', '0%').attr('stop-color', '#10b981').attr('stop-opacity', 0.35);
    emeraldGradient.append('stop').attr('offset', '100%').attr('stop-color', '#10b981').attr('stop-opacity', 0.0);

    // Rose gradient for compressions
    const roseGradient = defs
      .append('linearGradient')
      .attr('id', 'roseBarGrad')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    roseGradient.append('stop').attr('offset', '0%').attr('stop-color', '#e11d48').attr('stop-opacity', 0.9);
    roseGradient.append('stop').attr('offset', '100%').attr('stop-color', '#e11d48').attr('stop-opacity', 0.4);

    // Grid lines helper
    const makeYGrid = (scale: d3.ScaleLinear<number, number>) => d3.axisLeft(scale).ticks(4);

    // -------------------------------------------------------------
    // VIEW 1: Training Frequency & Compressions (Bar + Line)
    // -------------------------------------------------------------
    if (viewMode === 'frequency') {
      const sortedHistory = [...history].sort((a, b) => a.timestamp - b.timestamp).slice(-10);

      const xScale = d3
        .scaleBand()
        .domain(sortedHistory.map((_, i) => String(i)))
        .range([0, innerWidth])
        .padding(0.35);

      const maxCompressions = Math.max(d3.max(sortedHistory, (d) => d.totalCompressions) || 200, 180);
      const yScaleCompressions = d3
        .scaleLinear()
        .domain([0, maxCompressions * 1.15])
        .range([innerHeight, 0]);

      const yScaleAccuracy = d3
        .scaleLinear()
        .domain([0, 100])
        .range([innerHeight, 0]);

      // Y-grid
      g.append('g')
        .attr('class', 'grid text-slate-200 stroke-slate-100')
        .call(makeYGrid(yScaleCompressions).tickSize(-innerWidth).tickFormat(() => ''))
        .call((sel) => sel.select('.domain').remove());

      // Bars: Total compressions
      g.selectAll('.bar')
        .data(sortedHistory)
        .enter()
        .append('rect')
        .attr('class', 'bar transition-all duration-200 cursor-pointer')
        .attr('x', (_, i) => xScale(String(i)) || 0)
        .attr('y', (d) => yScaleCompressions(d.totalCompressions))
        .attr('width', xScale.bandwidth())
        .attr('height', (d) => innerHeight - yScaleCompressions(d.totalCompressions))
        .attr('rx', 4)
        .attr('fill', 'url(#roseBarGrad)')
        .on('mouseenter', function (event, d) {
          d3.select(this).attr('opacity', 0.8);
          const [mx, my] = d3.pointer(event, svgRef.current);
          setHoveredData({
            x: mx,
            y: my,
            title: `${new Date(d.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
            metrics: [
              { label: 'Compressions', value: `${d.totalCompressions} pushes`, color: '#e11d48' },
              { label: 'Cadence Rate', value: `${d.averageBpm} BPM`, color: '#0284c7' },
              { label: 'Accuracy Score', value: `${d.targetAccuracyPercent}%`, color: '#10b981' },
              { label: 'Duration', value: `${d.durationSeconds}s` },
            ],
          });
        })
        .on('mouseleave', function () {
          d3.select(this).attr('opacity', 1.0);
          setHoveredData(null);
        });

      // Line: Cadence Accuracy
      const lineGen = d3
        .line<CprPracticeSession>()
        .x((_, i) => (xScale(String(i)) || 0) + xScale.bandwidth() / 2)
        .y((d) => yScaleAccuracy(d.targetAccuracyPercent))
        .curve(d3.curveMonotoneX);

      const areaGen = d3
        .area<CprPracticeSession>()
        .x((_, i) => (xScale(String(i)) || 0) + xScale.bandwidth() / 2)
        .y0(innerHeight)
        .y1((d) => yScaleAccuracy(d.targetAccuracyPercent))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(sortedHistory)
        .attr('fill', 'url(#emeraldAreaGrad)')
        .attr('d', areaGen);

      g.append('path')
        .datum(sortedHistory)
        .attr('fill', 'none')
        .attr('stroke', '#10b981')
        .attr('stroke-width', 2.5)
        .attr('d', lineGen);

      // Accuracy Dots
      g.selectAll('.dot')
        .data(sortedHistory)
        .enter()
        .append('circle')
        .attr('cx', (_, i) => (xScale(String(i)) || 0) + xScale.bandwidth() / 2)
        .attr('cy', (d) => yScaleAccuracy(d.targetAccuracyPercent))
        .attr('r', 4)
        .attr('fill', '#ffffff')
        .attr('stroke', '#10b981')
        .attr('stroke-width', 2);

      // X-Axis
      const xAxis = d3.axisBottom(xScale).tickFormat((_, i) => {
        const item = sortedHistory[i];
        return item ? new Date(item.timestamp).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' }) : '';
      });

      g.append('g')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(xAxis)
        .call((sel) => sel.select('.domain').attr('stroke', '#e2e8f0'))
        .selectAll('text')
        .attr('font-size', '10px')
        .attr('font-family', 'JetBrains Mono, monospace')
        .attr('fill', '#64748b');

      // Left Y-Axis (Compressions)
      g.append('g')
        .call(d3.axisLeft(yScaleCompressions).ticks(4))
        .call((sel) => sel.select('.domain').remove())
        .selectAll('text')
        .attr('font-size', '10px')
        .attr('font-family', 'JetBrains Mono, monospace')
        .attr('fill', '#94a3b8');

      // Right Y-Axis (Accuracy %)
      g.append('g')
        .attr('transform', `translate(${innerWidth},0)`)
        .call(d3.axisRight(yScaleAccuracy).ticks(4).tickFormat((d) => `${d}%`))
        .call((sel) => sel.select('.domain').remove())
        .selectAll('text')
        .attr('font-size', '10px')
        .attr('font-family', 'JetBrains Mono, monospace')
        .attr('fill', '#10b981');
    }

    // -------------------------------------------------------------
    // VIEW 2: Quiz Scores & Mastery Progression
    // -------------------------------------------------------------
    else if (viewMode === 'scores') {
      const sortedQuiz = [...quizScores].sort((a, b) => a.timestamp - b.timestamp);

      const xScale = d3
        .scalePoint()
        .domain(sortedQuiz.map((_, i) => String(i)))
        .range([0, innerWidth])
        .padding(0.2);

      const yScale = d3.scaleLinear().domain([0, 100]).range([innerHeight, 0]);

      // Y-Grid
      g.append('g')
        .attr('class', 'grid text-slate-200 stroke-slate-100')
        .call(makeYGrid(yScale).tickSize(-innerWidth).tickFormat(() => ''))
        .call((sel) => sel.select('.domain').remove());

      // 80% passing benchmark band
      g.append('rect')
        .attr('x', 0)
        .attr('y', yScale(100))
        .attr('width', innerWidth)
        .attr('height', yScale(80) - yScale(100))
        .attr('fill', '#10b981')
        .attr('opacity', 0.08);

      g.append('line')
        .attr('x1', 0)
        .attr('y1', yScale(80))
        .attr('x2', innerWidth)
        .attr('y2', yScale(80))
        .attr('stroke', '#10b981')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '4 4');

      g.append('text')
        .attr('x', innerWidth - 6)
        .attr('y', yScale(80) - 6)
        .attr('text-anchor', 'end')
        .attr('font-size', '10px')
        .attr('font-family', 'Plus Jakarta Sans, sans-serif')
        .attr('font-weight', '600')
        .attr('fill', '#059669')
        .text('80% Certification Passing Threshold');

      // Score Area & Line
      const areaGen = d3
        .area<CprQuizScoreRecord>()
        .x((_, i) => xScale(String(i)) || 0)
        .y0(innerHeight)
        .y1((d) => yScale(d.percent))
        .curve(d3.curveMonotoneX);

      const lineGen = d3
        .line<CprQuizScoreRecord>()
        .x((_, i) => xScale(String(i)) || 0)
        .y((d) => yScale(d.percent))
        .curve(d3.curveMonotoneX);

      g.append('path').datum(sortedQuiz).attr('fill', 'url(#emeraldAreaGrad)').attr('d', areaGen);

      g.append('path')
        .datum(sortedQuiz)
        .attr('fill', 'none')
        .attr('stroke', '#059669')
        .attr('stroke-width', 3)
        .attr('d', lineGen);

      // Dots
      g.selectAll('.quiz-dot')
        .data(sortedQuiz)
        .enter()
        .append('circle')
        .attr('class', 'quiz-dot cursor-pointer transition-all')
        .attr('cx', (_, i) => xScale(String(i)) || 0)
        .attr('cy', (d) => yScale(d.percent))
        .attr('r', 6)
        .attr('fill', (d) => (d.passed ? '#059669' : '#e11d48'))
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 2.5)
        .on('mouseenter', function (event, d) {
          d3.select(this).attr('r', 8);
          const [mx, my] = d3.pointer(event, svgRef.current);
          setHoveredData({
            x: mx,
            y: my,
            title: `Quiz Attempt · ${new Date(d.timestamp).toLocaleDateString()}`,
            metrics: [
              { label: 'Score', value: `${d.score} / ${d.totalQuestions} correct`, color: d.passed ? '#059669' : '#e11d48' },
              { label: 'Percentage', value: `${d.percent}%`, color: '#059669' },
              { label: 'Outcome', value: d.passed ? 'PASSED (Honors)' : 'Review Needed' },
            ],
          });
        })
        .on('mouseleave', function () {
          d3.select(this).attr('r', 6);
          setHoveredData(null);
        });

      // Labels on dots
      g.selectAll('.quiz-label')
        .data(sortedQuiz)
        .enter()
        .append('text')
        .attr('x', (_, i) => xScale(String(i)) || 0)
        .attr('y', (d) => yScale(d.percent) - 10)
        .attr('text-anchor', 'middle')
        .attr('font-size', '11px')
        .attr('font-weight', '700')
        .attr('font-family', 'JetBrains Mono, monospace')
        .attr('fill', (d) => (d.passed ? '#065f46' : '#991b1b'))
        .text((d) => `${d.percent}%`);

      // X-Axis
      const xAxis = d3.axisBottom(xScale).tickFormat((_, i) => {
        const item = sortedQuiz[i];
        return item ? new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';
      });

      g.append('g')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(xAxis)
        .call((sel) => sel.select('.domain').attr('stroke', '#e2e8f0'))
        .selectAll('text')
        .attr('font-size', '10px')
        .attr('font-family', 'JetBrains Mono, monospace')
        .attr('fill', '#64748b');

      // Left Y-Axis
      g.append('g')
        .call(d3.axisLeft(yScale).ticks(5).tickFormat((d) => `${d}%`))
        .call((sel) => sel.select('.domain').remove())
        .selectAll('text')
        .attr('font-size', '10px')
        .attr('font-family', 'JetBrains Mono, monospace')
        .attr('fill', '#94a3b8');
    }

    // -------------------------------------------------------------
    // VIEW 3: Cadence BPM Consistency (100-120 BPM Target Zone)
    // -------------------------------------------------------------
    else if (viewMode === 'cadence') {
      const sortedHistory = [...history].sort((a, b) => a.timestamp - b.timestamp).slice(-10);

      const xScale = d3
        .scalePoint()
        .domain(sortedHistory.map((_, i) => String(i)))
        .range([0, innerWidth])
        .padding(0.2);

      const yScale = d3.scaleLinear().domain([80, 140]).range([innerHeight, 0]);

      // Highlight target 100 - 120 BPM band
      g.append('rect')
        .attr('x', 0)
        .attr('y', yScale(120))
        .attr('width', innerWidth)
        .attr('height', yScale(100) - yScale(120))
        .attr('fill', '#0284c7')
        .attr('opacity', 0.12);

      g.append('line')
        .attr('x1', 0)
        .attr('y1', yScale(120))
        .attr('x2', innerWidth)
        .attr('y2', yScale(120))
        .attr('stroke', '#0284c7')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '3 3');

      g.append('line')
        .attr('x1', 0)
        .attr('y1', yScale(100))
        .attr('x2', innerWidth)
        .attr('y2', yScale(100))
        .attr('stroke', '#0284c7')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '3 3');

      g.append('text')
        .attr('x', 6)
        .attr('y', yScale(110) + 4)
        .attr('font-size', '10px')
        .attr('font-family', 'Plus Jakarta Sans, sans-serif')
        .attr('font-weight', '600')
        .attr('fill', '#0369a1')
        .text('AHA Gold Standard: 100 – 120 BPM Recoil Zone');

      // Line of average BPM
      const lineGen = d3
        .line<CprPracticeSession>()
        .x((_, i) => xScale(String(i)) || 0)
        .y((d) => yScale(d.averageBpm))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(sortedHistory)
        .attr('fill', 'none')
        .attr('stroke', '#e11d48')
        .attr('stroke-width', 2.5)
        .attr('d', lineGen);

      // Dots
      g.selectAll('.bpm-dot')
        .data(sortedHistory)
        .enter()
        .append('circle')
        .attr('class', 'bpm-dot cursor-pointer transition-all')
        .attr('cx', (_, i) => xScale(String(i)) || 0)
        .attr('cy', (d) => yScale(d.averageBpm))
        .attr('r', 5)
        .attr('fill', (d) => (d.averageBpm >= 100 && d.averageBpm <= 120 ? '#10b981' : '#f59e0b'))
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 2)
        .on('mouseenter', function (event, d) {
          d3.select(this).attr('r', 8);
          const [mx, my] = d3.pointer(event, svgRef.current);
          setHoveredData({
            x: mx,
            y: my,
            title: `Session Cadence · ${new Date(d.timestamp).toLocaleDateString()}`,
            metrics: [
              { label: 'Average BPM', value: `${d.averageBpm} BPM`, color: '#e11d48' },
              { label: 'In-Zone Accuracy', value: `${d.targetAccuracyPercent}%`, color: '#10b981' },
              { label: 'Mode', value: `${d.recipientType.replace('_', ' ')}` },
            ],
          });
        })
        .on('mouseleave', function () {
          d3.select(this).attr('r', 5);
          setHoveredData(null);
        });

      // X-Axis
      const xAxis = d3.axisBottom(xScale).tickFormat((_, i) => {
        const item = sortedHistory[i];
        return item ? new Date(item.timestamp).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' }) : '';
      });

      g.append('g')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(xAxis)
        .call((sel) => sel.select('.domain').attr('stroke', '#e2e8f0'))
        .selectAll('text')
        .attr('font-size', '10px')
        .attr('font-family', 'JetBrains Mono, monospace')
        .attr('fill', '#64748b');

      // Left Y-Axis
      g.append('g')
        .call(d3.axisLeft(yScale).ticks(5).tickFormat((d) => `${d} BPM`))
        .call((sel) => sel.select('.domain').remove())
        .selectAll('text')
        .attr('font-size', '10px')
        .attr('font-family', 'JetBrains Mono, monospace')
        .attr('fill', '#94a3b8');
    }
  }, [viewMode, history, quizScores]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
      {/* Header and Mode Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 uppercase tracking-wider mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>D3 Lifesaving Analytics</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            CPR Mastery & Historical Training Trends
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            D3 visualization tracking compression frequency, cadence accuracy, and certification readiness over time.
          </p>
        </div>

        {/* View Mode Interactive Filter Buttons */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl shrink-0">
          <button
            onClick={() => setViewMode('frequency')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              viewMode === 'frequency'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Training Frequency
          </button>
          <button
            onClick={() => setViewMode('scores')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              viewMode === 'scores'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Quiz Scores
          </button>
          <button
            onClick={() => setViewMode('cadence')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              viewMode === 'cadence'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cadence (BPM)
          </button>
        </div>
      </div>

      {/* Metric Strips (No-pill unboxed text discipline) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-1 border-y border-slate-100 text-xs">
        <div>
          <span className="text-slate-500 block">Total Compressions</span>
          <span className="text-xl font-extrabold text-slate-900 font-mono tabular-nums">
            {totalCompressions.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            Across {history.length} sessions
          </span>
        </div>

        <div>
          <span className="text-slate-500 block">Cadence Accuracy</span>
          <span className="text-xl font-extrabold text-emerald-600 font-mono tabular-nums">
            {avgAccuracy}%
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            100–120 BPM Target
          </span>
        </div>

        <div>
          <span className="text-slate-500 block">Latest Cert Quiz</span>
          <span className="text-xl font-extrabold text-slate-900 font-mono tabular-nums">
            {latestQuiz ? `${latestQuiz.percent}%` : 'N/A'}
          </span>
          <span className="text-[10px] text-emerald-600 block mt-0.5 font-medium">
            {latestQuiz?.passed ? 'Passed (≥80%)' : 'Needs Practice'}
          </span>
        </div>

        <div>
          <span className="text-slate-500 block">Resuscitation Readiness</span>
          <span className="text-xl font-extrabold text-rose-600 font-mono tabular-nums">
            {readinessIndex}/100
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            First Responder Ready
          </span>
        </div>
      </div>

      {/* D3 Canvas Container */}
      <div ref={containerRef} className="relative w-full overflow-hidden">
        <svg ref={svgRef} className="w-full h-64 overflow-visible" />

        {/* Hover Tooltip Box */}
        {hoveredData && (
          <div
            className="absolute z-20 pointer-events-none bg-slate-900/95 text-white p-2.5 rounded-xl shadow-xl text-xs space-y-1 backdrop-blur-xs border border-slate-700 min-w-[170px]"
            style={{
              left: Math.min(Math.max(hoveredData.x - 70, 10), (containerRef.current?.clientWidth || 400) - 180),
              top: Math.max(hoveredData.y - 95, 10),
            }}
          >
            <p className="font-semibold text-slate-300 pb-1 border-b border-slate-800 text-[11px]">
              {hoveredData.title}
            </p>
            {hoveredData.metrics.map((m, idx) => (
              <div key={idx} className="flex justify-between items-center gap-2">
                <span className="text-slate-400 text-[10px]">{m.label}:</span>
                <span
                  className="font-bold font-mono text-[11px]"
                  style={{ color: m.color || '#ffffff' }}
                >
                  {m.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Legend & Guide Footer */}
      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-4">
          {viewMode === 'frequency' && (
            <>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-rose-600/70 inline-block" />
                <span>Compressions Practiced</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                <span>Accuracy % Trend</span>
              </span>
            </>
          )}

          {viewMode === 'scores' && (
            <>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-emerald-600 border border-dashed border-emerald-500 inline-block" />
                <span>80% Competency Benchmark</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
                <span>Passed Exam (≥80%)</span>
              </span>
            </>
          )}

          {viewMode === 'cadence' && (
            <>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-2 bg-sky-500/20 border border-sky-400 inline-block" />
                <span>100–120 BPM Gold Standard</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block" />
                <span>Your Average Cadence</span>
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onOpenTrainer && (
            <button
              onClick={onOpenTrainer}
              className="text-xs text-rose-600 font-semibold hover:underline cursor-pointer"
            >
              Start CPR Session →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
