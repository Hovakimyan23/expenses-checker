import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { CATEGORY_MAP } from '@/constants';
import { formatCurrency } from '@/lib/format';
import { useSettings } from '@/context/SettingsContext';
import type { CategoryId } from '@/types';

interface SpendingPieProps {
  data: { category: CategoryId; value: number }[];
}

export function SpendingPieChart({ data }: SpendingPieProps) {
  const { t, currency } = useSettings();
  const chartData = data
    .filter((d) => d.value > 0)
    .map((d) => ({
      name: t(CATEGORY_MAP[d.category].labelKey),
      value: d.value,
      color: CATEGORY_MAP[d.category].color,
    }));

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  if (chartData.length === 0) {
    return <EmptyChart message={t('noExpensesToChart')} />;
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={95}
            paddingAngle={2}
            stroke="none"
          >
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => formatCurrency(Number(value), currency)}
            contentStyle={tooltipStyle}
          />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            formatter={(value: string) => (
              <span className="text-xs text-gray-600 dark:text-gray-400">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="-mt-[300px] flex h-72 items-center justify-center pointer-events-none">
        <div className="text-center">
          <p className="text-xs text-gray-400 dark:text-gray-500">{t('totalSpent')}</p>
          <p className="text-lg font-bold">{formatCurrency(total, currency)}</p>
        </div>
      </div>
    </div>
  );
}

export const tooltipStyle: React.CSSProperties = {
  borderRadius: 12,
  border: 'none',
  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
  fontSize: 12,
  padding: '8px 12px',
};

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-72 items-center justify-center text-sm text-gray-400 dark:text-gray-500">
      {message}
    </div>
  );
}
