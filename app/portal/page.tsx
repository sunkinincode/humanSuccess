"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from "@/components/ui/badge"
import { Clock, CalendarHeart, Receipt, Settings, Lock, Leaf, LogOut, Printer, CheckCircle2 } from 'lucide-react'

type LeaveBalances = { sick: number; personal: number; annual: number; }

export default function EmployeePortal() {
  const [employee, setEmployee] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("time")
  
  const [todayAttendance, setTodayAttendance] = useState<any>(null)
  const [timeLoading, setTimeLoading] = useState(false)

  const [leaveType, setLeaveType] = useState<keyof LeaveBalances>('sick')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')
  const [leaveLoading, setLeaveLoading] = useState(false)
  const [balances, setBalances] = useState<LeaveBalances>({ sick: 30, personal: 3, annual: 6 })

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchEmployeeData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return; }

      const { data: empData } = await supabase.from('employees').select('*').eq('user_id', user.id).single()
      if (empData) {
        setEmployee(empData)
        
        const today = new Date().toISOString().split('T')[0]
        const { data: attData } = await supabase.from('attendance').select('*').eq('employee_id', empData.id).eq('date', today).single()
        if (attData) setTodayAttendance(attData)

        const { data: pastLeaves } = await supabase.from('leave_requests').select('leave_type, start_date, end_date').eq('employee_id', empData.id).in('status', ['approved', 'pending'])
        if (pastLeaves) {
          let usedSick = 0; let usedPersonal = 0; let usedAnnual = 0;
          pastLeaves.forEach(leave => {
            const start = new Date(leave.start_date).getTime()
            const end = new Date(leave.end_date).getTime()
            const daysUsed = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1
            if (leave.leave_type === 'sick') usedSick += daysUsed
            if (leave.leave_type === 'personal') usedPersonal += daysUsed
            if (leave.leave_type === 'annual') usedAnnual += daysUsed
          })
          setBalances({ sick: Math.max(0, 30 - usedSick), personal: Math.max(0, 3 - usedPersonal), annual: Math.max(0, 6 - usedAnnual) })
        }
      }
      setLoading(false)
    }
    fetchEmployeeData()
  }, [])

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/'); }

  const handleClockIn = async () => {
    setTimeLoading(true)
    const now = new Date(); const today = now.toISOString().split('T')[0]
    const { data, error } = await supabase.from('attendance').insert({ employee_id: employee.id, date: today, clock_in_time: now.toISOString() }).select().single()
    if (data) { setTodayAttendance(data); alert("Clocked in successfully!"); } else { alert("Error clocking in: " + error?.message); }
    setTimeLoading(false)
  }

  const handleClockOut = async () => {
    setTimeLoading(true)
    const { data, error } = await supabase.from('attendance').update({ clock_out_time: new Date().toISOString() }).eq('id', todayAttendance.id).select().single()
    if (data) { setTodayAttendance(data); alert("Clocked out successfully!"); } else { alert("Error clocking out: " + error?.message); }
    setTimeLoading(false)
  }

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLeaveLoading(true)
    const newStart = new Date(startDate).getTime()
    const newEnd = new Date(endDate).getTime()

    if (newEnd < newStart) { alert("⚠️ ERROR: End Date cannot be before Start Date."); setLeaveLoading(false); return; }
    const requestedDays = Math.round((newEnd - newStart) / (1000 * 60 * 60 * 24)) + 1

    if (requestedDays > balances[leaveType]) { alert(`⚠️ QUOTA ERROR: You only have ${balances[leaveType]} days of ${leaveType} leave remaining.`); setLeaveLoading(false); return; }

    const { data: existingLeaves, error: fetchError } = await supabase.from('leave_requests').select('start_date, end_date').eq('employee_id', employee.id).in('status', ['pending', 'approved'])
    if (fetchError) { alert("Error checking leave history."); setLeaveLoading(false); return; }

    const isOverlapping = existingLeaves?.some(leave => {
      const existingStart = new Date(leave.start_date).getTime(); const existingEnd = new Date(leave.end_date).getTime();
      return newStart <= existingEnd && newEnd >= existingStart
    })
    if (isOverlapping) { alert("⚠️ OVERLAP ERROR: You already have a pending or approved leave request during these dates."); setLeaveLoading(false); return; }

    const { error: insertError } = await supabase.from('leave_requests').insert({ employee_id: employee.id, leave_type: leaveType, start_date: startDate, end_date: endDate, reason: reason, status: 'pending' })
    if (!insertError) {
      alert(`Success! Requested ${requestedDays} day(s) of ${leaveType} leave.`)
      setBalances(prev => ({ ...prev, [leaveType]: prev[leaveType] - requestedDays }))
      setStartDate(''); setEndDate(''); setReason('');
    }
    setLeaveLoading(false)
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) return alert("Passwords do not match!")
    if (newPassword.length < 6) return alert("Password must be at least 6 characters.")
    setPasswordLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (!error) { alert("Password updated successfully!"); setNewPassword(''); setConfirmPassword(''); }
    setPasswordLoading(false)
  }

  // POPUP PRINT FORMAT FOR EMPLOYEE
  const handlePrintPayslip = () => {
    const printContent = `
      <html>
        <head>
          <title>Payslip - ${employee?.first_name} ${employee?.last_name}</title>
          <style>
            body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #000; line-height: 1.6; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 20px; }
            .header h1 { margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; }
            .header h2 { margin: 5px 0 15px 0; font-size: 16px; font-weight: normal; }
            .divider { border-bottom: 2px solid #000; margin-bottom: 20px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 14px;}
            .col { flex: 1; }
            .label { font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 30px; margin-bottom: 30px; }
            th, td { padding: 12px 10px; text-align: left; border-bottom: 1px solid #ddd; font-size: 14px; }
            th { border-bottom: 2px solid #000; font-weight: bold; text-transform: uppercase; }
            .right { text-align: right; }
            .total-row td { border-top: 2px solid #000; border-bottom: 2px solid #000; font-weight: bold; font-size: 16px; }
            .signatures { margin-top: 80px; display: flex; justify-content: flex-end; }
            .sig-box { text-align: center; width: 250px; }
            .sig-line { border-top: 1px solid #000; margin-top: 40px; padding-top: 5px; font-size: 14px; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="header">
            <h1>HUMAN SUCCESS CO., LTD.</h1>
            <h2>Official Payslip Document</h2>
          </div>
          <div class="divider"></div>
          <div class="row">
            <div class="col"><span class="label">Employee Name:</span> ${employee?.first_name} ${employee?.last_name}</div>
            <div class="col"><span class="label">Position:</span> ${employee?.position || 'Employee'}</div>
          </div>
          <div class="row">
            <div class="col"><span class="label">Period:</span> ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</div>
            <div class="col"><span class="label">Date Issued:</span> ${new Date().toLocaleDateString()}</div>
          </div>
          <div class="divider"></div>
          
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th class="right">Earnings</th>
                <th class="right">Deductions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Basic Salary</td>
                <td class="right">฿25,000.00</td>
                <td class="right">-</td>
              </tr>
              <tr>
                <td>Performance Bonus</td>
                <td class="right">฿2,500.00</td>
                <td class="right">-</td>
              </tr>
              <tr>
                <td>Social Security (5%)</td>
                <td class="right">-</td>
                <td class="right">฿750.00</td>
              </tr>
              <tr>
                <td>Withholding Tax</td>
                <td class="right">-</td>
                <td class="right">฿500.00</td>
              </tr>
              <tr class="total-row">
                <td>Net Pay Transfer</td>
                <td colspan="2" class="right">฿26,250.00</td>
              </tr>
            </tbody>
          </table>

          <div class="signatures">
            <div class="sig-box">
               <div class="sig-line">Authorized Signature</div>
               <div style="margin-top: 5px; text-align: left; font-size: 14px;">Date: ____/____/____</div>
            </div>
          </div>
        </body>
      </html>
    `
    const printWindow = window.open('', '_blank', 'width=800,height=800')
    if (printWindow) { printWindow.document.write(printContent); printWindow.document.close(); }
  }

  if (loading) return <div className="flex h-screen items-center justify-center text-slate-500 animate-pulse">Loading Portal...</div>

  let dynamicDaysRequested = 0;
  if (startDate && endDate) {
    const s = new Date(startDate).getTime(); const e = new Date(endDate).getTime();
    if (e >= s) dynamicDaysRequested = Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm"><Leaf className="w-6 h-6" /></div><div><h1 className="font-bold text-slate-900 text-lg leading-tight">Human Success</h1><p className="text-xs text-slate-500 font-medium">Employee Portal</p></div></div>
        <div className="flex items-center gap-6">
          <div className="text-right hidden md:block"><p className="text-sm font-bold text-slate-900">{employee?.first_name} {employee?.last_name}</p><p className="text-xs text-emerald-600 font-medium">{employee?.position}</p></div>
          <button onClick={handleLogout} className="text-slate-500 hover:text-rose-600 transition-colors"><LogOut className="w-5 h-5" /></button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-4 h-14 bg-white border border-slate-200 p-1 rounded-2xl mb-8 shadow-sm mx-auto">
            <TabsTrigger value="time" className="rounded-xl text-sm data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 transition-all"><Clock className="w-4 h-4 mr-2 hidden sm:block"/> Time</TabsTrigger>
            <TabsTrigger value="leave" className="rounded-xl text-sm data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 transition-all"><CalendarHeart className="w-4 h-4 mr-2 hidden sm:block"/> Leave</TabsTrigger>
            <TabsTrigger value="payslip" className="rounded-xl text-sm data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 transition-all"><Receipt className="w-4 h-4 mr-2 hidden sm:block"/> Payslip</TabsTrigger>
            <TabsTrigger value="settings" className="rounded-xl text-sm data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 transition-all"><Settings className="w-4 h-4 mr-2 hidden sm:block"/> Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="time">
            <Card className="max-w-md mx-auto border-0 ring-1 ring-slate-200 shadow-sm rounded-3xl bg-white overflow-hidden">
              <div className="bg-slate-900 p-8 text-center text-white"><Clock className="w-12 h-12 mx-auto text-emerald-400 mb-4" /><h2 className="text-3xl font-bold tracking-tight mb-1">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</h2><p className="text-slate-400">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p></div>
              <CardContent className="p-8 space-y-6">
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div><p className="text-sm text-slate-500 font-medium mb-1">Status</p>{todayAttendance?.clock_out_time ? <Badge className="bg-slate-200 text-slate-700 hover:bg-slate-200">Shift Completed</Badge> : todayAttendance?.clock_in_time ? <span className="inline-flex items-center text-emerald-600 font-bold text-sm"><CheckCircle2 className="w-4 h-4 mr-1"/> Checked In</span> : <span className="text-amber-600 font-bold text-sm">Not Checked In</span>}</div>
                  <div className="text-right"><p className="text-sm text-slate-500 font-medium mb-1">Time In</p><p className="font-bold text-slate-900">{todayAttendance?.clock_in_time ? new Date(todayAttendance.clock_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</p></div>
                </div>
                {!todayAttendance?.clock_in_time ? <Button onClick={handleClockIn} disabled={timeLoading} className="w-full h-14 text-lg rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md">Clock In</Button> : !todayAttendance?.clock_out_time ? <Button onClick={handleClockOut} disabled={timeLoading} className="w-full h-14 text-lg rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md">Clock Out</Button> : <Button disabled className="w-full h-14 text-lg rounded-xl bg-slate-100 text-slate-400">Done for today</Button>}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leave" className="w-full space-y-8 mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <Card className="border-0 ring-1 ring-slate-200 shadow-sm rounded-3xl bg-white p-6 flex flex-col items-center justify-center text-center"><p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Sick Leave</p><div className="text-4xl font-black text-emerald-600">{balances.sick} <span className="text-base font-medium text-slate-400">days left</span></div></Card>
              <Card className="border-0 ring-1 ring-slate-200 shadow-sm rounded-3xl bg-white p-6 flex flex-col items-center justify-center text-center"><p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Personal Leave</p><div className="text-4xl font-black text-emerald-600">{balances.personal} <span className="text-base font-medium text-slate-400">days left</span></div></Card>
              <Card className="border-0 ring-1 ring-slate-200 shadow-sm rounded-3xl bg-white p-6 flex flex-col items-center justify-center text-center"><p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Annual Leave</p><div className="text-4xl font-black text-emerald-600">{balances.annual} <span className="text-base font-medium text-slate-400">days left</span></div></Card>
            </div>
            <Card className="max-w-3xl mx-auto border-0 ring-1 ring-slate-200 shadow-sm rounded-3xl bg-white">
              <CardHeader className="border-b border-slate-50 bg-slate-50/50 rounded-t-3xl pb-6"><CardTitle className="text-xl text-center">Request Time Off</CardTitle><p className="text-center text-sm text-slate-500 mt-1">Submit your leave request for HR approval.</p></CardHeader>
              <CardContent className="p-8">
                <form onSubmit={handleLeaveSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><label className="text-xs font-semibold text-slate-500 uppercase ml-1 mb-2 block">Start Date</label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="rounded-xl border-slate-200 h-12 w-full text-slate-900" /></div>
                    <div><label className="text-xs font-semibold text-slate-500 uppercase ml-1 mb-2 block">End Date</label><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required className="rounded-xl border-slate-200 h-12 w-full text-slate-900" /></div>
                  </div>
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <label className="text-xs font-semibold text-slate-500 uppercase ml-1 block">Leave Type</label>
                      {dynamicDaysRequested > 0 && <span className={`text-xs font-bold ${dynamicDaysRequested > balances[leaveType] ? 'text-rose-500' : 'text-emerald-600'}`}>Requesting {dynamicDaysRequested} day(s) / {balances[leaveType]} left</span>}
                    </div>
                    <select value={leaveType} onChange={(e) => setLeaveType(e.target.value as keyof LeaveBalances)} className="w-full h-12 rounded-xl border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-slate-900"><option value="sick">Sick Leave</option><option value="personal">Personal Leave</option><option value="annual">Annual Leave</option></select>
                  </div>
                  <div><label className="text-xs font-semibold text-slate-500 uppercase ml-1 mb-2 block">Reason</label><Input placeholder="Brief reason for your leave..." value={reason} onChange={(e) => setReason(e.target.value)} required className="rounded-xl border-slate-200 h-12 w-full text-slate-900" /></div>
                  <Button type="submit" disabled={leaveLoading || (dynamicDaysRequested > balances[leaveType])} className={`w-full h-12 rounded-xl text-white font-semibold shadow-sm mt-4 text-base transition-colors ${dynamicDaysRequested > balances[leaveType] ? 'bg-slate-300 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800'}`}>{leaveLoading ? "Submitting..." : dynamicDaysRequested > balances[leaveType] ? "Not Enough Days Left" : "Submit Request"}</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payslip">
             {/* Cleaned up Payslip View - Just the Print Button and a preview graphic */}
             <Card className="max-w-md mx-auto border-0 ring-1 ring-slate-200 shadow-sm rounded-3xl bg-white overflow-hidden text-center p-10">
                <Receipt className="w-16 h-16 mx-auto text-emerald-200 mb-6" />
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Your Monthly Payslip</h3>
                <p className="text-slate-500 mb-8">View and download your official company payslip document for this period.</p>
                <Button onClick={handlePrintPayslip} className="w-full h-14 text-lg bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md"><Printer className="w-5 h-5 mr-2" /> Open Official Document</Button>
             </Card>
          </TabsContent>

          <TabsContent value="settings" className="max-w-md mx-auto mt-6">
            <Card className="border-0 ring-1 ring-slate-200 shadow-sm rounded-3xl bg-white"><CardHeader className="text-center pb-2"><div className="mx-auto w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-3"><Lock className="w-6 h-6" /></div><CardTitle className="text-xl">Security Settings</CardTitle><p className="text-sm text-slate-500">Update your portal password</p></CardHeader><CardContent><form onSubmit={handleChangePassword} className="space-y-4 mt-4"><div><label className="text-xs font-semibold text-slate-500 uppercase ml-1">New Password</label><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="mt-1 h-11 rounded-xl" /></div><div><label className="text-xs font-semibold text-slate-500 uppercase ml-1">Confirm Password</label><Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="mt-1 h-11 rounded-xl" /></div><Button type="submit" disabled={passwordLoading} className="w-full h-11 mt-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">{passwordLoading ? "Updating..." : "Update Password"}</Button></form></CardContent></Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}