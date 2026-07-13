'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, LineChart, Line,
} from 'recharts';
import { BarChart3 } from 'lucide-react';

export interface ChartDataPoint {
  month: string;
  companies?: number;
  employees?: number;
  leads?: number;
  projects?: number;
  documents?: number;
  activity?: number;
}

interface AnalyticsChartsProps {
  data: ChartDataPoint[];
}

const chartConfig = [
  {
    key: 'companies',
    title: 'New Companies',
    color: '#3b82f6',
    type: 'bar' as const,
  },
  {
    key: 'employees',
    title: 'New Employees',
    color: '#10b981',
    type: 'bar' as const,
  },
  {
    key: 'leads',
    title: 'Lead Growth',
    color: '#f59e0b',
    type: 'area' as const,
  },
  {
    key: 'projects',
    title: 'Project Growth',
    color: '#8b5cf6',
    type: 'area' as const,
  },
  {
    key: 'documents',
    title: 'Documents Generated',
    color: '#06b6d4',
    type: 'bar' as const,
  },
  {
    key: 'activity',
    title: 'Activity Trend',
    color: '#f97316',
    type: 'line' as const,
  },
];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { dataKey: string; value: number; color: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-sa-card-solid border border-sa-border-solid rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-sa-text-secondary mb-1">{label}</p>
      {payload.map((entry, index: number) => (
        <p key={`${entry.dataKey}-${index}`} className="text-xs font-medium" style={{ color: entry.color }}>
          {entry.dataKey}: {entry.value}
        </p>
      ))}
    </div>
  );
};

export function AnalyticsCharts({ data }: AnalyticsChartsProps) {
  return (
    <Card className="bg-sa-card border-sa-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-sa-text-secondary flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-purple-500" />
          Analytics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {chartConfig.map((cfg, index) => {
            const chartData = data.map((d) => ({ month: d.month, [cfg.key]: d[cfg.key as keyof ChartDataPoint] || 0 }));

            return (
              <div key={`${cfg.key}-${index}`} className="bg-sa-chart-bg rounded-lg p-3 border border-sa-border/40">
                <p className="text-xs text-sa-text-muted font-medium mb-3">{cfg.title}</p>
                <ResponsiveContainer width="100%" height={140}>
                  {cfg.type === 'bar' ? (
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={{ stroke: '#374151' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={{ stroke: '#374151' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey={cfg.key} fill={cfg.color} radius={[3, 3, 0, 0]} />
                    </BarChart>
                  ) : cfg.type === 'area' ? (
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={{ stroke: '#374151' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={{ stroke: '#374151' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey={cfg.key} stroke={cfg.color} fill={`${cfg.color}20`} strokeWidth={2} />
                    </AreaChart>
                  ) : (
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={{ stroke: '#374151' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={{ stroke: '#374151' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey={cfg.key} stroke={cfg.color} strokeWidth={2} dot={{ fill: cfg.color, r: 3 }} />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
