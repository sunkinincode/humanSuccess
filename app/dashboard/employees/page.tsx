"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { terminatePortalAccount } from '@/app/actions/hr'
import { 
  UserMinus, Check, X, Printer, CalendarHeart, 
  User, Mail, Briefcase, Clock, ArrowLeft, Search, FileText, AlertTriangle, Calculator, Coins
} from 'lucide-react'

export default function ActiveEmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([])
  const [leaveRequests, setLeaveRequests] = useState<any[]>([])
  const [pendingResignations, setPendingResignations] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("directory")
  const [loading, setLoading] = useState(true)

  const [selectedEmployee, setSelectedEmployee] = useState<any>(null)
  const [employeeAttendance, setEmployeeAttendance] = useState<any[]>([])
  const [employeeLeaves, setEmployeeLeaves] = useState<any[]>([])

  // --- PAYROLL & OT CALCULATOR STATE ---
  const [baseSalary, setBaseSalary] = useState<number>(0) // ปรับค่าเริ่มต้นเป็น 0
  const [incType, setIncType] = useState<'percent' | 'fixed'>('percent')
  const [incValue, setIncValue] = useState<number>(0)
  const [workHours, setWorkHours] = useState<number>(8)
  const [otMultiplier, setOtMultiplier] = useState<number>(1.5)
  const [otHours, setOtHours] = useState<number>(0)

  const supabase = createClient()

  const loadData = async () => {
    setLoading(true)
    const { data: empData, error: empError } = await supabase.from('employees').select('*').in('status', ['active', 'probation']).order('first_name', { ascending: true })
    if (empError) console.error("Employee Fetch Error:", empError)

    const { data: resData, error: resError } = await supabase.from('employees').select('*').eq('status', 'resigning').order('updated_at', { ascending: false })
    if (resError) console.error("Resignation Fetch Error:", resError)

    const { data: attData } = await supabase.from('attendance').select('employee_id, clock_in_time').order('clock_in_time', { ascending: false })

    if (empData) {
      const mergedEmployees = empData.map(emp => {
        const latestAtt = attData?.find(a => a.employee_id === emp.id && a.clock_in_time)
        return { ...emp, last_check_in: latestAtt ? latestAtt.clock_in_time : null }
      })
      setEmployees(mergedEmployees)
    }

    if (resData) setPendingResignations(resData)

    const { data: leaveData, error: leaveError } = await supabase.from('leave_requests').select('*').eq('status', 'pending').order('created_at', { ascending: false })
    if (leaveError) console.error("Leave Fetch Error:", leaveError)

    if (leaveData) {
      const allEmps = [...(empData || []), ...(resData || [])]
      const mappedLeaves = leaveData.map(req => {
        const emp = allEmps.find(e => e.id === req.employee_id)
        return { ...req, employees: emp ? { first_name: emp.first_name, last_name: emp.last_name, position: emp.position } : { first_name: 'Unknown', last_name: 'Employee' } }
      })
      setLeaveRequests(mappedLeaves)
    }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  // --- PAYROLL CALCULATIONS ---
  const adjustedSalary = incType === 'percent' ? baseSalary + (baseSalary * (incValue / 100)) : baseSalary + incValue;
  const otAmount = ((adjustedSalary / 30) / workHours) * otMultiplier * otHours;
  const grossPay = adjustedSalary + otAmount;
  const sso = Math.min(adjustedSalary * 0.05, 750);
  const netPay = grossPay - sso;

  // --- ACTIONS ---
  const handleLeaveAction = async (requestId: string, newStatus: 'approved' | 'rejected', isIndividualView = false) => {
    const { error } = await supabase.from('leave_requests').update({ status: newStatus }).eq('id', requestId)
    if (!error) {
      alert(`Leave request ${newStatus}!`)
      await loadData()
      if (isIndividualView && selectedEmployee) await handleViewEmployee(selectedEmployee)
    }
  }

  const handlePrintPayslip = () => {
    if (!selectedEmployee) return;
    const printContent = `
      <html>
        <head>
          <title>Payslip - ${selectedEmployee.first_name} ${selectedEmployee.last_name}</title>
          <style>
            body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #000; line-height: 1.6; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 20px; }
            .header h1 { margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; }
            .header h2 { margin: 5px 0 15px 0; font-size: 16px; font-weight: normal; }
            .divider { border-bottom: 2px solid #000; margin-bottom: 20px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 14px; }
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
            <div class="col"><span class="label">Employee Name:</span> ${selectedEmployee.first_name} ${selectedEmployee.last_name}</div>
            <div class="col"><span class="label">Position:</span> ${selectedEmployee.position || 'Employee'}</div>
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
                <td>Base Salary (Adjusted)</td>
                <td class="right">฿${adjustedSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td class="right">-</td>
              </tr>
              <tr>
                <td>Overtime (OT) Pay</td>
                <td class="right">฿${otAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td class="right">-</td>
              </tr>
              <tr>
                <td>Social Security (5%)</td>
                <td class="right">-</td>
                <td class="right">฿${sso.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr class="total-row">
                <td>Net Pay Transfer</td>
                <td colspan="2" class="right">฿${netPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
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

  const handleInitiateResignation = async (emp: any) => {
    if (!confirm(`Generate formal resignation letter for ${emp.first_name} and move to approvals?`)) return
    const printContent = `
      <html>
        <head>
          <title>Resignation Document - ${emp.first_name} ${emp.last_name}</title>
          <style>
            body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #000; line-height: 1.6; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 20px; }
            .header h1 { margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase;}
            .header h2 { margin: 5px 0 15px 0; font-size: 16px; font-weight: normal; }
            .divider { border-bottom: 2px solid #000; margin-bottom: 20px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 14px;}
            .col { flex: 1; }
            .label { font-weight: bold; }
            .remarks-box { border: 1px solid #ccc; padding: 20px; border-radius: 4px; min-height: 100px; margin-top: 10px; font-size: 14px;}
            .signatures { margin-top: 80px; display: flex; justify-content: space-between; }
            .sig-box { text-align: center; width: 250px; }
            .sig-line { border-top: 1px solid #000; margin-top: 40px; padding-top: 5px; font-size: 14px; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="header">
            <h1>HUMAN SUCCESS CO., LTD.</h1>
            <h2>Formal Notice of Resignation / Termination</h2>
          </div>
          <div class="divider"></div>
          <div class="row">
            <div class="col"><span class="label">Employee Name:</span> ${emp.first_name} ${emp.last_name}</div>
            <div class="col"><span class="label">Position:</span> ${emp.position || 'Employee'}</div>
          </div>
          <div class="row">
            <div class="col"><span class="label">Email:</span> ${emp.email || '-'}</div>
            <div class="col"><span class="label">Date Issued:</span> ${new Date().toLocaleDateString()}</div>
          </div>
          <div class="divider"></div>
          
          <div style="margin-top: 30px;">
            <span class="label">Remarks:</span>
            <div class="remarks-box">
              <p>This document serves as the formal record that the separation process has been initiated for the above-named employee.</p>
              <p>Upon final approval by Human Resources, all portal access and company privileges will be permanently revoked.</p>
            </div>
          </div>

          <div class="signatures">
            <div class="sig-box">
               <div class="sig-line">Employee Signature</div>
               <div style="margin-top: 5px; text-align: left; font-size: 14px;">Date: ____/____/____</div>
            </div>
            <div class="sig-box">
               <div class="sig-line">HR Approval Signature</div>
               <div style="margin-top: 5px; text-align: left; font-size: 14px;">Date: ____/____/____</div>
            </div>
          </div>
        </body>
      </html>
    `
    const printWindow = window.open('', '_blank', 'width=800,height=800')
    if (printWindow) { printWindow.document.write(printContent); printWindow.document.close(); }

    const { error } = await supabase.from('employees').update({ status: 'resigning', updated_at: new Date().toISOString() }).eq('id', emp.id)
    if (!error) {
      alert(`${emp.first_name} has been moved to the Resignation Approval tab.`)
      setSelectedEmployee(null); loadData();
    }
  }

  const handleFinalizeResignation = async (employeeId: string, userId: string | null) => {
    if (!confirm("FINAL APPROVAL: This will immediately revoke their portal login and mark them as terminated. Proceed?")) return
    const result = await terminatePortalAccount(employeeId, userId)
    if (!result.error) {
      const { error: dbError } = await supabase.from('employees').update({ status: 'terminated', updated_at: new Date().toISOString() }).eq('id', employeeId)
      if (!dbError) { alert("Resignation approved."); loadData(); }
    }
  }

  const handleCancelResignation = async (empId: string) => {
    await supabase.from('employees').update({ status: 'active', updated_at: new Date().toISOString() }).eq('id', empId)
    loadData()
  }

  const handleToggleLate = async (attendanceId: string, isCurrentlyLate: boolean) => {
    const { error } = await supabase.from('attendance').update({ is_late: !isCurrentlyLate }).eq('id', attendanceId)
    if (!error && selectedEmployee) {
      const { data: att } = await supabase.from('attendance').select('*').eq('employee_id', selectedEmployee.id).order('date', { ascending: false }).limit(7)
      setEmployeeAttendance(att || [])
    }
  }

  const handleViewEmployee = async (emp: any) => {
    setSelectedEmployee(emp)
    
    // ดึง base_salary ของพนักงานคนนั้นมาใส่ในเครื่องคิดเงินเดือน (ถ้าไม่มีข้อมูลให้เป็น 0)
    setBaseSalary(emp.base_salary || 0); 
    setIncValue(0); 
    setOtHours(0);
    
    const { data: att } = await supabase.from('attendance').select('*').eq('employee_id', emp.id).order('date', { ascending: false }).limit(7)
    setEmployeeAttendance(att || [])
    const { data: leaves } = await supabase.from('leave_requests').select('*').eq('employee_id', emp.id).order('created_at', { ascending: false })
    setEmployeeLeaves(leaves || [])
  }

  if (loading) return <div className="p-8 text-slate-500 flex items-center justify-center h-64 animate-pulse">Loading HR Workspace...</div>

  return (
    <div className="p-8 max-w-7xl mx-auto font-sans animate-in fade-in duration-500">
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Team Management</h1>
        <p className="text-slate-500 mt-1">Manage active staff, approve leaves, and process resignations.</p>
      </div>

      <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); setSelectedEmployee(null); }} className="w-full flex flex-col">
        <div className="w-full flex justify-start mb-8">
          <TabsList className="grid w-full max-w-2xl grid-cols-3 h-14 bg-slate-200/50 p-1 rounded-2xl">
            <TabsTrigger value="directory" className="rounded-xl text-sm data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm transition-all"><Briefcase className="w-4 h-4 mr-2" /> Directory</TabsTrigger>
            <TabsTrigger value="leave" className="rounded-xl text-sm data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm transition-all relative">
              <CalendarHeart className="w-4 h-4 mr-2" /> Global Leaves
              {leaveRequests.length > 0 && <Badge className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center rounded-full p-0 bg-emerald-500 text-white border-0">{leaveRequests.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="resignations" className="rounded-xl text-sm data-[state=active]:bg-white data-[state=active]:text-rose-700 data-[state=active]:shadow-sm transition-all relative">
              <AlertTriangle className="w-4 h-4 mr-2" /> Resignations
              {pendingResignations.length > 0 && <Badge className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center rounded-full p-0 bg-rose-500 text-white border-0">{pendingResignations.length}</Badge>}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="directory" className="focus-visible:outline-none w-full">
          {selectedEmployee ? (
            <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
              <Button variant="ghost" className="mb-2 text-slate-500 hover:text-slate-900 pl-0" onClick={() => setSelectedEmployee(null)}><ArrowLeft className="w-4 h-4 mr-2" /> Back to Directory</Button>

              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{selectedEmployee.first_name} {selectedEmployee.last_name}</h2>
                  <p className="text-emerald-600 font-medium">{selectedEmployee.position || 'Employee'} • {selectedEmployee.email}</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <Button variant="outline" className="border-slate-200" onClick={handlePrintPayslip}><Printer className="w-4 h-4 mr-2" /> Print Payslip</Button>
                  <Button variant="destructive" className="bg-rose-500 hover:bg-rose-600 shadow-sm" onClick={() => handleInitiateResignation(selectedEmployee)}><FileText className="w-4 h-4 mr-2" /> Initiate Resignation</Button>
                </div>
              </div>

              {/* PAYROLL CARD */}
              <Card className="border-0 ring-1 ring-slate-100 shadow-sm rounded-3xl overflow-hidden bg-white">
                <CardHeader className="bg-emerald-50/50 border-b border-emerald-50">
                  <CardTitle className="text-lg flex items-center text-emerald-900"><Calculator className="w-5 h-5 mr-2 text-emerald-600"/> Payroll & OT Calculator</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid lg:grid-cols-2 gap-8">
                    <div className="space-y-5">
                      <div><label className="text-xs font-semibold text-slate-500 uppercase ml-1 block mb-1.5">Base Salary (THB)</label><Input type="number" value={baseSalary} onChange={(e) => setBaseSalary(Number(e.target.value) || 0)} className="rounded-xl border-slate-200 h-11" /></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs font-semibold text-slate-500 uppercase ml-1 block mb-1.5">Increment Type</label><select value={incType} onChange={(e) => setIncType(e.target.value as 'percent' | 'fixed')} className="w-full h-11 rounded-xl border border-slate-200 px-3 text-sm focus:ring-emerald-500"><option value="percent">Percentage (%)</option><option value="fixed">Fixed Amount (THB)</option></select></div>
                        <div><label className="text-xs font-semibold text-slate-500 uppercase ml-1 block mb-1.5">Increment Value</label><Input type="number" value={incValue} onChange={(e) => setIncValue(Number(e.target.value) || 0)} className="rounded-xl border-slate-200 h-11" /></div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-5">
                        <div><label className="text-xs font-semibold text-slate-500 uppercase ml-1 block mb-1.5">Work Hrs/Day</label><Input type="number" value={workHours} onChange={(e) => setWorkHours(Number(e.target.value) || 1)} className="rounded-xl border-slate-200 h-11" /></div>
                        <div><label className="text-xs font-semibold text-slate-500 uppercase ml-1 block mb-1.5">OT Multiplier</label><Input type="number" step="0.5" value={otMultiplier} onChange={(e) => setOtMultiplier(Number(e.target.value) || 0)} className="rounded-xl border-slate-200 h-11" /></div>
                        <div><label className="text-xs font-semibold text-slate-500 uppercase ml-1 block mb-1.5">Total OT Hrs</label><Input type="number" value={otHours} onChange={(e) => setOtHours(Number(e.target.value) || 0)} className="rounded-xl border-slate-200 h-11 bg-emerald-50 border-emerald-200 font-medium" /></div>
                      </div>
                    </div>
                    <div className="bg-slate-900 rounded-2xl p-6 text-white flex flex-col justify-center shadow-inner">
                      <div className="flex items-center gap-2 mb-6"><Coins className="w-5 h-5 text-emerald-400" /><h3 className="font-bold text-lg text-slate-100">Payroll Summary</h3></div>
                      <div className="space-y-3 flex-1 text-sm">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-700"><span className="text-slate-400">Adjusted Salary</span><span className="font-medium text-slate-200">฿{adjustedSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                        <div className="flex justify-between items-center pb-2 border-b border-slate-700"><span className="text-slate-400">OT Amount</span><span className="font-medium text-emerald-400">+ ฿{otAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                        <div className="flex justify-between items-center pb-2 border-b border-slate-700"><span className="text-slate-400">Gross Pay</span><span className="font-medium text-slate-200">฿{grossPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                        <div className="flex justify-between items-center pb-2 border-b border-slate-700"><span className="text-slate-400">SSO Deduction (5%)</span><span className="font-medium text-rose-400">- ฿{sso.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                      </div>
                      <div className="mt-6 pt-4 border-t-2 border-emerald-500/50 flex justify-between items-end"><span className="text-slate-300 font-medium tracking-wide">NET PAY</span><span className="text-3xl font-black text-emerald-400">฿{netPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ATTENDANCE & LEAVES */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-0 ring-1 ring-slate-100 shadow-sm rounded-3xl overflow-hidden bg-white">
                  <CardHeader className="bg-slate-50/50 border-b border-slate-50"><CardTitle className="text-lg flex items-center"><Clock className="w-5 h-5 mr-2 text-emerald-600"/> Recent Attendance</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    {employeeAttendance.length === 0 ? <p className="p-8 text-sm text-slate-500 text-center italic">No attendance records found.</p> : (
                      <div className="divide-y divide-slate-100">
                        {employeeAttendance.map(att => (
                          <div key={att.id} className="p-4 flex justify-between items-center hover:bg-slate-50/50 transition-colors">
                            <div className="flex flex-col items-start gap-1"><span className="font-medium text-slate-700">{new Date(att.date).toLocaleDateString()}</span>{att.is_late && <Badge variant="destructive" className="h-4 text-[10px] px-1.5 py-0 bg-rose-500">LATE</Badge>}</div>
                            <div className="flex items-center gap-4">
                              <div className="text-sm text-right"><p className={`${att.is_late ? 'text-rose-600' : 'text-emerald-600'} font-bold`}>In: {att.clock_in_time ? new Date(att.clock_in_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '--:--'}</p><p className="text-slate-500">Out: {att.clock_out_time ? new Date(att.clock_out_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : 'Working...'}</p></div>
                              <Button variant="outline" size="sm" onClick={() => handleToggleLate(att.id, att.is_late)} className={`h-8 text-xs shrink-0 ${att.is_late ? 'text-slate-500 border-slate-200 hover:text-slate-700 hover:bg-slate-100' : 'text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700'}`}>{att.is_late ? 'Remove Late' : 'Mark Late'}</Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-0 ring-1 ring-slate-100 shadow-sm rounded-3xl overflow-hidden bg-white">
                  <CardHeader className="bg-slate-50/50 border-b border-slate-50"><CardTitle className="text-lg flex items-center"><CalendarHeart className="w-5 h-5 mr-2 text-emerald-600"/> Leave Requests</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    {employeeLeaves.length === 0 ? <p className="p-8 text-sm text-slate-500 text-center italic">No leave history.</p> : (
                      <div className="divide-y divide-slate-100">
                        {employeeLeaves.map(leave => (
                          <div key={leave.id} className="p-5 space-y-3 hover:bg-slate-50/50">
                            <div className="flex justify-between items-start">
                              <div><Badge variant="outline" className="capitalize mb-1 bg-white">{leave.leave_type} Leave</Badge><p className="text-xs text-slate-500 font-medium">{new Date(leave.start_date).toLocaleDateString()} to {new Date(leave.end_date).toLocaleDateString()}</p></div>
                              <Badge variant={leave.status === 'pending' ? 'secondary' : leave.status === 'approved' ? 'default' : 'destructive'} className="capitalize">{leave.status}</Badge>
                            </div>
                            <p className="text-sm text-slate-600 bg-white p-3 rounded-xl border border-slate-100 shadow-sm italic">"{leave.reason}"</p>
                            {leave.status === 'pending' && (<div className="flex gap-2 pt-2"><Button size="sm" onClick={() => handleLeaveAction(leave.id, 'approved', true)} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"><Check className="w-4 h-4 mr-1"/> Approve</Button><Button size="sm" variant="outline" onClick={() => handleLeaveAction(leave.id, 'rejected', true)} className="flex-1 text-rose-600 border-rose-200 hover:bg-rose-50"><X className="w-4 h-4 mr-1"/> Reject</Button></div>)}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {employees.map(emp => (
                <Card key={emp.id} className="shadow-sm border-0 ring-1 ring-slate-100 rounded-3xl overflow-hidden hover:shadow-md transition-shadow bg-white flex flex-col">
                  <CardHeader className="pb-4 border-b border-slate-50 bg-slate-50/50">
                    <div className="flex justify-between items-start">
                      <div><CardTitle className="text-lg font-bold text-slate-900">{emp.first_name} {emp.last_name}</CardTitle><p className="text-sm font-medium text-emerald-600 mt-1">{emp.position || 'Employee'}</p></div>
                      <Badge variant={emp.status === 'probation' ? 'secondary' : 'default'} className="uppercase text-[10px] tracking-wider">{emp.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 flex-1 space-y-3">
                    <div className="flex items-center text-sm text-slate-600 truncate"><Mail className="w-4 h-4 mr-3 shrink-0 text-slate-400" /> {emp.email || <span className="text-slate-400 italic">No email</span>}</div>
                    <div className="flex items-center text-sm text-slate-600"><Clock className="w-4 h-4 mr-3 shrink-0 text-slate-400" /> Last in: {emp.last_check_in ? <span className="font-medium text-slate-900">{new Date(emp.last_check_in).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span> : <span className="text-slate-400 italic">No record</span>}</div>
                  </CardContent>
                  <CardFooter className="p-4 bg-slate-50 border-t border-slate-100">
                    <Button className="w-full text-sm font-semibold rounded-xl bg-slate-900 text-white hover:bg-slate-800 shadow-sm" onClick={() => handleViewEmployee(emp)}><Search className="w-4 h-4 mr-2" /> View Full Profile</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* --- GLOBAL LEAVES CONTENT --- */}
        <TabsContent value="leave" className="focus-visible:outline-none w-full">
           <Card className="shadow-sm border-0 ring-1 ring-slate-100 rounded-3xl overflow-hidden bg-white"><CardHeader className="bg-slate-50 border-b border-slate-100"><CardTitle className="text-lg flex items-center">All Pending Leave Requests</CardTitle></CardHeader><CardContent className="p-0">{leaveRequests.length === 0 ? (<div className="text-center p-16"><Check className="mx-auto h-16 w-16 text-emerald-200 mb-4" /><h3 className="text-xl font-medium text-slate-900">All caught up!</h3></div>) : (<div className="divide-y divide-slate-100">{leaveRequests.map((req) => (<div key={req.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50/50 transition-colors"><div className="flex items-start gap-4"><div className="bg-emerald-100 p-3 rounded-2xl text-emerald-700 mt-1"><CalendarHeart className="w-6 h-6" /></div><div><h4 className="text-lg font-bold text-slate-900">{req.employees?.first_name} {req.employees?.last_name}</h4><div className="flex gap-2 text-sm mt-1"><Badge variant="outline" className="bg-white capitalize text-slate-600">{req.leave_type} Leave</Badge><span className="text-slate-700 font-medium">{new Date(req.start_date).toLocaleDateString()} to {new Date(req.end_date).toLocaleDateString()}</span></div><p className="text-sm text-slate-600 mt-2">"{req.reason}"</p></div></div><div className="flex gap-3"><Button onClick={() => handleLeaveAction(req.id, 'approved')} className="bg-emerald-600 hover:bg-emerald-700"><Check className="w-4 h-4 mr-1"/> Approve</Button><Button onClick={() => handleLeaveAction(req.id, 'rejected')} variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50"><X className="w-4 h-4 mr-1"/> Reject</Button></div></div>))}</div>)}</CardContent></Card>
        </TabsContent>

        {/* --- RESIGNATIONS CONTENT --- */}
        <TabsContent value="resignations" className="focus-visible:outline-none w-full">
           <Card className="shadow-sm border-0 ring-1 ring-rose-100 rounded-3xl overflow-hidden bg-white"><CardHeader className="bg-rose-50/50 border-b border-rose-100"><CardTitle className="text-lg flex items-center text-rose-900">Pending Resignations</CardTitle></CardHeader><CardContent className="p-0">{pendingResignations.length === 0 ? (<div className="text-center p-16"><Check className="mx-auto h-16 w-16 text-emerald-200 mb-4" /><h3 className="text-xl font-medium text-slate-900">No pending resignations</h3></div>) : (<div className="divide-y divide-slate-100">{pendingResignations.map((emp) => (<div key={emp.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50/50 transition-colors"><div className="flex items-start gap-4"><div className="bg-rose-100 p-3 rounded-2xl text-rose-700 mt-1"><AlertTriangle className="w-6 h-6" /></div><div><h4 className="text-lg font-bold text-slate-900">{emp.first_name} {emp.last_name}</h4><p className="text-sm font-medium text-slate-500">{emp.position}</p><p className="text-sm text-slate-600 mt-2 bg-rose-50 p-2 rounded inline-block border border-rose-100">Waiting for final HR approval to revoke system access.</p></div></div><div className="flex flex-col gap-2"><Button onClick={() => handleFinalizeResignation(emp.id, emp.user_id)} className="bg-rose-600 hover:bg-rose-700 w-full md:w-auto text-white"><Check className="w-4 h-4 mr-2"/> Finalize Termination</Button><Button onClick={() => handleCancelResignation(emp.id)} variant="outline" className="border-slate-200 hover:bg-slate-100 w-full md:w-auto">Cancel / Return to Active</Button></div></div>))}</div>)}</CardContent></Card>
        </TabsContent>

      </Tabs>
    </div>
  )
}