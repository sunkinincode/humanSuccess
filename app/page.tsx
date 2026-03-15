import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  Leaf, Users, CalendarCheck, Calculator, FileText, ArrowRight, CheckCircle2, Clock, ShieldCheck, Zap, HeadphonesIcon
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-emerald-200 selection:text-emerald-900">
      
      {/* Navbar */}
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-md fixed top-0 w-full z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm">
              <Leaf className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">Human Success</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="#pricing" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors hidden sm:block mr-4">
              ราคาแพ็กเกจ
            </Link>
            <Link href="/login">
              <Button className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-6 shadow-sm">
                เข้าสู่ระบบ <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-sm font-medium mb-6">
            <span className="flex h-2 w-2 rounded-full bg-emerald-600"></span>
            คุ้มค่าที่สุดสำหรับ SME เริ่มต้นเพียง 549.-/เดือน
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.1] mb-6">
            จัดการบุคลากร <span className="text-emerald-600">ตั้งแต่ต้นจนจบ</span><br className="hidden md:block"/> ในแพลตฟอร์มเดียว
          </h1>
          <p className="text-lg md:text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            บอกลาการคิดราคาแบบนับหัวพนักงาน! Human Success ให้คุณใช้งานครบทุกฟีเจอร์ในราคาเดียว ช่วยลดเวลาทำงานเอกสาร และเพิ่มความสะดวกสบายให้ทีมของคุณ
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login">
              <Button className="w-full sm:w-auto h-14 px-8 text-lg rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20">
                ทดลองใช้งานฟรี 14 วัน
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">ครบทุกฟีเจอร์ที่ HR ต้องการ</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">ระบบถูกออกแบบมาให้ใช้งานง่าย ไม่ซับซ้อน แต่ทรงพลังด้วยการคำนวณแบบ Real-time</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6"><Users className="w-6 h-6" /></div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">ระบบประเมินทดลองงาน</h3>
              <p className="text-slate-600 text-sm leading-relaxed">ดูแลพนักงานใหม่ ประเมินผ่านโปรเพื่อรับสวัสดิการ หรือยกเลิกสัญญาและระงับบัญชีได้ทันที</p>
            </div>
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-6"><Clock className="w-6 h-6" /></div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">เข้างาน & จัดการวันลา</h3>
              <p className="text-slate-600 text-sm leading-relaxed">พนักงานลงเวลาได้เอง ระบบคำนวณโควต้าคงเหลืออัตโนมัติ พร้อมให้ HR กดอนุมัติได้ในคลิกเดียว</p>
            </div>
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6"><Calculator className="w-6 h-6" /></div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">คำนวณเงินเดือน & OT</h3>
              <p className="text-slate-600 text-sm leading-relaxed">เครื่องคิดเงินเดือนอัจฉริยะ คำนวณค่าล่วงเวลา หักประกันสังคม และสรุปยอดสุทธิ (Net Pay) Real-time</p>
            </div>
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6"><FileText className="w-6 h-6" /></div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">สร้างเอกสารอัตโนมัติ</h3>
              <p className="text-slate-600 text-sm leading-relaxed">ระบบจะสร้างสลิปเงินเดือน และใบแจ้งลาออกในรูปแบบ A4 ทางการ พร้อมสั่งพิมพ์ได้ทันที</p>
            </div>
          </div>
        </div>
      </section>

      {/* Two Sides Section */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto bg-slate-900 rounded-[3rem] p-8 md:p-16 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-emerald-500 blur-[100px] opacity-30 rounded-full"></div>
          <div className="relative z-10 text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">ประสานการทำงาน 2 ส่วนอย่างสมบูรณ์</h2>
            <p className="text-slate-400">เชื่อมต่อฐานข้อมูลเดียวกันแบบไร้รอยต่อระหว่างฝ่ายบุคคลและพนักงาน</p>
          </div>
          <div className="grid md:grid-cols-2 gap-12 relative z-10">
            <div className="space-y-6">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-4"><Users className="w-6 h-6 text-emerald-400" /></div>
              <h3 className="text-2xl font-bold text-white">HR Workspace</h3>
              <ul className="space-y-4 text-slate-300">
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> อนุมัติการลาและประมวลผลการลาออก</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> คำนวณเงินเดือนและออกสลิปทางการ</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> จัดการโปรไฟล์และการระบุสถานะมาสาย</li>
              </ul>
            </div>
            <div className="space-y-6">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-4"><CalendarCheck className="w-6 h-6 text-blue-400" /></div>
              <h3 className="text-2xl font-bold text-white">Employee Portal</h3>
              <ul className="space-y-4 text-slate-300">
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" /> ระบบลงเวลาเข้างานด้วยตัวเอง</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" /> ส่งคำขอลาหยุดพร้อมระบบป้องกันวันทับซ้อน</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" /> ดาวน์โหลดสลิปเงินเดือนย้อนหลัง</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* NEW: Pricing Section */}
      <section id="pricing" className="py-24 px-6 bg-white border-t border-slate-100">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">ราคาเดียว จบทุกความต้องการ</h2>
          <p className="text-slate-500 max-w-2xl mx-auto mb-16">
            หมดยุคจ่ายแพงตามจำนวนหัวพนักงาน เราให้คุณใช้งานได้เต็มที่ในราคาสุดคุ้ม เหมาะสำหรับธุรกิจ SME
          </p>

          <div className="max-w-md mx-auto bg-white rounded-[2.5rem] border-2 border-emerald-500 shadow-2xl p-10 relative transform hover:-translate-y-2 transition-transform duration-300">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-500 text-white px-4 py-1.5 rounded-full text-sm font-bold tracking-wide shadow-sm">
              คุ้มค่าที่สุด🔥
            </div>
            
            <h3 className="text-2xl font-bold text-slate-900">แพ็กเกจองค์กร (SME)</h3>
            <p className="text-slate-500 mt-2 text-sm">ใช้งานได้ทุกฟีเจอร์ ครอบคลุมทั้งระบบ</p>
            
            <div className="my-8 flex items-baseline justify-center gap-1">
              <span className="text-5xl font-black text-slate-900">฿549</span>
              <span className="text-lg font-medium text-slate-500">/ เดือน</span>
            </div>

            <ul className="space-y-4 text-left mb-8">
              <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" /> <span className="text-slate-700">ใช้งานระบบ HR และ Employee Portal</span></li>
              <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" /> <span className="text-slate-700">คำนวณเงินเดือน & OT ไม่อั้น</span></li>
              <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" /> <span className="text-slate-700">ออกเอกสาร สลิปเงินเดือน ใบลาออก ไม่จำกัด</span></li>
              <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" /> <span className="text-slate-700"><strong>ไม่มีค่าใช้จ่ายแอบแฝงเพิ่มเติม</strong></span></li>
            </ul>

            <Link href="/login">
              <Button className="w-full h-14 text-lg rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg">
                เริ่มต้นทดลองใช้งานฟรี
              </Button>
            </Link>
            <p className="text-xs text-slate-400 mt-4">ยกเลิกได้ตลอดเวลา ไม่ผูกมัด</p>
          </div>
        </div>
      </section>

      {/* NEW: Trust & FAQ Section */}
      <section className="py-20 px-6 bg-slate-50 border-t border-slate-100">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="p-6">
              <div className="w-16 h-16 mx-auto bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4"><ShieldCheck className="w-8 h-8" /></div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">ปลอดภัยสูงสุด</h4>
              <p className="text-sm text-slate-600">ข้อมูลพนักงานและฐานเงินเดือนถูกเก็บรักษาอย่างปลอดภัยบนระบบ Cloud มาตรฐานสากล</p>
            </div>
            <div className="p-6">
              <div className="w-16 h-16 mx-auto bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4"><Zap className="w-8 h-8" /></div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">ใช้งานได้ทันที</h4>
              <p className="text-sm text-slate-600">ไม่ต้องจ้าง IT มาติดตั้ง สมัครปุ๊บ ตั้งค่าบริษัท แล้วเชิญพนักงานเข้าใช้งานได้เลย</p>
            </div>
            <div className="p-6">
              <div className="w-16 h-16 mx-auto bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-4"><HeadphonesIcon className="w-8 h-8" /></div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">ดูแลตลอดอายุการใช้งาน</h4>
              <p className="text-sm text-slate-600">มีทีมงานคอยช่วยเหลือ และอัปเดตฟีเจอร์ใหม่ๆ ให้ฟรี โดยไม่ต้องจ่ายเพิ่ม</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-12 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Leaf className="w-5 h-5 text-emerald-600" />
          <span className="font-bold text-slate-900">Human Success</span>
        </div>
        <p className="text-slate-500 text-sm">© {new Date().getFullYear()} Human Success HRIS. All rights reserved.</p>
      </footer>
    </div>
  )
}