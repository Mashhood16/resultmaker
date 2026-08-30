'use client'

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts'
import { useTheme } from 'next-themes'

interface ChartData {
  name: string
  average: number
  timestamp: number
}

export function ClassTrendChart({ data }: { data: ChartData[] }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"} />
          <XAxis 
            dataKey="name" 
            stroke={isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)"}
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke={isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)"}
            fontSize={12}
            tickLine={false}
            axisLine={false}
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)',
              borderRadius: '8px',
              border: 'none',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}
            formatter={(value: number) => [`${value}%`, 'Average']}
            labelStyle={{ color: isDark ? '#ccc' : '#666', marginBottom: '4px' }}
          />
          <Line 
            type="monotone" 
            dataKey="average" 
            stroke="oklch(var(--primary))" 
            strokeWidth={3}
            dot={{ r: 4, strokeWidth: 2, fill: isDark ? '#000' : '#fff' }}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
