"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Leaf, UserCircle, Mail, Lock, ArrowRight } from 'lucide-react'

export default function HRRegistration() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  
  const supabase = createClient()
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // 1. สร้างบัญชีในระบบ Auth (ฝั่งความปลอดภัย)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: name,
          role: 'hr'
        }
      }
    })

    if (error) {
      alert("Registration Error: " + error.message)
    } else if (data?.user) {
      
      // 2. [เพิ่มใหม่] สั่งบันทึกข้อมูลลงตาราง profiles โดยตรง 
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: data.user.id, // ดึง ID จาก Auth มาเชื่อมกันให้ตรงเป๊ะ
            display_name: name,
            role: 'hr'
          }
        ])

      // เช็คว่าบันทึกลงตาราง profiles สำเร็จไหม
      if (profileError) {
        console.error("Profile Insert Error:", profileError)
        alert("Account created, but profile save failed: " + profileError.message)
        setLoading(false)
        return
      }

      // 3. ถ้าสำเร็จทั้งหมด ค่อยเด้งไปหน้าล็อกอิน
      alert("HR Admin Account Created Successfully!")
      router.push('/login') 
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <Card className="w-full max-w-md shadow-2xl border-0 ring-1 ring-slate-200 rounded-3xl overflow-hidden">
        <div className="bg-emerald-600 p-8 text-center text-white">
          <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <Leaf size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">System Setup</h1>
          <p className="text-emerald-100 text-sm mt-1">Create the Master HR Admin account</p>
        </div>

        <CardContent className="p-8">
          <form onSubmit={handleRegister} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Full Name</label>
              <div className="relative">
                <UserCircle className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <Input 
                  className="pl-10 h-11 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all" 
                  placeholder="e.g. Somchai Success" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <Input 
                  type="email"
                  className="pl-10 h-11 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all" 
                  placeholder="admin@company.com" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Secure Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <Input 
                  type="password"
                  className="pl-10 h-11 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all" 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 mt-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-100 transition-all group"
              disabled={loading}
            >
              {loading ? "Initializing..." : "Create Admin Account"}
              {!loading && <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400 leading-relaxed px-4">
              Setting up this account grants full access to payroll, recruitment, and employee records. 
              Please store your credentials securely.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}