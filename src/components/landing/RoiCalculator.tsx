"use client";

import { useState } from "react";
import { Calculator, TrendingUp, Clock, DollarSign } from "lucide-react";

const PROGRAM = {
  id: "partnership",
  label: "Asset Recovery Agent Partnership",
  agentFee: 0.15, // 50% of 30%
  cost: 995,
} as const;

function calcResults(hoursPerWeek: number, avgSurplus: number) {
  // Conservative: 2 meaningful lead contacts per hour, 3% close rate
  const monthlyContacts = hoursPerWeek * 4 * 2;
  const monthlyCloses = monthlyContacts * 0.03;
  const revenuePerClose = avgSurplus * PROGRAM.agentFee;
  const monthlyRevenue = monthlyCloses * revenuePerClose;
  const breakEvenMonths =
    monthlyRevenue > 0 ? PROGRAM.cost / monthlyRevenue : 0;

  return {
    monthlyContacts,
    monthlyCloses,
    monthlyRevenue,
    breakEvenMonths,
    program: PROGRAM,
  };
}

function fmt(n: number) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export function RoiCalculator() {
  const [hoursPerWeek, setHoursPerWeek] = useState(10);
  const [avgSurplus, setAvgSurplus] = useState(25000);

  const { monthlyCloses, monthlyRevenue, breakEvenMonths, program } =
    calcResults(hoursPerWeek, avgSurplus);

  return (
    <section className="py-16 bg-gradient-to-br from-[#1e3a5f] to-[#2d4a8a]">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-white/10 text-white text-sm font-medium px-4 py-1.5 rounded-full mb-4">
              <Calculator className="h-4 w-4" />
              Revenue Calculator
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
              What Can You Earn?
            </h2>
            <p className="text-blue-200 max-w-xl mx-auto">
              Adjust the inputs to see your projected monthly revenue based on
              hours worked and your market.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-start">
            {/* Inputs */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 space-y-6">
              {/* Program */}
              <div>
                <label className="block text-sm font-medium text-blue-100 mb-2">
                  Program
                </label>
                <div className="bg-white text-[#1e3a5f] text-sm font-semibold px-4 py-2.5 rounded-lg">
                  {program.label}
                </div>
                <p className="text-xs text-blue-300 mt-1.5">
                  You keep 50% of the 30% recovery fee (15% of surplus). State
                  caps may apply -- Texas caps recovery agent fees at 20%.
                </p>
              </div>

              {/* Hours Per Week */}
              <div>
                <label className="flex justify-between text-sm font-medium text-blue-100 mb-2">
                  <span>Hours Per Week</span>
                  <span className="text-white font-bold">
                    {hoursPerWeek} hrs
                  </span>
                </label>
                <input
                  type="range"
                  min={2}
                  max={40}
                  step={1}
                  value={hoursPerWeek}
                  onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                  className="w-full accent-white"
                />
                <div className="flex justify-between text-xs text-blue-300 mt-1">
                  <span>2 hrs</span>
                  <span>40 hrs</span>
                </div>
              </div>

              {/* Average Surplus */}
              <div>
                <label className="flex justify-between text-sm font-medium text-blue-100 mb-2">
                  <span>Avg Surplus Amount</span>
                  <span className="text-white font-bold">
                    {fmt(avgSurplus)}
                  </span>
                </label>
                <input
                  type="range"
                  min={5000}
                  max={150000}
                  step={5000}
                  value={avgSurplus}
                  onChange={(e) => setAvgSurplus(Number(e.target.value))}
                  className="w-full accent-white"
                />
                <div className="flex justify-between text-xs text-blue-300 mt-1">
                  <span>$5K</span>
                  <span>$150K</span>
                </div>
              </div>
            </div>

            {/* Outputs */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-5 flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">
                    Projected Monthly Revenue
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {fmt(monthlyRevenue)}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {monthlyCloses.toFixed(1)} closes ×{" "}
                    {fmt(avgSurplus * program.agentFee)} each
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Break-Even Timeline</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {breakEvenMonths < 1
                      ? "< 1 month"
                      : breakEvenMonths > 24
                      ? "> 24 months"
                      : `${breakEvenMonths.toFixed(1)} months`}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    to recover ${program.cost.toLocaleString()} program
                    investment
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">
                    Projected Annual Revenue
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {fmt(monthlyRevenue * 12)}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    at current output pace
                  </p>
                </div>
              </div>

              <p className="text-xs text-blue-300 leading-relaxed px-1">
                Estimates assume 2 lead contacts/hr and a 3% close rate —
                conservative industry benchmarks for new agents. Individual
                results vary based on market, outreach quality, and follow-up
                consistency.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
