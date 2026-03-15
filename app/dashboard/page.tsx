"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { Wallet, TrendingUp, Users, Clock } from 'lucide-react'

export default function DashboardOverview() {
  const [payrollCost, setPayrollCost] = useState(0)
  const [attendanceData, setAttendanceData] = useState<any[]>([])
  const [statusData, setStatusData] = useState<any[]>([])
  const supabase = createClient()

  // Modern Green-Themed Colors for Donut Chart
  const STATUS_COLORS: Record<string, string> = {
    interview: '#f59e0b', // Amber
    probation: '#0ea5e9', // Sky Blue
    active: '#16a34a',    // Emerald Green (Primary)
    resigning: '#ef4444'  // Rose Red
  }

  useEffect(() => {
    async function fetchAnalytics() {
      // 1. Fetch Payroll
      const { data: activeEmployees } = await supabase
        .from('employees')
        .select('base_salary')
        .eq('status', 'active')
      
      const totalBase = activeEmployees?.reduce((sum, emp) => sum + Number(emp.base_salary), 0) || 0
      setPayrollCost(totalBase)

      // 2. Fetch Attendance
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
      const { data: attendance } = await supabase
        .from('attendance')
        .select('is_late')
        .gte('date', startOfMonth)

      const lateCount = attendance?.filter(a => a.is_late).length || 0
      const onTimeCount = attendance?.filter(a => !a.is_late).length || 0
      setAttendanceData([
        { name: 'On Time', count: onTimeCount, fill: '#16a34a' }, // Emerald
        { name: 'Late', count: lateCount, fill: '#ef4444' }       // Red
      ])

      // 3. Fetch Employee Status Ratio
      const { data: employees } = await supabase.from('employees').select('status')
      const statusCounts = employees?.reduce((acc: any, emp) => {
        acc[emp.status] = (acc[emp.status] || 0) + 1
        return acc
      }, {})

      const formattedStatusData = Object.keys(statusCounts || {}).map(status => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value: statusCounts[status],
        color: STATUS_COLORS[status] || '#cbd5e1'
      }))
      setStatusData(formattedStatusData)
    }

    fetchAnalytics()
  }, [])

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Overview Analytics</h2>
        <p className="text-slate-500 mt-1">Here is what is happening across your organization today.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* KPI CARD: Total Payroll */}
        <Card className="col-span-1 shadow-sm border-0 ring-1 ring-slate-100 rounded-2xl bg-gradient-to-br from-white to-emerald-50/50 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-emerald-600">
            <TrendingUp size={80} />
          </div>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600">Est. Monthly Payroll</CardTitle>
            <div className="bg-white p-2 rounded-lg shadow-sm">
              <Wallet className="h-5 w-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 tracking-tight">฿{payrollCost.toLocaleString()}</div>
            <p className="text-xs text-emerald-600 font-medium mt-2 bg-emerald-100/50 inline-block px-2 py-1 rounded-md">
              *Base salary only
            </p>
          </CardContent>
        </Card>

        {/* BAR CHART: Attendance */}
        <Card className="col-span-1 md:col-span-2 shadow-sm border-0 ring-1 ring-slate-100 rounded-2xl">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-400" />
              <CardTitle className="text-sm font-semibold text-slate-600">Monthly Attendance Stats</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="h-[250px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <XAxis type="number" tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" width={80} tick={{ fill: '#64748b', fontWeight: 500 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{fill: '#f1f5f9'}} 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* DONUT CHART: Employee Status */}
        <Card className="col-span-1 md:col-span-3 lg:col-span-1 shadow-sm border-0 ring-1 ring-slate-100 rounded-2xl">
          <CardHeader className="pb-0">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-400" />
              <CardTitle className="text-sm font-semibold text-slate-600">Workforce Status</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="h-[280px] flex flex-col items-center justify-center">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 500, color: '#64748b' }}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center text-slate-400">
                <Users className="h-10 w-10 mb-2 opacity-20" />
                <p className="text-sm font-medium">No workforce data</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}