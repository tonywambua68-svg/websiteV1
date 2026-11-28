import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useProductStore } from '@/store/productStore'
import ProductCard from '@/components/ProductCard'
import { formatKES } from '@/lib/commerce'
import { Cpu, Briefcase, Gamepad2, GraduationCap, Laptop, ArrowRight, RotateCcw, Check } from 'lucide-react'

const PRODUCT_GRID = 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 min-[1400px]:grid-cols-6'

type UseCase = 'student' | 'business' | 'gaming' | 'general'

const USE_OPTIONS: Array<{ value: UseCase; label: string; icon: any }> = [
  { value: 'student', label: 'Student / Study', icon: GraduationCap },
  { value: 'business', label: 'Business / Office', icon: Briefcase },
  { value: 'gaming', label: 'Gaming', icon: Gamepad2 },
  { value: 'general', label: 'Everyday Use', icon: Laptop },
]

const BUDGETS = [40000, 60000, 80000, 120000, 200000]

function parseNumber(value: string | null | undefined): number {
  if (!value) return 0
  const m = String(value).match(/(\d+(?:\.\d+)?)/)
  return m ? parseFloat(m[1]) : 0
}

export default function LaptopFinder() {
  const { products, fetchProducts, loading } = useProductStore()
  const [step, setStep] = useState(0)
  const [useCase, setUseCase] = useState<UseCase>('student')
  const [budget, setBudget] = useState<number>(80000)
  const [cpu, setCpu] = useState<'any' | 'intel' | 'amd' | 'apple'>('any')
  const [minRam, setMinRam] = useState(0)
  const [minStorage, setMinStorage] = useState(0)
  const [minScreen, setMinScreen] = useState(0)
  const [condition, setCondition] = useState<'any' | 'new' | 'refurbished'>('any')
  const [showResults, setShowResults] = useState(false)

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const laptops = useMemo(() => {
    const pub = products.filter(
      (p) => p.category_slug === 'laptops' && (p.publication_status === 'published' || p.availability !== 'unavailable'),
    )
    return pub
  }, [products])

  const results = useMemo(() => {
    let list = laptops.filter((p) => p.selling_price <= budget)
    if (cpu !== 'any') list = list.filter((p) => (p.processor_manufacturer || '').toLowerCase().includes(cpu))
    if (minRam > 0) list = list.filter((p) => parseNumber(p.ram) >= minRam)
    if (minStorage > 0) list = list.filter((p) => parseNumber(p.storage_capacity) >= minStorage)
    if (minScreen > 0) list = list.filter((p) => parseNumber(p.screen_size) >= minScreen)
    if (condition !== 'any') {
      list = list.filter((p) => {
        const c = (p.laptop_condition || '').toLowerCase()
        return condition === 'new' ? c.includes('new') : c.includes('refurb')
      })
    }
    // Gaming favours dedicated graphics; otherwise sort by price ascending (value for budget).
    list = [...list].sort((a, b) => {
      if (useCase === 'gaming') {
        const ga = (a.graphics || '').toLowerCase()
        const gb = (b.graphics || '').toLowerCase()
        const da = /rtx|gtx|radeon|dedicated|nvidia/.test(ga) ? 1 : 0
        const db = /rtx|gtx|radeon|dedicated|nvidia/.test(gb) ? 1 : 0
        if (da !== db) return db - da
      }
      return a.selling_price - b.selling_price
    })
    return list.slice(0, 12)
  }, [laptops, budget, cpu, minRam, minStorage, minScreen, condition, useCase])

  const reset = () => {
    setStep(0)
    setUseCase('student')
    setBudget(80000)
    setCpu('any')
    setMinRam(0)
    setMinStorage(0)
    setMinScreen(0)
    setCondition('any')
    setShowResults(false)
  }

  return (
    <div className="min-h-screen bg-page pb-16">
      <div className="wrap pt-6">
        <div className="rounded-xl border border-line bg-gradient-to-r from-slate-900 to-blue-950 p-6 text-white sm:p-8">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-cyan">
            <Cpu className="h-3.5 w-3.5" /> Laptop Finder
          </span>
          <h1 className="mt-3 font-display text-2xl font-extrabold sm:text-3xl">Find the right laptop for you</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            Answer a few quick questions. We recommend from the actual laptops currently in our catalogue — no invented specs.
          </p>
        </div>

        {/* Stepper */}
        {!showResults && (
          <div className="mt-5 flex items-center gap-2">
            {['Use', 'Specs', 'Budget'].map((label, i) => (
              <div key={label} className="flex flex-1 items-center gap-2">
                <div
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                    i <= step ? 'bg-primary text-white' : 'bg-mist text-muted'
                  }`}
                >
                  {i < step ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span className={`text-xs font-bold ${i <= step ? 'text-ink' : 'text-muted'}`}>{label}</span>
                {i < 2 && <div className="h-px flex-1 bg-line" />}
              </div>
            ))}
          </div>
        )}

        {/* Steps */}
        {!showResults && (
          <div className="mt-5 rounded-xl border border-line bg-card p-5">
            {step === 0 && (
              <div>
                <h2 className="font-display text-lg font-bold text-ink">What will you mainly use it for?</h2>
                <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {USE_OPTIONS.map((opt) => {
                    const Icon = opt.icon
                    const active = useCase === opt.value
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setUseCase(opt.value)}
                        className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition ${
                          active ? 'border-primary bg-blue-50 text-primary' : 'border-line bg-white text-ink hover:border-primary'
                        }`}
                      >
                        <Icon className="h-6 w-6" />
                        <span className="text-xs font-bold">{opt.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {step === 1 && (
              <div>
                <h2 className="font-display text-lg font-bold text-ink">Which specs matter to you?</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label>
                    <span className="text-[11px] font-bold uppercase tracking-wide text-muted">Processor brand</span>
                    <select
                      value={cpu}
                      onChange={(e) => setCpu(e.target.value as any)}
                      className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary"
                    >
                      <option value="any">Any</option>
                      <option value="intel">Intel</option>
                      <option value="amd">AMD</option>
                      <option value="apple">Apple</option>
                    </select>
                  </label>
                  <label>
                    <span className="text-[11px] font-bold uppercase tracking-wide text-muted">Minimum RAM</span>
                    <select
                      value={minRam}
                      onChange={(e) => setMinRam(Number(e.target.value))}
                      className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary"
                    >
                      <option value={0}>Any</option>
                      <option value={8}>8GB+</option>
                      <option value={16}>16GB+</option>
                      <option value={32}>32GB+</option>
                    </select>
                  </label>
                  <label>
                    <span className="text-[11px] font-bold uppercase tracking-wide text-muted">Minimum storage</span>
                    <select
                      value={minStorage}
                      onChange={(e) => setMinStorage(Number(e.target.value))}
                      className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary"
                    >
                      <option value={0}>Any</option>
                      <option value={256}>256GB+</option>
                      <option value={512}>512GB+</option>
                      <option value={1000}>1TB+</option>
                    </select>
                  </label>
                  <label>
                    <span className="text-[11px] font-bold uppercase tracking-wide text-muted">Minimum screen size</span>
                    <select
                      value={minScreen}
                      onChange={(e) => setMinScreen(Number(e.target.value))}
                      className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary"
                    >
                      <option value={0}>Any</option>
                      <option value={13}>13&quot;+</option>
                      <option value={15}>15&quot;+</option>
                      <option value={17}>17&quot;+</option>
                    </select>
                  </label>
                  <label className="sm:col-span-2">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-muted">Condition</span>
                    <select
                      value={condition}
                      onChange={(e) => setCondition(e.target.value as any)}
                      className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary"
                    >
                      <option value="any">Any condition</option>
                      <option value="new">Brand new</option>
                      <option value="refurbished">Refurbished</option>
                    </select>
                  </label>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="font-display text-lg font-bold text-ink">What is your budget?</h2>
                <p className="text-xs text-muted">We only show laptops at or below this price.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {BUDGETS.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setBudget(b)}
                      className={`rounded-lg border px-3 py-2 text-sm font-bold transition ${
                        budget === b ? 'border-primary bg-primary text-white' : 'border-line bg-white text-ink hover:border-primary'
                      }`}
                    >
                      {formatKES(b)}
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-sm text-ink">
                  Selected: <span className="font-bold text-primary">{formatKES(budget)}</span> or less
                </p>
              </div>
            )}

            <div className="mt-6 flex items-center justify-between">
              <button
                type="button"
                onClick={() => (step === 0 ? (window.location.href = '/shop?category=laptops') : setStep(step - 1))}
                className="btn btn-outline !h-10 text-xs font-bold"
              >
                {step === 0 ? 'Browse all laptops' : 'Back'}
              </button>
              <button
                type="button"
                onClick={() => (step < 2 ? setStep(step + 1) : setShowResults(true))}
                className="btn btn-primary !h-10 px-5 text-xs font-bold"
              >
                {step < 2 ? 'Next' : 'Show matches'} <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        {showResults && (
          <div className="mt-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
              <div>
                <h2 className="font-display text-lg font-bold text-ink">
                  {results.length} matching {results.length === 1 ? 'laptop' : 'laptops'}
                </h2>
                <p className="text-xs text-muted">
                  {USE_OPTIONS.find((o) => o.value === useCase)?.label} · up to {formatKES(budget)}
                  {cpu !== 'any' ? ` · ${cpu}` : ''}
                  {minRam ? ` · ${minRam}GB+ RAM` : ''}
                  {minStorage ? ` · ${minStorage}GB+` : ''}
                </p>
              </div>
              <button type="button" onClick={reset} className="btn btn-outline !h-9 text-xs font-bold">
                <RotateCcw className="h-3.5 w-3.5" /> Start again
              </button>
            </div>

            {loading ? (
              <p className="p-10 text-center text-sm text-muted">Loading catalogue…</p>
            ) : results.length === 0 ? (
              <div className="mt-6 rounded-xl border border-line bg-card p-10 text-center">
                <Laptop className="mx-auto h-8 w-8 text-line" />
                <p className="mt-3 text-sm font-bold text-ink">No exact matches</p>
                <p className="text-xs text-muted">Try a higher budget or fewer requirements, or browse the full catalogue.</p>
                <Link to="/shop?category=laptops" className="btn btn-primary mt-4 !h-10 text-xs font-bold">
                  Browse all laptops
                </Link>
              </div>
            ) : (
              <div className={`mt-4 ${PRODUCT_GRID}`}>
                {results.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}