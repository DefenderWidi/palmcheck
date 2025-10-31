// src/pages/yield.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

function StatCard({ title, value, sub, accent = "green" }) {
  const colorMap = {
    green: "bg-green-50 text-green-700",
    yellow: "bg-yellow-50 text-yellow-700",
    blue: "bg-blue-50 text-blue-700",
    red: "bg-red-50 text-red-700",
    slate: "bg-slate-50 text-slate-700",
  };
  return (
    <div className={`rounded-xl shadow p-4 ${colorMap[accent] || colorMap.slate}`}>
      <div className="text-sm font-medium opacity-80">{title}</div>
      <div className="text-3xl font-bold text-gray-900 mt-1">{value}</div>
      {sub && <div className="text-xs mt-1 opacity-70">{sub}</div>}
    </div>
  );
}

function SectionCard({ title, children, right }) {
  return (
    <div className="bg-white rounded-xl shadow p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-700">{title}</h2>
        {right}
      </div>
      {children}
    </div>
  );
}

export default function Yield() {
  const [locations, setLocations] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // --- Fetch locations (reuse your API & pattern)
  useEffect(() => {
    const fetchLocations = () => {
      fetch("http://172.20.10.3:5000/api/locations")
        .then((res) => res.json())
        .then((data) => {
          setLocations(data || []);
          setLastUpdated(new Date());
        })
        .catch((err) => console.error("❌ Error fetching locations:", err));
    };
    fetchLocations();
    const interval = setInterval(fetchLocations, 5000); // auto refresh tiap 5 detik
    return () => clearInterval(interval);
  }, []);

  // --- Hitung status buah dari data realtime
  const ripeCount = locations.filter((l) => l.status === "ripe").length;
  const unripeCount = locations.filter((l) => l.status === "unripe").length;
  const overripeCount = locations.filter((l) => l.status === "overripe").length;
  const totalCount = locations.length || 0;
  const ripeRatio = totalCount > 0 ? ripeCount / totalCount : 0;

  // --- Parameter perhitungan (bisa diubah user)
  const [params, setParams] = useState({
    // Skala kebun/blok
    areaHa: 10, // luas area panen (ha)
    treesPerHa: 136, // kerapatan pohon/ha (default umum ±125–150, bisa diubah)

    // Siklus panen
    bunchesPerTreePerCycle: 1.2, // tandan matang per pohon dalam 1 siklus
    coveragePercent: 80, // % area yang tercakup deteksi saat ini

    // Bobot & ekstraksi
    avgBunchWeightKg: 20, // kg/tandan (bisa 15–25 kg, sesuaikan kebun)
    oerPercent: 21, // Oil Extraction Rate (%) → CPO dari TBS

    // Harga (opsi: pakai harga TBS saja untuk revenue cepat)
    priceTbsPerTon: 2000000, // Rp/ton TBS (isi sesuai pasar lokal)

    // Loss / efisiensi (baseline vs pakai PalmCheck)
    lossManualPercent: 15, // % potensi TBS hilang (salah panen/terlambat) metode manual
    lossPalmcheckPercent: 7, // % setelah pakai PalmCheck

    // Biaya & horizon ROI
    costModel: "subscription", // "subscription" | "capex"
    monthlySubscriptionRp: 3000000, // jika subscription
    deviceCapexRp: 50000000, // jika beli perangkat
    horizonMonths: 12, // perhitungan ROI
  });

  const onParamChange = (key, value) =>
    setParams((p) => ({ ...p, [key]: value }));

  // --- Perhitungan estimasi
  const metrics = useMemo(() => {
    const {
      areaHa,
      treesPerHa,
      bunchesPerTreePerCycle,
      coveragePercent,
      avgBunchWeightKg,
      oerPercent,
      priceTbsPerTon,
      lossManualPercent,
      lossPalmcheckPercent,
      costModel,
      monthlySubscriptionRp,
      deviceCapexRp,
      horizonMonths,
    } = params;

    // Populasi pohon
    const totalTrees = areaHa * treesPerHa;

    // Proporsi area tercakup & proporsi pohon dengan tandan matang (ripeRatio dari data)
    const coverage = Math.max(0, Math.min(coveragePercent, 100)) / 100;
    const effectiveRipeRatio = ripeRatio; // dari deteksi realtime
    // Estimasi jumlah tandan matang dalam siklus
    const estRipeBunches =
      totalTrees * effectiveRipeRatio * bunchesPerTreePerCycle * coverage;

    // Estimasi tonase TBS (t)
    const estTbsTon = (estRipeBunches * avgBunchWeightKg) / 1000;

    // Estimasi CPO (t)
    const estCpoTon = estTbsTon * (oerPercent / 100);

    // Revenue kotor berbasis TBS (Rp)
    const grossRevenueRp = estTbsTon * priceTbsPerTon;

    // Efek loss (manual vs PalmCheck)
    const lossManual = Math.max(0, Math.min(lossManualPercent, 100)) / 100;
    const lossPalm = Math.max(0, Math.min(lossPalmcheckPercent, 100)) / 100;

    const netRevenueManualRp = grossRevenueRp * (1 - lossManual);
    const netRevenuePalmRp = grossRevenueRp * (1 - lossPalm);
    const incrementalRevenueRp = Math.max(0, netRevenuePalmRp - netRevenueManualRp);

    // Biaya (horizon)
    let totalCostRp = 0;
    if (costModel === "subscription") {
      totalCostRp = monthlySubscriptionRp * horizonMonths;
    } else {
      totalCostRp = deviceCapexRp; // sederhana: anggap capex dikeluarkan di awal
    }

    const roi =
      totalCostRp > 0 ? ((incrementalRevenueRp * (horizonMonths / 1)) - totalCostRp) / totalCostRp : 0;
    // *Catatan:* incrementalRevenueRp di sini dianggap per siklus.
    // Jika siklus panen terjadi tiap bulan, kamu bisa sesuaikan multipliernya.
    // Untuk sederhana, asumsikan 1 siklus = 1 bulan. Ubah sesuai kebutuhan lapangan.

    // Payback period (bulan) jika ada incremental revenue bulanan > 0
    const monthlyIncremental = incrementalRevenueRp; // asumsi per siklus = bulanan
    const paybackMonths =
      monthlyIncremental > 0
        ? (costModel === "subscription"
            ? monthlySubscriptionRp / monthlyIncremental
            : deviceCapexRp / monthlyIncremental)
        : Infinity;

    return {
      totalTrees,
      estRipeBunches,
      estTbsTon,
      estCpoTon,
      grossRevenueRp,
      netRevenueManualRp,
      netRevenuePalmRp,
      incrementalRevenueRp,
      totalCostRp,
      roi,
      paybackMonths,
    };
  }, [params, ripeRatio]);

  const fmt = (n) =>
    isFinite(n)
      ? n.toLocaleString("id-ID", { maximumFractionDigits: 2 })
      : "—";

  return (
    <div className="min-h-screen bg-green-50 p-6">
      {/* Header */}
      <header className="mb-6 flex justify-between items-start">
        <div className="px-6 mb-1">
          <div className="flex items-center gap-7">
            <div className="w-12 h-12 transform scale-[1.75]">
              <img src="/logo.png" alt="PalmCheck Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-green-800">
                PalmCheck: Yield Estimation & ROI Tracking
              </h1>
              <p className="text-green-700 text-sm">
                Estimasi hasil & nilai ekonomi berbasis deteksi realtime
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="flex items-center gap-1 text-green-600 font-medium">
            <span className="h-2 w-2 bg-green-500 rounded-full inline-block" />
            Analytics Online
          </span>
          <span>• Last updated: {lastUpdated.toLocaleTimeString()}</span>
        </div>
      </header>

      {/* Top stats from realtime */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Ripe Detected" value={fmt(ripeCount)} sub="Real-time ripe count" accent="green" />
        <StatCard title="Unripe Detected" value={fmt(unripeCount)} sub="Real-time unripe count" accent="yellow" />
        <StatCard title="Overripe Detected" value={fmt(overripeCount)} sub="Real-time overripe count" accent="red" />
        <StatCard
          title="Ripe Ratio"
          value={`${(ripeRatio * 100).toFixed(1)}%`}
          sub={`Based on ${fmt(locations.length)} data`}
          accent="blue"
        />
      </div>

      {/* Layout: Parameters (left) + Estimation (right) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* LEFT: Parameters */}
        <div className="xl:col-span-1 space-y-6">
          <SectionCard
            title="Parameter Area & Siklus"
            right={<span className="text-xs text-gray-400">Sesuaikan dengan kondisi kebun</span>}
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Luas Area (ha)</label>
                <input
                  type="number"
                  className="mt-1 w-full rounded border p-2"
                  value={params.areaHa}
                  onChange={(e) => onParamChange("areaHa", parseFloat(e.target.value || 0))}
                  min={0}
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Pohon/ha</label>
                <input
                  type="number"
                  className="mt-1 w-full rounded border p-2"
                  value={params.treesPerHa}
                  onChange={(e) => onParamChange("treesPerHa", parseFloat(e.target.value || 0))}
                  min={0}
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Tandan/Pohon/Siklus</label>
                <input
                  type="number"
                  step="0.1"
                  className="mt-1 w-full rounded border p-2"
                  value={params.bunchesPerTreePerCycle}
                  onChange={(e) =>
                    onParamChange("bunchesPerTreePerCycle", parseFloat(e.target.value || 0))
                  }
                  min={0}
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Coverage Deteksi (%)</label>
                <input
                  type="number"
                  className="mt-1 w-full rounded border p-2"
                  value={params.coveragePercent}
                  onChange={(e) => onParamChange("coveragePercent", parseFloat(e.target.value || 0))}
                  min={0}
                  max={100}
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Bobot, OER & Harga">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Bobot Rata2/Tandan (kg)</label>
                <input
                  type="number"
                  className="mt-1 w-full rounded border p-2"
                  value={params.avgBunchWeightKg}
                  onChange={(e) =>
                    onParamChange("avgBunchWeightKg", parseFloat(e.target.value || 0))
                  }
                  min={0}
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">OER (%)</label>
                <input
                  type="number"
                  step="0.1"
                  className="mt-1 w-full rounded border p-2"
                  value={params.oerPercent}
                  onChange={(e) => onParamChange("oerPercent", parseFloat(e.target.value || 0))}
                  min={0}
                  max={100}
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Harga TBS (Rp/ton)</label>
                <input
                  type="number"
                  className="mt-1 w-full rounded border p-2"
                  value={params.priceTbsPerTon}
                  onChange={(e) =>
                    onParamChange("priceTbsPerTon", parseFloat(e.target.value || 0))
                  }
                  min={0}
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Loss & Biaya (ROI)">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Loss Manual (%)</label>
                <input
                  type="number"
                  className="mt-1 w-full rounded border p-2"
                  value={params.lossManualPercent}
                  onChange={(e) =>
                    onParamChange("lossManualPercent", parseFloat(e.target.value || 0))
                  }
                  min={0}
                  max={100}
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Loss PalmCheck (%)</label>
                <input
                  type="number"
                  className="mt-1 w-full rounded border p-2"
                  value={params.lossPalmcheckPercent}
                  onChange={(e) =>
                    onParamChange("lossPalmcheckPercent", parseFloat(e.target.value || 0))
                  }
                  min={0}
                  max={100}
                />
              </div>

              <div className="col-span-2">
                <label className="text-sm text-gray-600">Model Biaya</label>
                <div className="mt-1 flex gap-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="costModel"
                      checked={params.costModel === "subscription"}
                      onChange={() => onParamChange("costModel", "subscription")}
                    />
                    Subscription
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="costModel"
                      checked={params.costModel === "capex"}
                      onChange={() => onParamChange("costModel", "capex")}
                    />
                    CAPEX
                  </label>
                </div>
              </div>

              {params.costModel === "subscription" ? (
                <>
                  <div>
                    <label className="text-sm text-gray-600">Biaya Bulanan (Rp)</label>
                    <input
                      type="number"
                      className="mt-1 w-full rounded border p-2"
                      value={params.monthlySubscriptionRp}
                      onChange={(e) =>
                        onParamChange("monthlySubscriptionRp", parseFloat(e.target.value || 0))
                      }
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Horizon (bulan)</label>
                    <input
                      type="number"
                      className="mt-1 w-full rounded border p-2"
                      value={params.horizonMonths}
                      onChange={(e) =>
                        onParamChange("horizonMonths", parseFloat(e.target.value || 0))
                      }
                      min={1}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-sm text-gray-600">Harga Perangkat (Rp)</label>
                    <input
                      type="number"
                      className="mt-1 w-full rounded border p-2"
                      value={params.deviceCapexRp}
                      onChange={(e) =>
                        onParamChange("deviceCapexRp", parseFloat(e.target.value || 0))
                      }
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Horizon (bulan)</label>
                    <input
                      type="number"
                      className="mt-1 w-full rounded border p-2"
                      value={params.horizonMonths}
                      onChange={(e) =>
                        onParamChange("horizonMonths", parseFloat(e.target.value || 0))
                      }
                      min={1}
                    />
                  </div>
                </>
              )}
            </div>
          </SectionCard>
        </div>

        {/* RIGHT: Estimation & ROI */}
        <div className="xl:col-span-2 space-y-6">
          <SectionCard title="Yield Estimation (Per Siklus)">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Pohon (estimasi)"
                value={fmt(metrics.totalTrees)}
                sub={`${fmt(params.areaHa)} ha × ${fmt(params.treesPerHa)} pohon/ha`}
                accent="slate"
              />
              <StatCard
                title="Tandan Matang (est.)"
                value={fmt(metrics.estRipeBunches)}
                sub={`${(params.bunchesPerTreePerCycle).toFixed(1)} tandan/pohon/siklus`}
                accent="green"
              />
              <StatCard
                title="TBS (ton)"
                value={fmt(metrics.estTbsTon)}
                sub={`${fmt(params.avgBunchWeightKg)} kg/tandan`}
                accent="yellow"
              />
              <StatCard
                title="CPO (ton)"
                value={fmt(metrics.estCpoTon)}
                sub={`OER ${params.oerPercent}%`}
                accent="blue"
              />
            </div>
          </SectionCard>

          <SectionCard title="Revenue & Loss Comparison (Per Siklus)">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <StatCard
                title="Revenue Kotor (Rp)"
                value={`Rp ${fmt(metrics.grossRevenueRp)}`}
                sub={`Harga TBS Rp ${fmt(params.priceTbsPerTon)}/ton`}
                accent="slate"
              />
              <StatCard
                title="Net Manual (Rp)"
                value={`Rp ${fmt(metrics.netRevenueManualRp)}`}
                sub={`Loss manual ${params.lossManualPercent}%`}
                accent="red"
              />
              <StatCard
                title="Net PalmCheck (Rp)"
                value={`Rp ${fmt(metrics.netRevenuePalmRp)}`}
                sub={`Loss PalmCheck ${params.lossPalmcheckPercent}%`}
                accent="green"
              />
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border rounded-xl p-4">
                <div className="text-sm text-gray-600">Incremental Revenue / Siklus</div>
                <div className="text-2xl font-bold text-green-700 mt-1">
                  Rp {fmt(metrics.incrementalRevenueRp)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Selisih Net PalmCheck vs Manual
                </div>
              </div>

              <div className="bg-white border rounded-xl p-4">
                <div className="text-sm text-gray-600">Total Biaya ({params.costModel === "subscription" ? `${params.horizonMonths} bln` : "CAPEX"})</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  Rp {fmt(metrics.totalCostRp)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {params.costModel === "subscription" ? "Subscription horizon" : "Biaya perangkat"}
                </div>
              </div>

              <div className="bg-white border rounded-xl p-4">
                <div className="text-sm text-gray-600">ROI (Horizon)</div>
                <div className={`text-2xl font-bold mt-1 ${metrics.roi >= 0 ? "text-green-700" : "text-red-600"}`}>
                  {(metrics.roi * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {(isFinite(metrics.paybackMonths) && metrics.paybackMonths > 0)
                    ? `Perkiraan payback: ${fmt(metrics.paybackMonths)} bln`
                    : "Payback: —"}
                </div>
              </div>
            </div>
          </SectionCard>

          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <Link to="/">
              <button className="px-6 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition">
                ⬅️ Back to Dashboard
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
