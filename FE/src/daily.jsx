import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend)

function DailyRecap() {
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })

  const data = {
    labels: ['Ripe', 'Unripe', 'Overripe'],
    datasets: [
      {
        label: 'Jumlah Buah',
        data: [156, 89, 23],
        backgroundColor: ['#16a34a', '#facc15', '#f97316'],
        borderRadius: 6,
      }
    ]
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="px-6 mb-6 flex items-center gap-7">
        <div className="w-12 h-12 transform scale-[1.75]">
          <img src="/logo.png" alt="PalmCheck Logo" className="w-full h-full object-contain" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-green-800 mb-1">Daily Recap</h1>
          <p className="text-sm text-gray-600">Ringkasan hasil deteksi harian</p>
        </div>
      </div>

      {/* Date Picker */}
      <div className="px-6 mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <label className="text-sm font-medium text-gray-700">Pilih Tanggal:</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* Data Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-6">
        <div className="bg-green-50 rounded-xl shadow p-4">
          <h2 className="text-green-600 font-semibold text-sm mb-2">Ripe Fruits</h2>
          <p className="text-3xl font-bold text-gray-900">156</p>
          <p className="text-sm text-green-600 mt-1">+12% dibanding kemarin</p>
        </div>

        <div className="bg-yellow-50 rounded-xl shadow p-4">
          <h2 className="text-yellow-600 font-semibold text-sm mb-2">Unripe Fruits</h2>
          <p className="text-3xl font-bold text-gray-900">89</p>
          <p className="text-sm text-yellow-600 mt-1">Stabil</p>
        </div>

        <div className="bg-orange-50 rounded-xl shadow p-4">
          <h2 className="text-orange-600 font-semibold text-sm mb-2">Overripe Fruits</h2>
          <p className="text-3xl font-bold text-gray-900">23</p>
          <p className="text-sm text-red-500 mt-1">+5% dibanding kemarin</p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-xl shadow p-6 mt-6 mx-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Trend Hari Ini</h3>
        <Bar data={data} options={options} height={200} />
      </div>

      {/* Buttons */}
      <div className="mt-8 px-6 flex flex-col sm:flex-row gap-4">
        <Link to="/">
          <button className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
            ← Kembali ke Dashboard
          </button>
        </Link>
        <button className="px-5 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-100 transition">
          ⬇️ Export Data
        </button>
      </div>
    </div>
  )
}

export default DailyRecap
