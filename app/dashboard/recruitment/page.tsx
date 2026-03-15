"use client"

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Papa from 'papaparse'
import { useReactToPrint } from 'react-to-print'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Upload, Download, Printer, Check, X, UserPlus, FileSpreadsheet, Users } from 'lucide-react'
import { createPortalAccount } from '@/app/actions/hr'

type Candidate = {
  id: string
  first_name: string
  last_name: string
  position: string
  base_salary: number
  status: string
}

export default function RecruitmentPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false) // For the auto-account creation
  const supabase = createClient()

  // Manual Form State
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [position, setPosition] = useState('')
  const [baseSalary, setBaseSalary] = useState('')

  // Printing State
  const printRef = useRef<HTMLDivElement>(null)
  const [printCandidate, setPrintCandidate] = useState<Candidate | null>(null)

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Interview_Document',
  })

  // 1. Fetch Candidates
  const fetchCandidates = async () => {
    const { data } = await supabase
      .from('employees')
      .select('*')
      .eq('status', 'interview')
      .order('first_name', { ascending: true })
    if (data) setCandidates(data)
  }

  useEffect(() => {
    fetchCandidates()
  }, [])

  // 2. Manual Entry
  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.from('employees').insert([{
      first_name: firstName, last_name: lastName, position, base_salary: Number(baseSalary), status: 'interview'
    }])
    if (!error) {
      setFirstName(''); setLastName(''); setPosition(''); setBaseSalary('')
      fetchCandidates()
    } else {
      alert("Error adding candidate: " + error.message)
    }
    setLoading(false)
  }

  // 3. Bulk Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const parsedData = results.data.map((row: any) => ({
          first_name: row.first_name, last_name: row.last_name, position: row.position, base_salary: Number(row.base_salary), status: 'interview'
        }))
        const { error } = await supabase.from('employees').insert(parsedData)
        if (error) alert("Error: " + error.message)
        else { alert("Bulk upload successful!"); fetchCandidates() }
      }
    })
  }

  const downloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,first_name,last_name,position,base_salary\nJohn,Doe,Software Engineer,50000"
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "candidate_template.csv")
    document.body.appendChild(link); link.click(); document.body.removeChild(link)
  }

  // 4. Actions
  const handlePass = async (candidate: Candidate) => {
    // Prompt for credentials
    const email = window.prompt(`Enter an email for ${candidate.first_name}'s new portal account:`)
    if (!email) return
    const password = window.prompt("Enter a temporary password (min 6 characters):")
    if (!password || password.length < 6) {
      alert("Password must be at least 6 characters.")
      return
    }

    setActionLoading(true)
    
    // Call our secure Server Action to bypass RLS and not log HR out
    const result = await createPortalAccount(candidate.id, email, password, candidate.first_name)
    
    if (result.error) {
      alert("Failed to create account: " + result.error)
    } else {
      alert(`Success! Hand the candidate these login details.\n\nEmail: ${email}\nPassword: ${password}`)
      fetchCandidates()
    }
    
    setActionLoading(false)
  }

  const handleFail = async (id: string) => {
    if (window.confirm("Reject and delete this candidate?")) {
      await supabase.from('employees').delete().eq('id', id)
      fetchCandidates()
    }
  }

  const triggerPrint = (candidate: Candidate) => {
    setPrintCandidate(candidate)
    setTimeout(() => handlePrint(), 100)
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Recruitment</h2>
        <p className="text-slate-500 mt-1">Manage interview candidates and bulk uploads.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Manual Entry */}
        <Card className="shadow-sm border-0 ring-1 ring-slate-100 rounded-2xl">
          <CardHeader className="pb-4 border-b border-slate-50 mb-4">
            <div className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-emerald-600" />
              <CardTitle className="text-lg">Add Candidate</CardTitle>
            </div>
            <CardDescription>Manually enter a single applicant.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddCandidate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input className="h-11 bg-slate-50/50 rounded-xl" placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                <Input className="h-11 bg-slate-50/50 rounded-xl" placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </div>
              <Input className="h-11 bg-slate-50/50 rounded-xl" placeholder="Position" value={position} onChange={(e) => setPosition(e.target.value)} required />
              <Input className="h-11 bg-slate-50/50 rounded-xl" type="number" placeholder="Expected Salary (THB)" value={baseSalary} onChange={(e) => setBaseSalary(e.target.value)} required />
              <Button type="submit" className="w-full h-11 rounded-xl shadow-md" disabled={loading}>
                Add to Pipeline
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* CSV Upload */}
        <Card className="shadow-sm border-0 ring-1 ring-slate-100 rounded-2xl bg-gradient-to-br from-white to-emerald-50/30">
          <CardHeader className="pb-4 border-b border-slate-50 mb-4">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
              <CardTitle className="text-lg">Bulk Upload</CardTitle>
            </div>
            <CardDescription>Import multiple candidates from a CSV file.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm text-slate-600 leading-relaxed">Ensure your file matches the system formatting before uploading to prevent data errors.</p>
            <div className="flex flex-col gap-3">
              <Button variant="outline" onClick={downloadTemplate} className="w-full h-11 rounded-xl border-dashed border-2 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200">
                <Download className="mr-2 h-4 w-4" /> Download Template
              </Button>
              <div className="relative w-full">
                <Input type="file" accept=".csv" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                <Button className="w-full h-11 rounded-xl pointer-events-none bg-slate-900 hover:bg-slate-800 text-white shadow-md">
                  <Upload className="mr-2 h-4 w-4" /> Select CSV & Upload
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="shadow-sm border-0 ring-1 ring-slate-100 rounded-2xl overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-slate-500" />
            <CardTitle className="text-lg">Interview Pipeline</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold text-slate-500 h-12 px-6">Candidate Name</TableHead>
                <TableHead className="font-semibold text-slate-500">Position</TableHead>
                <TableHead className="font-semibold text-slate-500">Expected Salary</TableHead>
                <TableHead className="font-semibold text-slate-500 text-right px-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {candidates.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-slate-400 py-8">No candidates in pipeline.</TableCell></TableRow>
              )}
              {candidates.map((candidate) => (
                <TableRow key={candidate.id} className="hover:bg-emerald-50/30 transition-colors">
                  <TableCell className="font-medium text-slate-900 px-6">{candidate.first_name} {candidate.last_name}</TableCell>
                  <TableCell className="text-slate-600">{candidate.position}</TableCell>
                  <TableCell className="text-slate-600">฿{candidate.base_salary.toLocaleString()}</TableCell>
                  <TableCell className="text-right px-6 space-x-2">
                    <Button variant="outline" size="icon" className="rounded-lg h-9 w-9 text-slate-500 hover:text-blue-600 border-slate-200" onClick={() => triggerPrint(candidate)} title="Print Document" disabled={actionLoading}>
                      <Printer className="h-4 w-4" />
                    </Button>
                    <Button size="icon" className="rounded-lg h-9 w-9 bg-emerald-100 text-emerald-700 hover:bg-emerald-600 hover:text-white shadow-none" onClick={() => handlePass(candidate)} title="Pass (Create Account & Move to Probation)" disabled={actionLoading}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="icon" className="rounded-lg h-9 w-9 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white shadow-none" onClick={() => handleFail(candidate.id)} title="Fail (Delete)" disabled={actionLoading}>
                      <X className="h-4 w-4" />
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
          {printCandidate && (
            <div>
              <div className="text-center border-b-2 border-black pb-4 mb-8">
                <h1 className="text-3xl font-bold uppercase tracking-widest">Human Success Co., Ltd.</h1>
                <h2 className="text-xl mt-2 text-gray-700">Interview Evaluation Document</h2>
              </div>
              <div className="space-y-6 text-lg">
                <div className="grid grid-cols-2 gap-4">
                  <p><strong>First Name:</strong> {printCandidate.first_name}</p>
                  <p><strong>Last Name:</strong> {printCandidate.last_name}</p>
                </div>
                <p><strong>Applied Position:</strong> {printCandidate.position}</p>
                <p><strong>Expected Base Salary:</strong> ฿{printCandidate.base_salary.toLocaleString()}</p>
                <div className="mt-12 border-t pt-6">
                  <h3 className="font-bold mb-4">Interviewer Remarks:</h3>
                  <div className="h-48 border border-gray-300 rounded p-2"></div>
                </div>
                <div className="mt-12 grid grid-cols-2 gap-10">
                  <div>
                    <p><strong>Status Recommendation:</strong></p>
                    <div className="flex gap-4 mt-2">
                      <span>[ &nbsp; ] Pass (Probation)</span>
                      <span>[ &nbsp; ] Fail</span>
                    </div>
                  </div>
                  <div className="text-center pt-8">
                    <div className="border-b border-black w-full h-8 mb-2"></div>
                    <p className="text-sm">Interviewer Signature</p>
                    <p className="text-sm mt-1">Date: ____/____/______</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}