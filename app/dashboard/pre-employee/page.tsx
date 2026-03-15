"use client"

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useReactToPrint } from 'react-to-print'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Printer, UserCheck, CheckCircle2, UserX } from 'lucide-react'
import { terminatePortalAccount } from '@/app/actions/hr' // Assuming you have this from previous files

type Employee = {
  id: string
  user_id: string | null // Need this to delete their account
  first_name: string
  last_name: string
  position: string
  base_salary: number
  status: string
}

export default function PreEmployeePage() {
  const [probationers, setProbationers] = useState<Employee[]>([])
  const supabase = createClient()

  const printRef = useRef<HTMLDivElement>(null)
  const [printData, setPrintData] = useState<Employee | null>(null)

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Probation_Evaluation_Form',
  })

  const fetchProbationers = async () => {
    const { data } = await supabase
      .from('employees')
      .select('*')
      .eq('status', 'probation')
      .order('first_name', { ascending: true })
    if (data) setProbationers(data as Employee[])
  }

  useEffect(() => {
    fetchProbationers()
  }, [])

  const handlePassProbation = async (employeeId: string) => {
    if (!window.confirm("Promote this employee to Active status? This will generate their leave balances.")) return

    const { error: updateError } = await supabase.from('employees').update({ status: 'active' }).eq('id', employeeId)
    if (updateError) return alert("Error: " + updateError.message)

    const { error: leaveError } = await supabase.from('leave_balances').insert([{ employee_id: employeeId }])
    if (leaveError) alert("Error creating leave balances: " + leaveError.message)
    else { alert("Employee promoted successfully!"); fetchProbationers() }
  }

  // --- NEW: Fail Probation Function ---
  const handleFailProbation = async (employee: Employee) => {
    if (!window.confirm(`Are you sure you want to fail ${employee.first_name}'s probation? This will terminate them and revoke system access immediately.`)) return
    
    // 1. Revoke their Supabase Auth Login
    const result = await terminatePortalAccount(employee.id, employee.user_id)
    
    if (!result.error) {
      // 2. Officially change their HR status to 'terminated'
      const { error: dbError } = await supabase
        .from('employees')
        .update({ status: 'terminated', updated_at: new Date().toISOString() })
        .eq('id', employee.id)

      if (!dbError) {
        alert(`${employee.first_name} has been terminated and portal access revoked.`)
        fetchProbationers()
      } else {
        alert("Error updating employee status: " + dbError.message)
      }
    } else {
      alert("Error finalizing termination: " + result.error)
    }
  }

  const triggerPrint = (employee: Employee) => {
    setPrintData(employee)
    setTimeout(() => handlePrint(), 100)
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Pre-employee (Probation)</h2>
        <p className="text-slate-500 mt-1">Evaluate probationers and promote them to active status.</p>
      </div>

      <Card className="shadow-sm border-0 ring-1 ring-slate-100 rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-emerald-50/50 to-white border-b border-slate-100 pb-4 pt-6">
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-emerald-600" />
            <CardTitle className="text-lg">Staff on Probation</CardTitle>
          </div>
          <CardDescription>Awaiting manager evaluation and final approval.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold text-slate-500 h-12 px-6">Employee Name</TableHead>
                <TableHead className="font-semibold text-slate-500">Position</TableHead>
                <TableHead className="font-semibold text-slate-500">Base Salary</TableHead>
                <TableHead className="font-semibold text-slate-500 text-right px-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {probationers.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-slate-400 py-10">No employees currently on probation.</TableCell></TableRow>
              )}
              {probationers.map((employee) => (
                <TableRow key={employee.id} className="hover:bg-emerald-50/30 transition-colors">
                  <TableCell className="font-medium text-slate-900 px-6">{employee.first_name} {employee.last_name}</TableCell>
                  <TableCell className="text-slate-600">{employee.position}</TableCell>
                  <TableCell className="text-slate-600">฿{employee.base_salary?.toLocaleString() || 0}</TableCell>
                  <TableCell className="text-right px-6 space-x-2 flex justify-end">
                    
                    <Button variant="outline" size="sm" className="rounded-xl h-9 text-slate-600 border-slate-200" onClick={() => triggerPrint(employee)}>
                      <Printer className="mr-2 h-4 w-4" /> Print Rubric
                    </Button>
                    
                    <Button size="sm" className="rounded-xl h-9 bg-emerald-600 hover:bg-emerald-700 shadow-md" onClick={() => handlePassProbation(employee.id)}>
                      <CheckCircle2 className="mr-2 h-4 w-4" /> Pass
                    </Button>
                    
                    {/* NEW: Fail Button */}
                    <Button size="sm" variant="outline" className="rounded-xl h-9 text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700" onClick={() => handleFailProbation(employee)}>
                      <UserX className="mr-2 h-4 w-4" /> Fail
                    </Button>

                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Hidden Printable Form */}
      <div className="hidden">
        <div ref={printRef} className="p-10 max-w-[210mm] min-h-[297mm] mx-auto bg-white text-black font-sans">
          {printData && (
             <div>
              <div className="text-center border-b-2 border-black pb-4 mb-8">
                <h1 className="text-2xl font-bold uppercase">Human Success Co., Ltd.</h1>
                <h2 className="text-xl mt-2 text-gray-700">Probation Evaluation Form</h2>
              </div>
              <div className="space-y-4 mb-8 text-lg bg-slate-50 p-4 rounded border border-gray-200">
                <p><strong>Employee Name:</strong> {printData.first_name} {printData.last_name}</p>
                <p><strong>Position:</strong> {printData.position}</p>
              </div>
              <h3 className="font-bold text-lg mb-4">Performance Evaluation</h3>
              <table className="w-full border-collapse border border-gray-300 mb-8 text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-2 text-left">Criteria</th>
                    <th className="border border-gray-300 p-2 text-center w-24">Excellent</th>
                    <th className="border border-gray-300 p-2 text-center w-24">Good</th>
                    <th className="border border-gray-300 p-2 text-center w-24">Average</th>
                    <th className="border border-gray-300 p-2 text-center w-24">Poor</th>
                  </tr>
                </thead>
                <tbody>
                  {['Quality of Work', 'Punctuality & Attendance', 'Teamwork & Communication', 'Problem Solving', 'Adaptability'].map(item => (
                    <tr key={item}>
                      <td className="border border-gray-300 p-2">{item}</td>
                      <td className="border border-gray-300"></td><td className="border border-gray-300"></td>
                      <td className="border border-gray-300"></td><td className="border border-gray-300"></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mb-12">
                <h3 className="font-bold mb-2">Manager's Comments:</h3>
                <div className="h-32 border border-gray-300 rounded p-2"></div>
              </div>
              <div className="grid grid-cols-2 gap-10 mt-16">
                <div>
                  <h3 className="font-bold mb-2">Final Decision:</h3>
                  <div className="space-y-2">
                    <p>[ &nbsp; ] Pass Probation</p><p>[ &nbsp; ] Extend Probation</p><p>[ &nbsp; ] Terminate Employment</p>
                  </div>
                </div>
                <div className="text-center pt-8">
                  <div className="border-b border-black w-full h-8 mb-2"></div>
                  <p className="text-sm">Manager/HR Signature</p><p className="text-sm mt-1">Date: ____/____/______</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}