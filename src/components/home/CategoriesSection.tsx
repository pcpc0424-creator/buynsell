import Link from 'next/link';

const categories = [
  {
    href: '/properties?type=house',
    icon: 'fa-home',
    label: 'HOUSE & LOT',
    count: '2,450+',
    gradient: 'from-blue-500/20 to-blue-600/30',
    iconColor: 'text-blue-500',
  },
  {
    href: '/properties?type=condo',
    icon: 'fa-building',
    label: 'CONDOMINIUM',
    count: '1,850+',
    gradient: 'from-purple-500/20 to-purple-600/30',
    iconColor: 'text-purple-500',
  },
  {
    href: '/properties?type=townhouse',
    icon: 'fa-city',
    label: 'TOWNHOUSE',
    count: '980+',
    gradient: 'from-pink-500/20 to-pink-600/30',
    iconColor: 'text-pink-500',
  },
  {
    href: '/properties?type=commercial',
    icon: 'fa-store',
    label: 'COMMERCIAL',
    count: '560+',
    gradient: 'from-amber-500/20 to-amber-600/30',
    iconColor: 'text-amber-500',
  },
  {
    href: '/properties?type=lot',
    icon: 'fa-map',
    label: 'LOT',
    count: '320+',
    gradient: 'from-green-500/20 to-green-600/30',
    iconColor: 'text-green-500',
  },
  {
    href: '/properties?type=new-development',
    icon: 'fa-hammer',
    label: 'NEW DEVELOP',
    count: '180+',
    gradient: 'from-cyan-500/20 to-cyan-600/30',
    iconColor: 'text-cyan-500',
  },
];

export default function CategoriesSection() {
  return (
    <section className="py-32 relative">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-20">
          <span className="inline-block px-5 py-2 glass-ultra rounded-full text-sm text-slate-600 mb-6">
            <i className="fas fa-th-large mr-2 text-accent-blue"></i>Categories
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-slate-800">
            Find your <span className="gradient-text">needs</span>
          </h2>
          <p className="text-slate-500 text-lg mt-4">Buy & Sell has it all</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {categories.map((category) => (
            <Link
              key={category.href}
              href={category.href}
              className="category-card group cursor-pointer"
            >
              <div className="glass-ultra rounded-3xl p-8 text-center transition-all duration-500">
                <div
                  className={`category-icon w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br ${category.gradient} flex items-center justify-center group-hover:scale-110 transition-all duration-500`}
                >
                  <i className={`fas ${category.icon} text-3xl ${category.iconColor}`}></i>
                </div>
                <h3 className="font-semibold text-slate-800 mb-1">{category.label}</h3>
                <p className="text-sm text-slate-400">{category.count}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
