import { useMemo, useState, useCallback } from "react";
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

// Shared Components
function Card({ title, children, className = "" }) {
  return (
    <div className={`bg-white rounded-2xl shadow-md p-5 border border-gray-100 ${className}`}>
      <h1 className="font-serif text-2xl text-slate-800 mb-3">{title}</h1>
      <div className="font-sans text-sm text-black/80">{children}</div>
    </div>
  );
}

function FormField({ id, label, children, error, helpText, required = false }) {
  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
        {helpText && <span className="text-gray-500 text-xs font-normal ml-2">({helpText})</span>}
      </label>
      {children}
      {error && (
        <div className="text-red-600 text-xs mt-1" role="alert" id={`${id}-error`}>
          {error}
        </div>
      )}
    </div>
  );
}

function ValidationMessage({ errors }) {
  if (!errors || Object.keys(errors).length === 0) return null;
  
  return (
    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg" role="alert">
      <h2 className="text-red-800 font-semibold text-sm mb-2">Please correct the following:</h2>
      <ul className="text-red-800 text-sm space-y-1">
        {Object.entries(errors).map(([field, error]) => (
          <li key={field}>• {error}</li>
        ))}
      </ul>
    </div>
  );
}

function ResultCard({ title, value, subtitle, description, isValid = true }) {
  if (!isValid) return null;
  
  return (
    <div className="mb-6 p-4 bg-blue-50 rounded-lg">
      <div className="text-3xl font-serif text-blue-600 mb-2" aria-live="polite">{value}</div>
      <div className="text-sm text-gray-700">
        <div><strong>{title}</strong> - {subtitle}</div>
        <div className="mt-1">{description}</div>
      </div>
    </div>
  );
}

// Enhanced Custom label component that shows values consistently positioned
const CustomLabel = (props) => {
  const { x, y, width, height, value } = props;
  
  if (!value || Math.abs(value) < 0.01) return null;
  
  const isNegative = value < 0;
  // Position all labels above the bar area for consistency
  const labelY = y - 8;
  
  return (
    <text
      x={x + width / 2}
      y={labelY}
      textAnchor="middle"
      fill="#000"
      fontSize="11"
      fontWeight="bold"
    >
      {isNegative ? '(' : ''}${Math.abs(value).toFixed(2)}{isNegative ? ')' : ''}
    </text>
  );
};

