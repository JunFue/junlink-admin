"use client";

import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatCurrency } from "@/lib/utils/formatters";
import type { CashoutWithDetails, CashoutBreakdownItem } from "@/app/transaction/services/cashoutsService";

interface CashoutsChartProps {
  cashouts?: CashoutWithDetails[];
  breakdown?: CashoutBreakdownItem[];
}

export default function CashoutsChart({ cashouts, breakdown }: CashoutsChartProps) {
  const { overviewData, opexData, remittanceData } = useMemo(() => {
    let rawOpex = 0;
    let rawCogs = 0;
    let rawRemit = 0;

    const opexMap: Record<string, number> = {};
    const remitMap: Record<string, number> = {};

    if (breakdown) {
      breakdown.forEach((item) => {
        const amt = Number(item.total_amount) || 0;
        if (item.cashout_type === "OPEX") {
          rawOpex += amt;
          const sub = item.subcategory || "Uncategorized";
          opexMap[sub] = (opexMap[sub] || 0) + amt;
        } else if (item.cashout_type === "COGS") {
          rawCogs += amt;
        } else if (item.cashout_type === "REMITTANCE") {
          rawRemit += amt;
          const sub = item.subcategory || "Uncategorized";
          remitMap[sub] = (remitMap[sub] || 0) + amt;
        }
      });
    } else if (cashouts) {
      cashouts.forEach((c) => {
        const amt = Number(c.amount) || 0;
        if (c.cashout_type === "OPEX") {
          rawOpex += amt;
          const sub = c.classification?.name || "Uncategorized";
          opexMap[sub] = (opexMap[sub] || 0) + amt;
        } else if (c.cashout_type === "COGS") {
          rawCogs += amt;
        } else if (c.cashout_type === "REMITTANCE") {
          rawRemit += amt;
          const sub = c.remittance_categories?.name || "Uncategorized";
          remitMap[sub] = (remitMap[sub] || 0) + amt;
        }
      });
    }

    const overview = [
      { name: "COGS", value: rawCogs, color: "#f97316" }, // orange-500
      { name: "OPEX", value: rawOpex, color: "#3b82f6" }, // blue-500
      { name: "REMITTANCE", value: rawRemit, color: "#a855f7" }, // purple-500
    ].filter((d) => d.value > 0);

    const formatBarData = (map: Record<string, number>) =>
      Object.entries(map)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value); // Sort descending

    return {
      overviewData: overview,
      opexData: formatBarData(opexMap),
      remittanceData: formatBarData(remitMap),
    };
  }, [cashouts, breakdown]);

  const hasData = overviewData.length > 0;

  if (!hasData) {
    return (
      <div className="flex justify-center items-center h-48 bg-muted/20 border border-border rounded-xl text-muted-foreground text-sm">
        Not enough cashout data to generate charts.
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border p-3 rounded-lg shadow-md text-sm">
          <p className="font-semibold text-foreground mb-1">
            {label || payload[0].name}
          </p>
          <p className="text-muted-foreground">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
      {/* High Level Overview */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          Cashouts Overview
        </h3>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={overviewData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
              >
                {overviewData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* OPEX Breakdown */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          OPEX Breakdown
        </h3>
        {opexData.length > 0 ? (
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={opexData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" opacity={0.2} />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  width={100}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "transparent" }} />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">
            No OPEX records found.
          </div>
        )}
      </div>

      {/* Remittance Breakdown */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          Remittance Breakdown
        </h3>
        {remittanceData.length > 0 ? (
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={remittanceData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" opacity={0.2} />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  width={100}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "transparent" }} />
                <Bar dataKey="value" fill="#a855f7" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">
            No Remittance records found.
          </div>
        )}
      </div>
    </div>
  );
}
