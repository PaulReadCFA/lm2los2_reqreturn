import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

function Card({ title, children, className = "" }) {
  return (
    <div className={`bg-white rounded-2xl shadow-md p-5 border border-gray-100 ${className}`}>
      <h2 className="font-serif text-xl text-slate-800 mb-3">{title}</h2>
      <div className="font-sans text-sm text-black/80">{children}</div>
    </div>
  );
}

function calculateGordonGrowthModel({ marketPrice, dividendAmount, growthRate }) {
  const g = growthRate / 100; // Convert percentage to decimal
  const d0 = dividendAmount;
  const d1 = d0 * (1 + g); // Next year's dividend
  const price = marketPrice;
  
  // Required return: r = (D1 / P) + g
  const requiredReturn = (d1 / price) + g;
  const requiredReturnPct = requiredReturn * 100;
  
  // Generate cash flows for 10 years
  const cashflows = [];
  for (let year = 0; year <= 10; year++) {
    if (year === 0) {
      // Initial investment (negative cash flow)
      cashflows.push({
        year,
        dividend: 0,
        investment: -price,
        total: -price
      });
    } else {
      // Growing dividends
      const dividend = d0 * Math.pow(1 + g, year);
      cashflows.push({
        year,
        dividend,
        investment: 0,
        total: dividend
      });
    }
  }
  
  return {
    requiredReturn: requiredReturnPct,
    d1,
    cashflows,
    isValid: g < requiredReturn // Model only valid when g < r
  };
}

// Custom label component that shows values above/below bars
const CustomLabel = (props) => {
  const { x, y, width, height, value } = props;
  
  if (!value || Math.abs(value) < 0.01) return null;
  
  const isNegative = value < 0;
  const labelY = isNegative ? y + height + 15 : y - 8;
  
  return (
    <text
      x={x + width / 2}
      y={labelY}
      textAnchor="middle"
      fill="#000"
      fontSize="11"
      fontWeight="bold"
    >
      {isNegative ? '-' : ''}${Math.abs(value).toFixed(2)}
    </text>
  );
};

