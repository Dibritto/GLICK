import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export const CryptoPriceChart = ({ data }: { data: {time: string, price: number}[] }) => {
  const chartData = useMemo(() => data, [data]);

  return (
      <div className="h-[300px] min-h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%" minHeight={300} minWidth={100} initialDimension={{ width: 300, height: 300 }}>
        <LineChart data={chartData}>
          <XAxis dataKey="time" hide />
          <YAxis domain={['auto', 'auto']} hide />
          <Tooltip 
            contentStyle={{ backgroundColor: '#111', border: 'none', borderRadius: '8px' }} 
            itemStyle={{ color: '#2cc7ff' }}
          />
          <Line type="monotone" dataKey="price" stroke="#2cc7ff" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
