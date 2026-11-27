import { Link } from 'react-router-dom'
import { ShieldCheck, Truck, Headphones, Zap, Laptop, Users, Award } from 'lucide-react'

export default function AboutUs() {
  return (
    <div className="wrap py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-ink mb-6">About Oremitech</h1>
        <p className="text-lg text-muted mb-8 leading-relaxed">
          Oremitech is Kenya&rsquo;s source for laptops and computing hardware. Each product page lists the
          specifications provided for that item, so you can compare your options and buy with confidence.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[{
            icon: ShieldCheck,
            title: 'Verified Information',
            text: 'Products are reviewed by our team before they are published.',
          }, {
            icon: Truck,
            title: 'Delivery Options',
            text: 'Enter your location at checkout to see the delivery options and charges available to you.',
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
                Buying a laptop online can feel risky. At Oremitech, each product is described with clear specifications
                and transparent pricing. Payment is only confirmed once it has been verified &mdash; your order is not
                marked as paid until then.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
