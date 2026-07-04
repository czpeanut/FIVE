"use client";

import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Radar } from "react-chartjs-2";
import { IndicatorScore } from "@/lib/types";

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export default function RadarChart({ scores }: { scores: IndicatorScore[] }) {
  const data = {
    labels: scores.map(s => s.indicator),
    datasets: [
      {
        label: "得分率",
        data: scores.map(s => s.percent),
        backgroundColor: "rgba(176, 64, 44, 0.12)",
        borderColor: "rgba(176, 64, 44, 0.85)",
        borderWidth: 1.5,
        pointBackgroundColor: "rgba(176, 64, 44, 0.85)",
        pointRadius: 3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    scales: {
      r: {
        min: 0,
        max: 100,
        ticks: {
          stepSize: 25,
          backdropColor: "transparent",
          color: "#9a917c",
          font: { size: 10, family: "'JetBrains Mono', monospace" },
        },
        grid: { color: "#cdc3ad" },
        angleLines: { color: "#cdc3ad" },
        pointLabels: {
          color: "#23201a",
          font: { size: 12, family: "'Noto Serif TC', serif" },
        },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: { parsed: { r: number } }) => ` ${ctx.parsed.r}%`,
        },
      },
    },
  };

  return <Radar data={data} options={options} />;
}
