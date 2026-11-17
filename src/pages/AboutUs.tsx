import { Link } from 'react-router-dom'
import { ShieldCheck, Truck, Headphones, Zap, Laptop, Users, Award } from 'lucide-react'

export default function AboutUs() {
  return (
    <div className="wrap py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-ink mb-6">About Oremitech</h1>
        <p className="text-lg text-muted mb-8 leading-relaxed">
          Oremitech is Kenya&rsquo;s trusted source for verified laptops and computing hardware. Every device we list is
          physically inspected and tested before it goes live on our platform, so you buy with confidence &mdash; no
          surprises, no hidden faults.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[{
            icon: ShieldCheck,
            title: 'Verified Quality',
            text: 'Every laptop undergoes physical verification before publication.',
          }, {
            icon: Truck,
            title: 'Nationwide Delivery',
            text: 'We ship across Kenya with tracking and clear delivery timelines.',
          }, {
            icon: Headphones,
            title: 'Dedicated Support',
            text: 'Our team helps you find the right device for work, study, or gaming.',
          }].map((item) => (
            <div key={item.title} className="p-6 rounded-xl border border-line bg-card">
              <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center mb-3">
                <item.icon className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-ink mb-2">{item.title}</h3>
              <p className="text-sm text-muted">{item.text}</p>
            </div>
          ))}
        </div>

        <div className="bg-ink rounded-xl p-8 text-white">
          <div className="flex items-start gap-4">
            <Award className="w-6 h-6 text-teal-400 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-xl font-bold mb-2">Why buy verified?</h2>
              <p className="text-teal-100 leading-relaxed">
                Buying a used laptop online can be risky. At Oremitech, every unit is inspected by our technicians,
                graded honestly, and priced transparently. Payment is confirmed only after your provider reference is
                verified &mdash; your money is protected until you&rsquo;re satisfied.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