export default function RequiredReturnCalculator() {
  const [inputs, setInputs] = useState({ 
    marketPrice: 54.56, 
    dividendAmount: 5.10, 
    growthRate: 6.40 
  });
  
  const validateInputs = useCallback((inputs) => {
    const errors = {};
    if (!inputs.marketPrice || inputs.marketPrice < 1) {
      errors.marketPrice = "Market price must be at least $1";
    } else if (inputs.marketPrice > 500) {
      errors.marketPrice = "Market price cannot exceed $500";
    }
    
    if (inputs.dividendAmount < 0) {
      errors.dividendAmount = "Dividend cannot be negative";
    } else if (inputs.dividendAmount > 50) {
      errors.dividendAmount = "Dividend cannot exceed $50";
    }
    
    if (inputs.growthRate < 0) {
      errors.growthRate = "Growth rate cannot be negative";
    } else if (inputs.growthRate > 25) {
      errors.growthRate = "Growth rate cannot exceed 25%";
    }
    
    return errors;
  }, []);
  
  const handleInputChange = useCallback((field, value) => {
    setInputs(prev => ({ ...prev, [field]: +value }));
  }, []);
  
  const inputErrors = validateInputs(inputs);
  
  const model = useMemo(() => {
    if (Object.keys(inputErrors).length > 0) return null;
    
    const g = inputs.growthRate / 100;
    const d0 = inputs.dividendAmount;
    const d1 = d0 * (1 + g);
    const price = inputs.marketPrice;
    
    const requiredReturn = (d1 / price) + g;
    const requiredReturnPct = requiredReturn * 100;
    
    const cashflows = [];
    for (let year = 0; year <= 10; year++) {
      if (year === 0) {
        cashflows.push({
          year,
          dividend: 0,
          investment: -price,
          total: -price
        });
      } else {
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
      isValid: g < requiredReturn && requiredReturnPct > 0
    };
  }, [inputs, inputErrors]);

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
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Card title="Required Return Calculator (Gordon Growth Model)">
          {/* Skip Navigation */}
          <nav className="mb-4">
            <a href="#return-inputs" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-3 py-1 rounded">
              Skip to inputs
            </a>
            <a href="#return-results" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-20 bg-blue-600 text-white px-3 py-1 rounded">
              Skip to results
            </a>
            <a href="#return-chart" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-36 bg-blue-600 text-white px-3 py-1 rounded">
              Skip to chart
            </a>
          </nav>

          {/* Inputs */}
          <section id="return-inputs" aria-labelledby="inputs-heading">
            <h2 id="inputs-heading" className="sr-only">Stock Parameters</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <FormField 
                id="stock-price" 
                label="Market Price per Share" 
                helpText="$1 - $500"
                error={inputErrors.marketPrice}
                required
              >
                <input
                  id="stock-price"
                  type="number"
                  step="0.01"
                  min="1"
                  max="500"
                  value={inputs.marketPrice}
                  onChange={(e) => handleInputChange('marketPrice', e.target.value)}
                  className="mt-1 rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                  aria-describedby={inputErrors.marketPrice ? "stock-price-error" : "stock-price-help"}
                  aria-invalid={inputErrors.marketPrice ? 'true' : 'false'}
                />
                <div id="stock-price-help" className="sr-only">Enter the current market price per share</div>
              </FormField>

              <FormField 
                id="current-dividend" 
                label="Current Annual Dividend" 
                helpText="$0 - $50"
                error={inputErrors.dividendAmount}
                required
              >
                <input
                  id="current-dividend"
                  type="number"
                  step="0.01"
                  min="0"
                  max="50"
                  value={inputs.dividendAmount}
                  onChange={(e) => handleInputChange('dividendAmount', e.target.value)}
                  className="mt-1 rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                  aria-describedby={inputErrors.dividendAmount ? "current-dividend-error" : "current-dividend-help"}
                  aria-invalid={inputErrors.dividendAmount ? 'true' : 'false'}
                />
                <div id="current-dividend-help" className="sr-only">Enter the current annual dividend per share</div>
              </FormField>

              <FormField 
                id="dividend-growth" 
                label="Expected Growth Rate (%)" 
                helpText="0% - 25%"
                error={inputErrors.growthRate}
                required
              >
                <input
                  id="dividend-growth"
                  type="number"
                  step="0.01"
                  min="0"
                  max="25"
                  value={inputs.growthRate}
                  onChange={(e) => handleInputChange('growthRate', e.target.value)}
                  className="mt-1 rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                  aria-describedby={inputErrors.growthRate ? "dividend-growth-error" : "dividend-growth-help"}
                  aria-invalid={inputErrors.growthRate ? 'true' : 'false'}
                />
                <div id="dividend-growth-help" className="sr-only">Enter the expected annual dividend growth rate</div>
              </FormField>
            </div>
          </section>

          <ValidationMessage errors={inputErrors} />

          {/* Model validity warning */}
          {model && !model.isValid && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg" role="alert">
              <div className="text-yellow-800 text-sm">
                <strong>Warning:</strong> Growth rate must be less than required return for the model to be valid. 
                Current calculation results in: g = {inputs.growthRate.toFixed(2)}%, r = {model.requiredReturn.toFixed(2)}%
              </div>
            </div>
          )}

          {/* Results */}
          <section id="return-results" aria-labelledby="results-heading">
            <h2 id="results-heading" className="sr-only">Calculation Results</h2>
            {model && model.isValid && (
              <ResultCard
                title="Required Return"
                value={`${model.requiredReturn.toFixed(2)}%`}
                subtitle="the return investors demand for this stock"
                description={`Using Gordon Growth Model: r = (D₁ ÷ P) + g | Next year's dividend (D₁): $${model.d1.toFixed(2)}`}
                isValid={model.isValid}
              />
            )}
          </section>

          {/* Screen Reader Data Table */}
          {model && model.isValid && (
            <div className="sr-only">
              <h2>Dividend Cash Flow Data Table</h2>
              <table>
                <caption>Dividend cash flow projections showing growing dividend payments over 10 years</caption>
                <thead>
                  <tr>
                    <th scope="col">Year</th>
                    <th scope="col">Investment ($)</th>
                    <th scope="col">Dividend ($)</th>
                    <th scope="col">Required Return (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.map(row => (
                    <tr key={row.year}>
                      <th scope="row">{row.yearLabel}</th>
                      <td className="text-right">{row.investmentFlow ? `(${Math.abs(row.investmentFlow).toFixed(2)})` : '--'}</td>
                      <td className="text-right">{row.dividendFlow ? `${row.dividendFlow.toFixed(2)}` : '--'}</td>
                      <td className="text-right">{row.requiredReturnLine.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Chart */}
          {model && model.isValid && (
            <section id="return-chart" aria-labelledby="chart-heading">
              <h2 id="chart-heading" className="sr-only">Visual Chart</h2>
              
              <div className="text-center mb-4">
                <h3 className="font-serif text-lg text-slate-700">Equity Cash Flows (In US$) and Resulting Implied Required Return</h3>
                <p className="text-sm text-gray-600 mt-1">(Only the first 10 years are shown)</p>
              </div>
              
              <div className="mb-4 text-sm text-gray-600 flex flex-wrap items-center gap-6" role="img" aria-label="Chart legend">
                <span className="inline-flex items-center">
                  <span className="w-4 h-4 bg-green-500 mr-2 rounded" aria-hidden="true"></span>
                  Dividend Cash Flow
                </span>
                <span className="inline-flex items-center">
                  <span className="w-4 h-4 bg-red-400 mr-2 rounded" aria-hidden="true"></span>
                  Initial Investment
                </span>
                <span className="inline-flex items-center">
                  <span className="w-4 h-4 bg-blue-600 mr-2 rounded" aria-hidden="true"></span>
                  Required Return: {model.requiredReturn.toFixed(2)}%
                </span>
              </div>

              <div className="h-96" 
                   role="img" 
                   aria-labelledby="return-chart-title" 
                   aria-describedby="return-chart-description">
                
                <div className="sr-only">
                  <h3 id="return-chart-title">Required Return and Dividend Growth Chart</h3>
                  <p id="return-chart-description">
                    Bar chart showing initial stock purchase of ${inputs.marketPrice.toFixed(2)} and growing dividend payments starting at ${inputs.dividendAmount.toFixed(2)} growing at {inputs.growthRate.toFixed(2)}% annually over 10 years, 
                    with calculated required return of {model.requiredReturn.toFixed(2)}%
                  </p>
                </div>

                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={chartData}
                    margin={{ top: 30, right: 100, left: 20, bottom: 20 }}
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
                      label={{ value: 'Required Return (%)', angle: 90, position: 'insideRight' }}
                      tickFormatter={(value) => `${value.toFixed(1)}%`}
                      domain={[0, Math.ceil(model.requiredReturn * 1.2)]}
                    />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === 'Required Return') return [`${Number(value).toFixed(2)}%`, name];
                        return [`$${Number(value).toFixed(2)}`, name];
                      }}
                      labelFormatter={(label) => `Year: ${label}`}
                    />
                    
                    <Bar 
                      yAxisId="left" 
                      dataKey="dividendFlow" 
                      stackId="cash" 
                      fill="#10b981" 
                      name="Dividend Cash Flow"
                      label={<CustomLabel />}
                    />
                    <Bar 
                      yAxisId="left" 
                      dataKey="investmentFlow" 
                      stackId="cash" 
                      fill="#f87171" 
                      name="Initial Investment"
                      label={<CustomLabel />}
                    />
                    
                    <Line 
                      yAxisId="right" 
                      type="monotone" 
                      dataKey="requiredReturnLine" 
                      stroke="#2563eb" 
                      strokeWidth={3}
                      dot={false}
                      name="Required Return"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                <strong>Gordon Growth Model (Required Return):</strong> Calculates the minimum return investors 
                require given the current stock price and expected dividend growth. The model assumes dividends 
                grow at a constant rate forever and that growth rate is less than the required return.
              </div>
            </section>
          )}

          {/* Educational Context */}
          <section className="mt-8 p-4 bg-blue-50 rounded-lg" aria-labelledby="education-heading">
            <h2 id="education-heading" className="font-semibold text-blue-800 mb-2">Educational Context</h2>
            <div className="text-sm text-blue-700 space-y-2">
              <p><strong>Required Return:</strong> The minimum return investors demand to compensate for the risk of holding a particular stock.</p>
              <p><strong>Gordon Growth Model Formula:</strong> r = (D₁ ÷ P₀) + g, where r is required return, D₁ is next year's expected dividend, P₀ is current price, and g is dividend growth rate.</p>
              <p><strong>Key Assumptions:</strong> The model assumes constant dividend growth at rate g indefinitely, dividend growth rate is less than the required return, and the stock is held forever.</p>
              <p className="text-xs mt-2"><strong>Limitations:</strong> Model works best for mature companies with stable dividend policies. May not be suitable for growth stocks or companies with irregular dividends.</p>
            </div>
          </section>
        </Card>
      </main>
    </div>
  );
}