export default function App() {
  const [inputs, setInputs] = useState({ 
    marketPrice: 54.56, 
    dividendAmount: 5.00, 
    growthRate: 6.10 
  });
  
  // Input validation
  const validateInputs = (inputs) => {
    const errors = [];
    if (inputs.marketPrice < 1 || inputs.marketPrice > 500) errors.push("Market Price must be between $1 and $500");
    if (inputs.dividendAmount < 0 || inputs.dividendAmount > 50) errors.push("Dividend Amount must be between $0 and $50");
    if (inputs.growthRate < 0 || inputs.growthRate > 25) errors.push("Growth Rate must be between 0% and 25%");
    return errors;
  };
  
  const inputErrors = validateInputs(inputs);
  const model = useMemo(() => {
    if (inputErrors.length > 0) return null;
    return calculateGordonGrowthModel(inputs);
  }, [inputs, inputErrors]);

  // Chart data for dividend cash flows
  const chartData = useMemo(() => {
    if (!model) return [];
    
    return model.cashflows.map(cf => ({
      yearLabel: cf.year.toString(),
      year: cf.year,
      dividendFlow: cf.dividend,
      investmentFlow: cf.investment,
      requiredReturnLine: model.requiredReturn,
    }));
  }, [model]);

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-6xl mx-auto px-4">
        {/* Dividend Model Inputs & Chart */}
        <Card title="Constant Growth Dividend Model: Inputs & Cash Flows" className="w-full">
          {/* Inputs Section */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <label className="flex flex-col">
              Market Price of Stock ($) <span className="text-gray-500 text-xs">(1 - 500)</span>
              <input 
                type="number" 
                step="0.01" 
                min="1"
                max="500"
                value={inputs.marketPrice}
                onChange={(e) => setInputs(v => ({ ...v, marketPrice: +e.target.value }))}
                className="mt-1 rounded-lg border px-3 py-2" 
              />
            </label>
            <label className="flex flex-col">
              Dividend Amount ($) <span className="text-gray-500 text-xs">(0 - 50)</span>
              <input 
                type="number" 
                step="0.01" 
                min="0"
                max="50"
                value={inputs.dividendAmount}
                onChange={(e) => setInputs(v => ({ ...v, dividendAmount: +e.target.value }))}
                className="mt-1 rounded-lg border px-3 py-2" 
              />
            </label>
            <label className="flex flex-col">
              Growth Rate (%) <span className="text-gray-500 text-xs">(0 - 25)</span>
              <input 
                type="number" 
                step="0.01" 
                min="0"
                max="25"
                value={inputs.growthRate}
                onChange={(e) => setInputs(v => ({ ...v, growthRate: +e.target.value }))}
                className="mt-1 rounded-lg border px-3 py-2" 
              />
            </label>
          </div>

          {/* Error Messages */}
          {inputErrors.length > 0 && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-red-800 text-sm">
                {inputErrors.map((error, i) => (
                  <div key={i}>• {error}</div>
                ))}
              </div>
            </div>
          )}

          {/* Model Validity Check */}
          {model && !model.isValid && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="text-yellow-800 text-sm">
                <strong>Warning:</strong> Growth rate must be less than required return for the model to be valid. 
                Current: g = {inputs.growthRate.toFixed(2)}%, r = {model.requiredReturn.toFixed(2)}%
              </div>
            </div>
          )}

          {/* Required Return Results */}
          {model && model.isValid && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-serif text-blue-600 mb-2">{model.requiredReturn.toFixed(2)}%</div>
              <div className="text-sm text-gray-700">
                <div><strong>IRR (Implied Required Return)</strong> - the return investors demand for this stock</div>
                <div className="mt-1">Using Gordon Growth Model: r = (D₁ ÷ P) + g</div>
                <div className="text-xs mt-1">Next year's dividend (D₁): ${model.d1.toFixed(2)}</div>
              </div>
            </div>
          )}

          {/* Chart Legend */}
          {model && model.isValid && (
            <>
              <div className="mb-4 text-sm text-gray-600 flex items-center gap-6">
                <span className="inline-flex items-center">
                  <span className="w-4 h-4 bg-green-500 mr-2 rounded"></span>
                  Dividend Cash Flow
                </span>
                <span className="inline-flex items-center">
                  <span className="w-4 h-4 bg-red-400 mr-2 rounded"></span>
                  Initial Investment
                </span>
                <span className="inline-flex items-center">
                  <span className="w-4 h-4 bg-blue-600 mr-2 rounded"></span>
                  IRR: {model.requiredReturn.toFixed(2)}%
                </span>
              </div>

              {/* Cash Flow Chart */}
              <div className="h-96 relative">
                <div className="text-center text-sm text-gray-600 mb-2 font-medium">
                  Equity Cash Flows (in US$) & Resulting Implied Required Return (Only the first 10 years are shown)
                </div>
                {/* IRR Value Label positioned relative to chart */}
                <div 
                  className="absolute right-6 bg-blue-100 text-blue-600 px-2 py-1 rounded text-sm font-semibold z-10"
                  style={{
                    top: `${100 - (model.requiredReturn / (Math.ceil(model.requiredReturn * 1.2))) * 80}%`,
                    transform: 'translateY(-50%)'
                  }}
                >
                  {model.requiredReturn.toFixed(2)}%
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={chartData}
                    margin={{ top: 20, right: 100, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="yearLabel" 
                      label={{ value: 'Years', position: 'insideBottom', offset: -10 }}
                    />
                    <YAxis 
                      yAxisId="left"
                      label={{ value: 'Cash Flows ($)', angle: -90, position: 'insideLeft' }}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      label={{ value: 'IRR (%)', angle: 90, position: 'insideRight', style: { fill: '#2563eb' } }}
                      tickFormatter={(value) => `${value.toFixed(1)}`}
                      domain={[0, Math.ceil(model.requiredReturn * 1.2)]}
                      tick={{ fill: '#2563eb' }}
                      axisLine={{ stroke: '#2563eb' }}
                    />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === 'Implied Required Return') return [`${Number(value).toFixed(2)}%`, name];
                        return [`${Number(value).toFixed(2)}`, name];
                      }}
                      labelFormatter={(label) => `Year: ${label}`}
                    />
                    
                    {/* Stacked bars for cash flows */}
                    <Bar 
                      yAxisId="left" 
                      dataKey="dividendFlow" 
                      stackId="cash" 
                      fill="#10b981" 
                      name="Dividend Cash Flow"
                      label={CustomLabel}
                    />
                    <Bar 
                      yAxisId="left" 
                      dataKey="investmentFlow" 
                      stackId="cash" 
                      fill="#f87171" 
                      name="Initial Investment"
                      label={CustomLabel}
                    />
                    
                    {/* Required Return line */}
                    <Line 
                      yAxisId="right" 
                      type="monotone" 
                      dataKey="requiredReturnLine" 
                      stroke="#2563eb" 
                      strokeWidth={3}
                      dot={false}
                      name="IRR"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Educational Note */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                <strong>Gordon Growth Model:</strong> Assumes dividends grow at a constant rate forever. 
                The model calculates the required return that makes the present value of all future dividends 
                equal to the current stock price. Only valid when growth rate &lt; required return.
              </div>
            </>
          )}
        </Card>
      </main>
    </div>
  );
}